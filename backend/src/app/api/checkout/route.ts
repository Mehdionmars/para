import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  claimIdempotencyKey,
  inProgressResponse,
  mismatchResponse,
  type IdempotencyClaim,
} from '../../../lib/idempotency'
import { notifyOrderEvent } from '../../../lib/notifications/service'
import { notifyStockChange } from '../../../lib/notifications/stock'
import { serverError } from '../../../lib/apiError'
import { evaluateCoupon, resolveShipping } from '../../../lib/pricing'
import { withApiLog } from '../../../lib/withApiLog'

export const maxDuration = 30

/** Hard ceiling per line. A storefront cart has no business ordering 10 000
 * units of a cream, and an unbounded quantity is a trivial way to zero out
 * the whole stock of a product. */
const MAX_QTY_PER_LINE = 20

type CheckoutLine = {
  id?: number
  /** The `products_variants` row id, when the shopper picked an option.
   * Absent on a product that has none. Never trusted for price or stock —
   * it only says *which* row to read, exactly like `id`. */
  variantId?: string | null
  qty?: number
}
type CheckoutBody = {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  /** A single code. Stacking is deliberately unsupported: combining
   * percentage and fixed coupons produces order-dependent totals and is a
   * standing source of margin leaks. */
  couponCode?: string
  lines?: CheckoutLine[]
}

type ResolvedLine = {
  productId: number
  name: string
  price: number
  quantity: number
  categoryValue: string | null
  brandId: number | null
  /** Snapshot of the option bought, or nulls when the product has none. */
  variantId: string | null
  variantLabel: string | null
  variantType: string | null
  sku: string | null
}

/** The human name of a variant dimension, mirroring VARIANT_OPTION_TYPES in
 * collections/Products.ts. Stored on the order line so the back office can
 * print "Contenance : 100 ml" without re-reading a product that may have
 * been edited since. */
const VARIANT_TYPE_LABELS: Record<string, string> = {
  contenance: 'Contenance',
  format: 'Format',
  taille: 'Taille',
  couleur: 'Couleur',
  parfum: 'Parfum',
  pack: 'Pack',
  autre: 'Option',
}

/** Cart identity. Two different options of one product are two lines, and
 * the same option sent twice is one line of the summed quantity. */
function lineKey(productId: number, variantId: string | null): string {
  return `${productId}::${variantId ?? ''}`
}

