import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { evaluateCoupon, resolveShipping, type CartLine } from '../../../../lib/pricing'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 20

type ValidateBody = {
  code?: string
  email?: string
  city?: string
  lines?: { id?: number; qty?: number }[]
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

  const requested = new Map<number, number>()
  for (const line of body.lines || []) {
    const id = Number(line?.id)
    const qty = Math.floor(Number(line?.qty))
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty <= 0) continue
    requested.set(id, (requested.get(id) || 0) + qty)
  }
  if (requested.size === 0) {
    return Response.json({ error: 'Votre panier est vide.', ok: false }, { status: 400 })
  }

  // Prices, category and brand all come from the products table — the body
  // only said which product and how many.
  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: requested.size,
    overrideAccess: true,
    where: { id: { in: [...requested.keys()] } },
  })

  const lines: CartLine[] = products.docs.map((p) => {
    const doc = p as { id: number; price: number; category?: string; brand?: number | { id: number } }
    return {
      brandId: typeof doc.brand === 'object' && doc.brand ? doc.brand.id : (doc.brand ?? null),
      categoryValue: doc.category ?? null,
      price: Number(doc.price),
      productId: doc.id,
      quantity: requested.get(doc.id) || 0,
    }
  })

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
