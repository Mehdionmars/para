import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { notifyOrderEvent } from '../../../lib/notifications/service'
import { evaluateCoupon, resolveShipping } from '../../../lib/pricing'
import { withApiLog } from '../../../lib/withApiLog'

export const maxDuration = 30

/** Hard ceiling per line. A storefront cart has no business ordering 10 000
 * units of a cream, and an unbounded quantity is a trivial way to zero out
 * the whole stock of a product. */
const MAX_QTY_PER_LINE = 20

type CheckoutLine = { id?: number; qty?: number }
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

  const name = body.name?.trim()
  const email = body.email?.trim()
  if (!name || !email) {
    return Response.json({ error: 'Nom et email requis.' }, { status: 400 })
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return Response.json({ error: 'Panier vide.' }, { status: 400 })
  }

  // Merge duplicate ids before touching the database: the same product sent
  // twice must become one line of qty 2, not two lines that each pass the
  // stock check on their own and together oversell.
  const requested = new Map<number, number>()
  for (const line of body.lines) {
    const id = Number(line?.id)
    const qty = Math.floor(Number(line?.qty))
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'Produit invalide dans le panier.' }, { status: 400 })
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      return Response.json({ error: 'Quantité invalide.' }, { status: 400 })
    }
    requested.set(id, (requested.get(id) || 0) + qty)
  }

  for (const [id, qty] of requested) {
    if (qty > MAX_QTY_PER_LINE) {
      return Response.json(
        { error: `Quantité maximale de ${MAX_QTY_PER_LINE} par produit dépassée.`, productId: id },
        { status: 400 },
      )
    }
  }

  const pool = payload.db.pool
  const client = await pool.connect()

  const resolved: ResolvedLine[] = []
  const movements: { productId: number; previousStock: number; newStock: number; quantity: number }[] = []
  let subtotal = 0

  try {
    await client.query('BEGIN')

    // Deterministic lock order (ascending id) across every checkout, so two
    // concurrent orders holding overlapping carts can't deadlock by grabbing
    // the same two rows in opposite order.
    const ids = [...requested.keys()].sort((a, b) => a - b)

    for (const id of ids) {
      const qty = requested.get(id)!

      const found = await client.query(
        'SELECT id, name, price, stock, is_published, discontinued, category, brand_id FROM products WHERE id = $1 FOR UPDATE',
        [id],
      )
      const row = found.rows[0]

      if (!row) {
        await client.query('ROLLBACK')
        // The previous implementation silently `continue`d past a missing
        // product, so a customer could be charged for a shorter order than
        // the one they submitted, with no error. Now the whole order fails.
        return Response.json({ error: 'Un produit du panier est introuvable.', productId: id }, { status: 409 })
      }
      if (!row.is_published || row.discontinued) {
        await client.query('ROLLBACK')
        return Response.json(
          { error: `« ${row.name} » n'est plus disponible à la vente.`, productId: id },
          { status: 409 },
        )
      }

      const previousStock = Number(row.stock)
      if (previousStock < qty) {
        await client.query('ROLLBACK')
        return Response.json(
          {
            available: previousStock,
            error:
              previousStock === 0
                ? `« ${row.name} » est en rupture de stock.`
                : `« ${row.name} » : il ne reste que ${previousStock} unité(s).`,
            productId: id,
          },
          { status: 409 },
        )
      }

      const decremented = await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2 AND stock >= $1 RETURNING stock',
        [qty, id],
      )
      if (decremented.rowCount === 0) {
        // Belt-and-braces: the FOR UPDATE above should make this unreachable,
        // but if it ever matches zero the order must not proceed.
        await client.query('ROLLBACK')
        return Response.json({ error: 'Stock insuffisant.', productId: id }, { status: 409 })
      }

      const price = Number(row.price)
      resolved.push({ brandId: row.brand_id ?? null, categoryValue: row.category ?? null, name: row.name, price, productId: id, quantity: qty })
      movements.push({ newStock: Number(decremented.rows[0].stock), previousStock, productId: id, quantity: qty })
      subtotal += price * qty
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    return Response.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la validation du panier.' },
      { status: 500 },
    )
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
        items: resolved.map((l) => ({ name: l.name, price: l.price, product: l.productId, quantity: l.quantity })),
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

    // Notification failures must never fail a paid order: the stock is
    // committed and the sale is real whether or not the email goes out.
    await notifyOrderEvent({ event: 'ORDER_CREATED', order, payload }).catch((err) =>
      payload.logger.error({ err }, `Notification ORDER_CREATED échouée pour ${order.orderNumber}`),
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
        .catch(() => {})
    }

    return Response.json({
      couponApplied: appliedCouponCode,
      discount,
      orderNumber: order.orderNumber,
      shipping,
      shippingLabel: shippingResult.label,
      subtotal,
      total,
    })
  } catch (err) {
    // Compensating write: the stock was already committed above, so an order
    // that fails to save must give it back rather than leave phantom
    // reservations. Errors here are logged as a movement of their own so the
    // discrepancy is never silent.
    const compensation = await pool.connect()
    try {
      await compensation.query('BEGIN')
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
    return Response.json({ error: 'Impossible de créer la commande.' }, { status: 502 })
  }
}

export const POST = withApiLog('/api/checkout', handlePOST)
