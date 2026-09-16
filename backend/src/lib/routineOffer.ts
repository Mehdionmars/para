import type { Payload } from 'payload'

/**
 * The routine offer: a percentage off a lot of products bought together from
 * the "Complétez votre routine" block on a product page.
 *
 * ## Why this is server-side
 *
 * The block used to print a 15% lot total while the cart added the products
 * at full price and checkout knew nothing about lots — the shopper was quoted
 * one amount and charged another. The storefront still previews the discount,
 * but this module is what binds: `/api/checkout` calls it with the lines it
 * has already priced from the database, and the only thing it takes from the
 * request is *which products the shopper says form a lot*.
 *
 * ## What makes a lot valid
 *
 * A claimed lot is honoured only if every one of these holds, so a tampered
 * request cannot turn "any two products" into a discount:
 *
 * - the offer is switched on in the CMS (payment-settings → Offre routine);
 * - it names the product it was built from (the anchor) and between
 *   `minItems` and three distinct products in total;
 * - every product in it is actually in the order;
 * - every other product is associated with the anchor: picked in either
 *   product's "Produits associés", or in the same category — the same rule
 *   the product page uses to suggest them;
 * - no product counts towards two lots.
 *
 * An invalid lot is ignored rather than failing the order, like a lapsed
 * coupon: the purchase is real, only the discount is not.
 *
 * ## What it discounts
 *
 * One unit of each product in the lot. A lot is "these products together";
 * ordering three of the serum does not make three routines. When a product is
 * in the order under several options, the cheapest unit is the one counted,
 * so choosing options can never enlarge the discount.
 */

export type RoutineSettings = { enabled: boolean; percent: number; minItems: number }
export type RoutineLotRequest = { anchorId: number; productIds: number[] }
export type RoutineProductFacts = { id: number; category: string | null; relatedIds: number[] }
export type RoutinePricedLine = { productId: number; price: number; quantity: number }
export type RoutineLotResult = { anchorId: number; productIds: number[]; discount: number }
export type RoutineResult = { discount: number; lots: RoutineLotResult[] }

/** The block shows three cards; a lot larger than that was not built by it. */
export const ROUTINE_MAX_ITEMS = 3
/** A cart holds a handful of routines at most. The cap bounds the work a
 * crafted request can ask of the checkout, not a business rule. */
export const ROUTINE_MAX_LOTS = 5
/** Above this an entry in the CMS is a typo (150 for 15), not an offer. */
export const ROUTINE_MAX_PERCENT = 50

const NONE: RoutineResult = { discount: 0, lots: [] }
const round = (n: number) => Math.round(n * 100) / 100

/** Reads the CMS group. Anything missing or out of range switches the offer
 * off rather than guessing a value — a discount nobody configured must never
 * be granted. */
export function parseRoutineSettings(raw: unknown): RoutineSettings {
  const group = (raw ?? {}) as { enabled?: unknown; percent?: unknown; minItems?: unknown }
  const percent = Number(group.percent)
  const minItems = Math.floor(Number(group.minItems))
  const valid = group.enabled === true && Number.isFinite(percent) && percent > 0 && percent <= ROUTINE_MAX_PERCENT
  return {
    enabled: valid,
    minItems: Number.isFinite(minItems) ? Math.min(ROUTINE_MAX_ITEMS, Math.max(2, minItems)) : 2,
    percent: valid ? percent : 0,
  }
}

/** Parses the `routines` field of a checkout body, which is whatever the
 * client sent. Malformed entries are dropped, never thrown on. */
export function parseRoutineLots(raw: unknown): RoutineLotRequest[] {
  if (!Array.isArray(raw)) return []
  const out: RoutineLotRequest[] = []
  for (const entry of raw.slice(0, ROUTINE_MAX_LOTS)) {
    const anchorId = Number((entry as { anchorId?: unknown })?.anchorId)
    const ids = (entry as { productIds?: unknown })?.productIds
    if (!Number.isInteger(anchorId) || anchorId <= 0 || !Array.isArray(ids)) continue
    const productIds = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
    if (productIds.length > ROUTINE_MAX_ITEMS) continue
    out.push({ anchorId, productIds })
  }
  return out
}

