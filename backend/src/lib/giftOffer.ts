import type { Payload } from 'payload'

/**
 * The gift offer: a free item once an order holds enough products of one
 * brand ("3 produits Filorga achetés = Summer Trousse offerte").
 *
 * ## Why this is server-side
 *
 * The cart previews the gift, but the order is what the shop packs. Checkout
 * decides it from the lines it has already priced and locked from the
 * database, and writes the gift onto the order (`giftLabel`) — so the person
 * preparing the parcel reads it there, and a request that merely claims a gift
 * gets nothing. Nothing about the gift comes from the request body.
 *
 * ## What counts
 *
 * Units, not distinct products: three tubes of the same cream are three
 * products bought. One gift per order, however many times the threshold is
 * crossed — the visual promises "une trousse", not one per three items.
 *
 * It costs nothing and changes no amount, so it stacks with a coupon and with
 * the routine offer.
 */

export type GiftSettings = {
  enabled: boolean
  brandId: number | null
  minItems: number
  giftName: string
}
export type GiftLine = { brandId: number | null; quantity: number }
export type GiftResult = { granted: boolean; count: number; giftLabel: string | null }

/** Above this an entry in the CMS is a typo, not an offer. */
export const GIFT_MAX_ITEMS = 20
export const GIFT_DEFAULT_NAME = 'Cadeau offert'

const NONE: GiftResult = { count: 0, giftLabel: null, granted: false }

const relationId = (raw: unknown): number | null => {
  const id = typeof raw === 'object' && raw !== null ? Number((raw as { id?: unknown }).id) : Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** Reads the CMS group. An offer without a brand is off: "any three products"
 * is not what anyone configured. */
export function parseGiftSettings(raw: unknown): GiftSettings {
  const group = (raw ?? {}) as { enabled?: unknown; brand?: unknown; minItems?: unknown; giftName?: unknown }
  const brandId = relationId(group.brand)
  const minItems = Math.floor(Number(group.minItems))
  const giftName = typeof group.giftName === 'string' && group.giftName.trim() ? group.giftName.trim() : GIFT_DEFAULT_NAME
  return {
    brandId,
    enabled: group.enabled === true && brandId !== null,
    giftName,
    minItems: Number.isFinite(minItems) ? Math.min(GIFT_MAX_ITEMS, Math.max(1, minItems)) : 3,
  }
}

/** The rule itself, with every input already loaded. */
export function computeGift({ settings, lines }: { settings: GiftSettings; lines: GiftLine[] }): GiftResult {
  if (!settings.enabled || settings.brandId === null) return NONE
  const count = lines.reduce(
    (n, line) => (line.brandId === settings.brandId && line.quantity > 0 ? n + Math.floor(line.quantity) : n),
    0,
  )
  const granted = count >= settings.minItems
  return { count, giftLabel: granted ? settings.giftName : null, granted }
}

/** Loads the settings and applies the rule. No database call when the order
 * holds nothing that could qualify. */
export async function resolveGift({ payload, lines }: { payload: Payload; lines: GiftLine[] }): Promise<GiftResult> {
  if (!lines.some((l) => l.brandId !== null)) return NONE
  try {
    const global = await payload.findGlobal({ slug: 'payment-settings', depth: 0 })
    return computeGift({ lines, settings: parseGiftSettings((global as { giftOffer?: unknown })?.giftOffer) })
  } catch {
    // Unreadable settings mean no gift, never a failed order.
    return NONE
  }
}
