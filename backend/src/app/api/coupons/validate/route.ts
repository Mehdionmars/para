import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { evaluateCoupon, resolveShipping, type CartLine } from '../../../../lib/pricing'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 20

type ValidateBody = {
  code?: string
  email?: string
  city?: string
  lines?: { id?: number; variantId?: string | null; qty?: number }[]
}

/**
 * Cart-side preview of a coupon: what would this code give on this cart.
 *
 * Returns only the resulting amounts — never the coupon document, its
 * limits, or its eligibility lists. The `coupons` collection itself is
 * staff-only read for exactly that reason, and this route uses
 * overrideAccess internally rather than opening it up.
 *
 * This is a *preview*: it records nothing and reserves nothing. The binding
 * calculation happens again inside /api/checkout, so a coupon that hits its
 * limit between preview and submit is still caught.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  let body: ValidateBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide.', ok: false }, { status: 400 })
  }

  const code = body.code?.trim()
  if (!code) return Response.json({ error: 'Entrez un code promo.', ok: false }, { status: 400 })

  // Keyed by product *and* option, like the cart and the checkout: two
  // contenances of one product can carry two different prices, so collapsing
  // them onto the product id would preview a subtotal the checkout then
  // disagrees with.
  const requested = new Map<string, { productId: number; variantId: string | null; qty: number }>()
  for (const line of body.lines || []) {
    const id = Number(line?.id)
    const qty = Math.floor(Number(line?.qty))
    const variantId = typeof line?.variantId === 'string' && line.variantId.trim() ? line.variantId.trim() : null
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty <= 0) continue
    const key = `${id}::${variantId ?? ''}`
    const existing = requested.get(key)
    if (existing) existing.qty += qty
    else requested.set(key, { productId: id, qty, variantId })
  }
  if (requested.size === 0) {
    return Response.json({ error: 'Votre panier est vide.', ok: false }, { status: 400 })
  }

  const productIds = [...new Set([...requested.values()].map((l) => l.productId))]

  // Prices, category and brand all come from the products table — the body
  // only said which product, which option, and how many.
  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: productIds.length,
    overrideAccess: true,
    where: { id: { in: productIds } },
  })

  type ProductDoc = {
    id: number
    price: number
    category?: string
    brand?: number | { id: number }
    variantPricingMode?: string | null
    variants?: { id?: string | null; price?: number | null }[] | null
  }
  const byId = new Map<number, ProductDoc>(products.docs.map((p) => [(p as ProductDoc).id, p as ProductDoc]))

  const lines: CartLine[] = []
  for (const entry of requested.values()) {
    const doc = byId.get(entry.productId)
    if (!doc) continue

    let price = Number(doc.price)
    if (entry.variantId && doc.variantPricingMode === 'per-variant') {
      const variant = (doc.variants || []).find((v) => String(v?.id) === entry.variantId)
      // In same-price mode a variant row legitimately has no price of its own
      // and the product's is authoritative — the same rule the checkout applies.
      if (variant && variant.price !== null && variant.price !== undefined) price = Number(variant.price)
    }

    lines.push({
      brandId: typeof doc.brand === 'object' && doc.brand ? doc.brand.id : (doc.brand ?? null),
      categoryValue: doc.category ?? null,
      price,
      productId: doc.id,
      quantity: entry.qty,
    })
  }

  if (lines.length === 0) {
    return Response.json({ error: 'Produits introuvables.', ok: false }, { status: 400 })
  }

  const result = await evaluateCoupon({ code, customerEmail: body.email, lines, payload })
  const subtotal = Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100

  if (!result.ok) {
    // 200, not 4xx: "this code doesn't apply" is a normal cart outcome the UI
    // renders inline, not a transport failure.
    return Response.json({ error: result.message, ok: false, reason: result.reason })
  }

  const shipping = await resolveShipping({
    city: body.city,
    payload,
    subtotalAfterDiscount: subtotal - result.discount,
  })

  return Response.json({
    code: result.code,
    discount: result.discount,
    ok: true,
    shipping: shipping.cost,
    shippingLabel: shipping.label,
    subtotal,
    total: Math.max(0, subtotal - result.discount) + shipping.cost,
  })
}

export const POST = withApiLog('/api/coupons/validate', handlePOST)