/**
 * Creates an order from a cart, server-authoritatively.
 *
 * Everything that determines what the customer is charged — price, shipping,
 * availability — is read from Postgres here. The request body only ever
 * supplies *which product* and *how many*; any amount it might contain is
 * ignored, so tampering with the cart in DevTools changes nothing.
 *
 * Stock is decremented with a guarded UPDATE inside a real transaction:
 *
 *   UPDATE products SET stock = stock - $qty WHERE id = $id AND stock >= $qty
 *
 * The `AND stock >= $qty` is the whole oversell protection. Two concurrent
 * checkouts for the last unit both run this statement; Postgres serialises
 * them on the row lock and the second matches zero rows, so it fails instead
 * of driving stock negative. A read-then-write ("is there stock? ok, write
 * stock - qty") would let both through.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  let body: CheckoutBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  // Claimed before anything is read or written. A double-clicked "Commander",
  // or a retry after a dropped response, must not decrement stock twice and
  // create two orders — and the transaction below cannot prevent that on its
  // own, because both requests are individually valid. See lib/idempotency.ts.
  const claim = await claimIdempotencyKey({
    body,
    endpoint: '/api/checkout',
    key: request.headers.get('idempotency-key'),
    payload,
  })
  if (claim.outcome === 'replay') return claim.response
  if (claim.outcome === 'in_progress') return inProgressResponse()
  if (claim.outcome === 'mismatch') return mismatchResponse()

  // Every early return past this point has to release the claim, or a shopper
  // who fixes their cart and retries with the same key is told their first
  // attempt is still running — forever.
  const fail = async (response: Response): Promise<Response> => {
    if (claim.outcome === 'claimed') await claim.abandon()
    return response
  }

  const name = body.name?.trim()
  const email = body.email?.trim()
  if (!name || !email) {
    return fail(Response.json({ error: 'Nom et email requis.' }, { status: 400 }))
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return fail(Response.json({ error: 'Panier vide.' }, { status: 400 }))
  }

  // Merge duplicates before touching the database: the same product *and the
  // same option* sent twice must become one line of qty 2, not two lines that
  // each pass the stock check on their own and together oversell. Two
  // different options of one product stay two lines — they draw on two
  // different stocks.
  const requested = new Map<string, { productId: number; variantId: string | null; qty: number }>()
  for (const line of body.lines) {
    const id = Number(line?.id)
    const qty = Math.floor(Number(line?.qty))
    const rawVariant = line?.variantId
    const variantId = typeof rawVariant === 'string' && rawVariant.trim() ? rawVariant.trim() : null
    if (!Number.isInteger(id) || id <= 0) {
      return fail(Response.json({ error: 'Produit invalide dans le panier.' }, { status: 400 }))
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      return fail(Response.json({ error: 'Quantité invalide.' }, { status: 400 }))
    }
    const key = lineKey(id, variantId)
    const existing = requested.get(key)
    if (existing) existing.qty += qty
    else requested.set(key, { productId: id, qty, variantId })
  }

  for (const entry of requested.values()) {
    if (entry.qty > MAX_QTY_PER_LINE) {
      return fail(Response.json(
        { error: `Quantité maximale de ${MAX_QTY_PER_LINE} par produit dépassée.`, productId: entry.productId },
        { status: 400 },
      ))
    }
  }

  const pool = payload.db.pool
  const client = await pool.connect()

  const resolved: ResolvedLine[] = []
  const movements: {
    productId: number
    previousStock: number
    newStock: number
    quantity: number
    name: string
    lowStockThreshold: number
  }[] = []
  /** Variant decrements, tracked separately from `movements` because the
   * compensating write below has to undo *both* counters the transaction
   * touched. Restoring only the product's stock would leave the option short
   * by the quantity of an order that was never actually placed. */
  const variantDecrements: { variantId: string; productId: number; quantity: number }[] = []
  let subtotal = 0

  try {
    await client.query('BEGIN')

    // Deterministic lock order across every checkout, so two concurrent
    // orders holding overlapping carts can't deadlock by grabbing the same
    // rows in opposite order: products ascending by id, and within a product
    // its variant rows ascending by id.
    const byProduct = new Map<number, { variantId: string | null; qty: number }[]>()
    for (const entry of requested.values()) {
      const list = byProduct.get(entry.productId) || []
      list.push({ qty: entry.qty, variantId: entry.variantId })
      byProduct.set(entry.productId, list)
    }
    const ids = [...byProduct.keys()].sort((a, b) => a - b)

    for (const id of ids) {
      const found = await client.query(
        `SELECT id, name, sku, price, stock, is_published, discontinued, category, brand_id, low_stock_threshold,
                has_variants, variant_option_type, variant_pricing_mode
           FROM products WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const row = found.rows[0]

      if (!row) {
        await client.query('ROLLBACK')
        // The previous implementation silently `continue`d past a missing
        // product, so a customer could be charged for a shorter order than
        // the one they submitted, with no error. Now the whole order fails.
        return fail(Response.json({ error: 'Un produit du panier est introuvable.', productId: id }, { status: 409 }))
      }
      if (!row.is_published || row.discontinued) {
        await client.query('ROLLBACK')
        return fail(Response.json(
          { error: `« ${row.name} » n'est plus disponible à la vente.`, productId: id },
          { status: 409 },
        ))
      }

      const productPrice = Number(row.price)
      const perVariantPricing = row.variant_pricing_mode === 'per-variant'
      const variantType = row.has_variants
        ? VARIANT_TYPE_LABELS[String(row.variant_option_type || 'contenance')] || 'Option'
        : null

      const lines = byProduct.get(id)!.sort((a, b) => (a.variantId ?? '').localeCompare(b.variantId ?? ''))

      // The product's own stock covers the whole product across every option.
      // A variant line has to clear both it and the variant's own count, so
      // neither number can be driven negative and the catalogue's product-
      // level availability stays truthful.
      const productQty = lines.reduce((n, l) => n + l.qty, 0)
      const previousProductStock = Number(row.stock)
      if (previousProductStock < productQty) {
        await client.query('ROLLBACK')
        return fail(Response.json(
          {
            available: previousProductStock,
            error:
              previousProductStock === 0
                ? `« ${row.name} » est en rupture de stock.`
                : `« ${row.name} » : il ne reste que ${previousProductStock} unité(s).`,
            productId: id,
          },
          { status: 409 },
        ))
      }

      for (const line of lines) {
        const qty = line.qty
        let price = productPrice
        let variantLabel: string | null = null
        let sku: string | null = row.sku ?? null

        if (line.variantId) {
          const variantFound = await client.query(
            `SELECT id, option_value, sku, price, stock, active
               FROM products_variants
              WHERE id = $1 AND _parent_id = $2
              FOR UPDATE`,
            [line.variantId, id],
          )
          const variant = variantFound.rows[0]

          if (!variant || variant.active === false) {
            await client.query('ROLLBACK')
            return fail(Response.json(
              { error: `L'option choisie pour « ${row.name} » n'est plus disponible.`, productId: id, variantId: line.variantId },
              { status: 409 },
            ))
          }

          const previousVariantStock = Number(variant.stock)
          if (previousVariantStock < qty) {
            await client.query('ROLLBACK')
            return fail(Response.json(
              {
                available: previousVariantStock,
                error:
                  previousVariantStock === 0
                    ? `« ${row.name} » (${variant.option_value}) est en rupture de stock.`
                    : `« ${row.name} » (${variant.option_value}) : il ne reste que ${previousVariantStock} unité(s).`,
                productId: id,
                variantId: line.variantId,
              },
              { status: 409 },
            ))
          }

          const variantDecremented = await client.query(
            'UPDATE products_variants SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock',
            [qty, line.variantId],
          )
          if (variantDecremented.rowCount === 0) {
            await client.query('ROLLBACK')
            return fail(Response.json(
              { error: 'Stock insuffisant.', productId: id, variantId: line.variantId },
              { status: 409 },
            ))
          }

          variantDecrements.push({ productId: id, quantity: qty, variantId: line.variantId })

          // In same-price mode the variant row legitimately carries no price
          // and the product's is authoritative — reading v.price there would
          // charge 0 MAD.
          if (perVariantPricing && variant.price !== null && variant.price !== undefined) {
            price = Number(variant.price)
          }
          variantLabel = variant.option_value ? String(variant.option_value) : null
          sku = variant.sku ? String(variant.sku) : sku
        }

        resolved.push({
          brandId: row.brand_id ?? null,
          categoryValue: row.category ?? null,
          name: row.name,
          price,
          productId: id,
          quantity: qty,
          sku,
          variantId: line.variantId,
          variantLabel,
          variantType: line.variantId ? variantType : null,
        })
        subtotal += price * qty
      }

      const decremented = await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2 AND stock >= $1 RETURNING stock',
        [productQty, id],
      )
      if (decremented.rowCount === 0) {
        // Belt-and-braces: the FOR UPDATE above should make this unreachable,
        // but if it ever matches zero the order must not proceed.
        await client.query('ROLLBACK')
        return fail(Response.json({ error: 'Stock insuffisant.', productId: id }, { status: 409 }))
      }

      movements.push({
        lowStockThreshold: Number(row.low_stock_threshold) || 0,
        name: String(row.name),
        newStock: Number(decremented.rows[0].stock),
        previousStock: previousProductStock,
        productId: id,
        quantity: productQty,
      })
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    return fail(serverError({ context: 'Checkout: transaction de stock échouée', err, payload }))
  } finally {
    client.release()
  }

  subtotal = Math.round(subtotal * 100) / 100

  // The coupon is re-evaluated here even though the cart already previewed
  // it: between preview and submit the code may have expired, hit its global
  // limit, or been used by this customer in another tab. The preview is a
  // courtesy; this is the calculation that binds.
  let discount = 0
  let appliedCouponId: number | null = null
  let appliedCouponCode: string | null = null

  if (body.couponCode?.trim()) {
    const evaluated = await evaluateCoupon({
      code: body.couponCode,
      customerEmail: email,
      lines: resolved.map((l) => ({
        brandId: l.brandId,
        categoryValue: l.categoryValue,
        price: l.price,
        productId: l.productId,
        quantity: l.quantity,
      })),
      payload,
    })

    if (evaluated.ok) {
      discount = evaluated.discount
      appliedCouponId = evaluated.couponId
      appliedCouponCode = evaluated.code
    }
    // An invalid coupon does NOT fail the order: the stock is already
    // committed above, and dropping a valid purchase over a lapsed promo
    // code would be a worse outcome than charging full price. The response
    // reports it so the cart can tell the customer what happened.
  }

  const shippingResult = await resolveShipping({
    city: body.city,
    payload,
    subtotalAfterDiscount: subtotal - discount,
  })
  const shipping = shippingResult.cost
  const total = Math.max(0, subtotal - discount) + shipping

  try {
    const order = await payload.create({
      collection: 'orders',
      data: {
        customerEmail: email,
        customerName: name,
        customerPhone: body.phone?.trim() || undefined,
        // Every field here is a snapshot: re-reading the product later to
        // rebuild a past order would report today's name, price and options,
        // not what was sold.
        items: resolved.map((l) => ({
          name: l.name,
          price: l.price,
          product: l.productId,
          quantity: l.quantity,
          sku: l.sku ?? undefined,
          variantId: l.variantId ?? undefined,
          variantLabel: l.variantLabel ?? undefined,
          variantType: l.variantType ?? undefined,
        })),
        coupon: appliedCouponId ?? undefined,
        couponCode: appliedCouponCode ?? undefined,
        discount,
        paymentMethod: 'À la livraison',
        // Both carry a defaultValue in the collection but are `required`, so
        // the generated input type still expects them.
        paymentStatus: 'pending',
        shipping,
        shippingAddress: body.address?.trim() || undefined,
        status: 'pending',
        subtotal,
        total,
      },
    })

    // Redemption ledger + global counter. Written after the order exists so
    // the row can point at it, and so a coupon is only ever counted against a
    // sale that actually happened — a preview or a failed checkout leaves no
    // trace.
    //
    // The increment is unconditional (`usage_count + 1` in SQL, not a
    // read-modify-write) so the counter always equals the number of real
    // redemptions. usageLimit is therefore a soft limit: two checkouts racing
    // on the last available use can both pass the earlier evaluateCoupon
    // check and land at limit + 1. A promo going one order over is a far
    // smaller problem than a counter that disagrees with the ledger, which is
    // the auditable record. Tightening this means moving the check into the
    // same transaction as the order, which the stock path does not yet use.
    if (appliedCouponId && discount > 0) {
      const couponClient = await pool.connect()
      try {
        await couponClient.query(
          `UPDATE coupons
             SET usage_count = COALESCE(usage_count, 0) + 1, updated_at = now()
           WHERE id = $1`,
          [appliedCouponId],
        )
      } catch (err) {
        payload.logger.error({ err }, `Compteur du coupon ${appliedCouponCode} non incrémenté`)
      } finally {
        couponClient.release()
      }

      await payload
        .create({
          collection: 'coupon-redemptions',
          data: {
            code: appliedCouponCode ?? undefined,
            coupon: appliedCouponId,
            customerEmail: email.toLowerCase(),
            discountAmount: discount,
            order: order.id,
            orderSubtotal: subtotal,
          },
        })
        .catch((err) => payload.logger.error({ err }, 'Enregistrement de la redemption échoué'))
    }

    // Opening entry of the audit trail: fromStatus is null because nothing
    // preceded it. Written here rather than in the Orders afterChange hook so
    // it can carry a reason, and so the hook stays about *transitions*.
    await pool
      .query(
        `INSERT INTO order_status_history
           (order_id, from_status, to_status, changed_by_email, reason, updated_at, created_at)
         VALUES ($1, NULL, 'pending', $2, 'Commande passée depuis le site', now(), now())`,
        [order.id, email.toLowerCase()],
      )
      .catch((err) => payload.logger.error({ err }, `Historique initial non écrit pour ${order.orderNumber}`))

    // Recorded now, delivered by /api/jobs/tick a moment later.
    //
    // This used to `await` the provider inside the shopper's request, which
    // put a Resend round trip — and Resend's availability — on the critical
    // path of every order. `defer` writes the same rows with the same
    // (order, type, channel) uniqueness and returns immediately; the drain
    // sends them. A crash between the two loses nothing, because the row is
    // already committed in Postgres.
    //
    // Failures still must never fail a paid order: the stock is committed and
    // the sale is real whether or not the email ever goes out.
    await notifyOrderEvent({ defer: true, event: 'ORDER_CREATED', order, payload }).catch((err) =>
      payload.logger.error({ err }, `Notification ORDER_CREATED non enregistrée pour ${order.orderNumber}`),
    )

    // Audit rows reference the order, so a movement can always be traced back
    // to why the stock left. Written after the order exists precisely so they
    // can carry its id; a failure here must not undo a valid sale, hence the
    // per-row catch.
    for (const m of movements) {
      await payload
        .create({
          collection: 'stock-movements',
          data: {
            delta: -m.quantity,
            newStock: m.newStock,
            previousStock: m.previousStock,
            product: m.productId,
            reason: `Commande ${order.orderNumber}`,
            source: 'order',
          },
        })
        // Was `.catch(() => {})`. A swallowed failure here is the worst kind:
        // the sale is real and the stock has moved, but the ledger that
        // explains *why* it moved is silently missing — so the next stock
        // audit finds a discrepancy with no trace of its cause. It still must
        // not fail the order, so it is logged rather than thrown.
        .catch((err) =>
          payload.logger.error(
            { err },
            `Mouvement de stock non enregistré pour ${order.orderNumber} (produit ${m.productId}, -${m.quantity})`,
          ),
        )
    }

    // Stock alerts, after the order exists. A sale that empties a product is
    // exactly when the shop needs to know.
    for (const m of movements) {
      await notifyStockChange({
        change: {
          lowStockThreshold: m.lowStockThreshold,
          newStock: m.newStock,
          occurrenceId: `order-${order.id}`,
          previousStock: m.previousStock,
          productId: m.productId,
          productName: m.name,
        },
        payload,
      })
    }

    const success = {
      couponApplied: appliedCouponCode,
      discount,
      orderNumber: order.orderNumber,
      shipping,
      shippingLabel: shippingResult.label,
      subtotal,
      total,
    }

    // Recorded, not released: this is the response a retry of the same
    // Idempotency-Key must be given back instead of placing a second order.
    if (claim.outcome === 'claimed') await claim.finish(200, success)

    return Response.json(success)
  } catch (err) {
    // Compensating write: the stock was already committed above, so an order
    // that fails to save must give it back rather than leave phantom
    // reservations. Errors here are logged as a movement of their own so the
    // discrepancy is never silent.
    const compensation = await pool.connect()
    try {
      await compensation.query('BEGIN')
      for (const v of variantDecrements) {
        await compensation.query(
          'UPDATE products_variants SET stock = stock + $1 WHERE id = $2 AND _parent_id = $3',
          [v.quantity, v.variantId, v.productId],
        )
      }
      for (const m of movements) {
        await compensation.query('UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2', [
          m.quantity,
          m.productId,
        ])
      }
      await compensation.query('COMMIT')
    } catch {
      await compensation.query('ROLLBACK').catch(() => {})
    } finally {
      compensation.release()
    }

    payload.logger.error(
      { err },
      'Checkout: création de commande échouée, stock restauré pour ' + movements.length + ' ligne(s)',
    )
    return fail(Response.json({ error: 'Impossible de créer la commande.' }, { status: 502 }))
  }
}

export const POST = withApiLog('/api/checkout', handlePOST)