export function areAssociated(anchor: RoutineProductFacts, other: RoutineProductFacts): boolean {
  if (anchor.relatedIds.includes(other.id) || other.relatedIds.includes(anchor.id)) return true
  return anchor.category !== null && anchor.category === other.category
}

/** The rule itself, with every input already loaded — no database, no
 * request, so each way a lot can be refused is a unit test. */
export function computeRoutineDiscount({
  settings,
  lots,
  lines,
  facts,
}: {
  settings: RoutineSettings
  lots: RoutineLotRequest[]
  lines: RoutinePricedLine[]
  facts: Map<number, RoutineProductFacts>
}): RoutineResult {
  if (!settings.enabled || settings.percent <= 0 || lots.length === 0) return NONE

  const unitPrice = new Map<number, number>()
  for (const line of lines) {
    if (line.quantity < 1) continue
    const current = unitPrice.get(line.productId)
    unitPrice.set(line.productId, current === undefined ? line.price : Math.min(current, line.price))
  }

  const used = new Set<number>()
  const applied: RoutineLotResult[] = []

  for (const lot of lots.slice(0, ROUTINE_MAX_LOTS)) {
    const ids = [...new Set(lot.productIds)]
    if (!ids.includes(lot.anchorId)) continue
    if (ids.length < settings.minItems || ids.length > ROUTINE_MAX_ITEMS) continue
    if (ids.some((id) => used.has(id) || !unitPrice.has(id) || !facts.has(id))) continue

    const anchor = facts.get(lot.anchorId)!
    if (!ids.every((id) => id === anchor.id || areAssociated(anchor, facts.get(id)!))) continue

    const lotSubtotal = ids.reduce((sum, id) => sum + unitPrice.get(id)!, 0)
    const discount = round((lotSubtotal * settings.percent) / 100)
    if (discount <= 0) continue

    ids.forEach((id) => used.add(id))
    applied.push({ anchorId: lot.anchorId, discount, productIds: ids })
  }

  return { discount: round(applied.reduce((sum, lot) => sum + lot.discount, 0)), lots: applied }
}

/**
 * Loads what the rule needs and applies it. Makes no database call at all
 * when the order claims no lot, which is almost every order.
 */
export async function priceRoutineLots({
  payload,
  requested,
  lines,
}: {
  payload: Payload
  requested: RoutineLotRequest[]
  lines: RoutinePricedLine[]
}): Promise<RoutineResult> {
  if (requested.length === 0) return NONE

  let settings: RoutineSettings
  try {
    const global = await payload.findGlobal({ slug: 'payment-settings', depth: 0 })
    settings = parseRoutineSettings((global as { routineOffer?: unknown })?.routineOffer)
  } catch {
    // Unreadable settings mean no offer, not an order failure.
    return NONE
  }
  if (!settings.enabled) return NONE

  const ids = [...new Set(requested.flatMap((lot) => lot.productIds))]
  const found = await payload.find({
    collection: 'products',
    depth: 0,
    limit: ids.length,
    overrideAccess: true,
    pagination: false,
    where: { id: { in: ids } },
  })

  const facts = new Map<number, RoutineProductFacts>()
  for (const doc of found.docs as { id: number; category?: string | null; relatedProducts?: unknown }[]) {
    const related = Array.isArray(doc.relatedProducts) ? doc.relatedProducts : []
    facts.set(doc.id, {
      category: doc.category ?? null,
      id: doc.id,
      relatedIds: related
        .map((r) => (typeof r === 'object' && r !== null ? Number((r as { id?: unknown }).id) : Number(r)))
        .filter((n) => Number.isInteger(n)),
    })
  }

  return computeRoutineDiscount({ facts, lines, lots: requested, settings })
}
