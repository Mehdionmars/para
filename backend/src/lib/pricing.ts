import type { Payload } from 'payload'

/**
 * Coupon validation and shipping resolution.
 *
 * Deliberately one module used by both `/api/coupons/validate` (the cart's
 * live preview) and `/api/checkout` (the binding calculation). If the two
 * computed discounts independently they would eventually disagree, and the
 * shopper would be quoted one price and charged another.
 *
 * Nothing here reads an amount from the request. Prices come from the
 * products table, the discount from the coupon row, the shipping from the
 * shipping-rules table — so a tampered cart payload changes nothing.
 */

export type CartLine = {
  productId: number
  /** Unit price as read from the products table, never from the client. */
  price: number
  quantity: number
  categoryValue?: string | null
  brandId?: number | null
}

export type CouponFailureReason =
  | 'not_found'
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'minimum_not_met'
  | 'usage_limit_reached'
  | 'customer_limit_reached'
  | 'not_applicable'

export type CouponResult =
  | { ok: true; couponId: number; code: string; discount: number; eligibleSubtotal: number }
  | { ok: false; reason: CouponFailureReason; message: string; minimumAmount?: number }

/** Money is stored in whole MAD across this catalogue; rounding here keeps
 * the discount from producing fractional dirhams a receipt can't show. */
const round = (n: number) => Math.round(n * 100) / 100

type CouponDoc = {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minimumAmount?: number | null
  maximumDiscount?: number | null
  startDate?: string | null
  endDate?: string | null
  usageLimit?: number | null
  perCustomerLimit?: number | null
  usageCount?: number | null
  active?: boolean | null
  eligibility?: {
    products?: (number | { id: number })[] | null
    categories?: (number | { id: number })[] | null
    brands?: (number | { id: number })[] | null
  } | null
}

const relIds = (value: (number | { id: number })[] | null | undefined): number[] =>
  (value || []).map((v) => (typeof v === 'object' && v ? v.id : v)).filter((v): v is number => typeof v === 'number')

/**
 * Validates a coupon against a cart and returns the discount in MAD.
 *
 * Order of checks is deliberate: identity and window first (a cheap, certain
 * "no"), then eligibility, then the minimum — because the minimum message
 * quotes the *eligible* subtotal, which only exists once eligibility is known.
 */
export async function evaluateCoupon({
  payload,
  code,
  lines,
  customerEmail,
}: {
  payload: Payload
  code: string
  lines: CartLine[]
  customerEmail?: string | null
}): Promise<CouponResult> {
  const normalised = code.trim().toUpperCase().replace(/\s+/g, '')
  if (!normalised) return { message: 'Code promo vide.', ok: false, reason: 'not_found' }

  const found = await payload.find({
    collection: 'coupons',
    depth: 0,
    limit: 1,
    // Overrides access control: `coupons.read` is staff-only so the code list
    // never leaks, but the public checkout still has to look one up. Only the
    // resulting discount is ever returned to the caller.
    overrideAccess: true,
    where: { code: { equals: normalised } },
  })

  const coupon = found.docs[0] as CouponDoc | undefined
  if (!coupon) return { message: 'Code promo invalide.', ok: false, reason: 'not_found' }
  if (coupon.active === false) return { message: 'Ce code promo n\'est plus actif.', ok: false, reason: 'inactive' }

  const now = Date.now()
  if (coupon.startDate && new Date(coupon.startDate).getTime() > now) {
    return { message: 'Ce code promo n\'est pas encore valable.', ok: false, reason: 'not_started' }
  }
  if (coupon.endDate && new Date(coupon.endDate).getTime() < now) {
    return { message: 'Ce code promo a expiré.', ok: false, reason: 'expired' }
  }

  if (typeof coupon.usageLimit === 'number' && (coupon.usageCount ?? 0) >= coupon.usageLimit) {
    return { message: 'Ce code promo a atteint sa limite d\'utilisation.', ok: false, reason: 'usage_limit_reached' }
  }

  if (typeof coupon.perCustomerLimit === 'number' && customerEmail) {
    const used = await payload.find({
      collection: 'coupon-redemptions',
      depth: 0,
      limit: 0,
      overrideAccess: true,
      where: {
        and: [{ coupon: { equals: coupon.id } }, { customerEmail: { equals: customerEmail.trim().toLowerCase() } }],
      },
    })
    if (used.totalDocs >= coupon.perCustomerLimit) {
      return {
        message: 'Vous avez déjà utilisé ce code promo.',
        ok: false,
        reason: 'customer_limit_reached',
      }
    }
  }

  // Eligibility: an empty configuration means the whole cart qualifies.
  // Otherwise the three lists are a union — a line matching any of them is in.
  const productIds = relIds(coupon.eligibility?.products)
  const brandIds = relIds(coupon.eligibility?.brands)
  const categoryIds = relIds(coupon.eligibility?.categories)
  const restricted = productIds.length > 0 || brandIds.length > 0 || categoryIds.length > 0

  // Categories are a relationship on the coupon but a plain enum on the
  // product, so they're matched by the category's *name* — resolved here
  // rather than assumed.
  let categoryNames: string[] = []
  if (categoryIds.length > 0) {
    const cats = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: categoryIds.length,
      overrideAccess: true,
      where: { id: { in: categoryIds } },
    })
    categoryNames = cats.docs.map((c) => String((c as { name?: string }).name || '').toLowerCase())
  }

  const isEligible = (line: CartLine) => {
    if (!restricted) return true
    if (productIds.includes(line.productId)) return true
    if (line.brandId && brandIds.includes(line.brandId)) return true
    if (line.categoryValue && categoryNames.includes(line.categoryValue.toLowerCase())) return true
    return false
  }

  const eligibleSubtotal = round(lines.filter(isEligible).reduce((sum, l) => sum + l.price * l.quantity, 0))
  const cartSubtotal = round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0))

  if (restricted && eligibleSubtotal <= 0) {
    return {
      message: 'Ce code promo ne s\'applique à aucun produit de votre panier.',
      ok: false,
      reason: 'not_applicable',
    }
  }

  // The minimum is checked against the whole cart, not the eligible subset:
  // "minimum 300 MAD d'achat" is a statement about the order, which is how a
  // shopper reads it.
  if (typeof coupon.minimumAmount === 'number' && cartSubtotal < coupon.minimumAmount) {
    return {
      message: `Ce code nécessite un minimum de ${Math.round(coupon.minimumAmount)} MAD d'achat.`,
      minimumAmount: coupon.minimumAmount,
      ok: false,
      reason: 'minimum_not_met',
    }
  }

  let discount =
    coupon.type === 'percentage' ? (eligibleSubtotal * coupon.value) / 100 : Math.min(coupon.value, eligibleSubtotal)

  if (coupon.type === 'percentage' && typeof coupon.maximumDiscount === 'number') {
    discount = Math.min(discount, coupon.maximumDiscount)
  }

  // A discount can never exceed what it applies to — that would turn an order
  // negative and, with a fixed coupon larger than the cart, hand out money.
  discount = round(Math.max(0, Math.min(discount, eligibleSubtotal)))

  if (discount <= 0) {
    return { message: 'Ce code promo ne donne aucune remise sur ce panier.', ok: false, reason: 'not_applicable' }
  }

  return { code: coupon.code, couponId: coupon.id, discount, eligibleSubtotal, ok: true }
}

export type ShippingResult = { cost: number; ruleId: number | null; label: string; freeFrom: number | null }

/** Strips accents and case so "Casablanca", "casablanca" and "CASABLANCA"
 * resolve to the same rule. */
const normaliseCity = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

/**
 * Resolves delivery cost from the shipping-rules collection.
 *
 * `subtotalAfterDiscount` is what the free-shipping threshold is compared
 * against — a coupon that drops a cart under the threshold should also drop
 * the free delivery, otherwise a discount silently buys shipping too.
 */
export async function resolveShipping({
  payload,
  city,
  subtotalAfterDiscount,
}: {
  payload: Payload
  city?: string | null
  subtotalAfterDiscount: number
}): Promise<ShippingResult> {
  const rules = await payload.find({
    collection: 'shipping-rules',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: { enabled: { equals: true } },
  })

  type RuleDoc = { id: number; city?: string; price?: number; freeFrom?: number | null; isDefault?: boolean }
  const docs = rules.docs as RuleDoc[]

  const wanted = city ? normaliseCity(city) : ''
  const match =
    (wanted && docs.find((r) => r.city && normaliseCity(r.city) === wanted)) ||
    docs.find((r) => r.isDefault) ||
    null

  if (!match) {
    // No rules configured at all — delivery is free rather than an invented
    // amount. Charging a number nobody entered would be worse than free.
    return { cost: 0, freeFrom: null, label: 'Livraison', ruleId: null }
  }

  const freeFrom = typeof match.freeFrom === 'number' ? match.freeFrom : null
  const isFree = freeFrom !== null && subtotalAfterDiscount >= freeFrom
  return {
    cost: isFree ? 0 : Number(match.price ?? 0),
    freeFrom,
    label: match.city ? `Livraison ${match.city}` : 'Livraison',
    ruleId: match.id,
  }
}
