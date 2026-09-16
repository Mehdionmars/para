/**
 * The routine offer, as the storefront previews it.
 *
 * Authority note — the same one as totals.ts: none of this binds.
 * backend/src/lib/routineOffer.ts prices the lot at checkout from the
 * database, and additionally checks that every product is associated with the
 * one the lot was built from. The product page only ever builds lots that pass
 * that check, so the arithmetic here must match the server's exactly or the
 * shopper is quoted one amount and charged another:
 *
 * - one unit of each distinct product in the lot, at its current price;
 * - the product the lot was built from (the anchor) must be in it;
 * - between `minItems` and three products, all still in the cart;
 * - no product counts towards two lots.
 *
 * Dependency-free on purpose, like totals.ts, so it is unit-tested directly.
 */

export type RoutineOffer = { enabled: boolean; percent: number; minItems: number };
export type CartRoutine = { anchorId: number; productIds: number[] };
/** The only facts about a cart line the offer reads. */
export type RoutineLine = { productId: number; price: number; qty: number };

/** Mirrors ROUTINE_MAX_ITEMS / ROUTINE_MAX_LOTS / ROUTINE_MAX_PERCENT in the
 * backend module. A drift here is a preview the server will not honour. */
export const ROUTINE_MAX_ITEMS = 3;
export const ROUTINE_MAX_LOTS = 5;
export const ROUTINE_MAX_PERCENT = 50;

export const ROUTINE_OFF: RoutineOffer = { enabled: false, minItems: 2, percent: 0 };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Same reading as the server's parseRoutineSettings: unset or out-of-range
 * switches the offer off rather than guessing. */
export function parseRoutineOffer(raw: unknown): RoutineOffer {
  const group = (raw ?? {}) as { enabled?: unknown; percent?: unknown; minItems?: unknown };
  const percent = Number(group.percent);
  const minItems = Math.floor(Number(group.minItems));
  const valid = group.enabled === true && Number.isFinite(percent) && percent > 0 && percent <= ROUTINE_MAX_PERCENT;
  return {
    enabled: valid,
    minItems: Number.isFinite(minItems) ? Math.min(ROUTINE_MAX_ITEMS, Math.max(2, minItems)) : 2,
    percent: valid ? percent : 0,
  };
}

/** The discount on one lot, from the unit price of each of its products. */
export function lotDiscount(offer: RoutineOffer, unitPrices: number[]): number {
  if (!offer.enabled || unitPrices.length < offer.minItems || unitPrices.length > ROUTINE_MAX_ITEMS) return 0;
  return round2((unitPrices.reduce((sum, p) => sum + p, 0) * offer.percent) / 100);
}

/** What the cart previews for all its lots together. */
export function routineDiscount({
  offer,
  routines,
  lines,
}: {
  offer: RoutineOffer;
  routines: CartRoutine[];
  lines: RoutineLine[];
}): number {
  if (!offer.enabled) return 0;

  // Cheapest unit per product, exactly as the server counts it.
  const unitPrice = new Map<number, number>();
  for (const line of lines) {
    if (line.qty < 1) continue;
    const current = unitPrice.get(line.productId);
    unitPrice.set(line.productId, current === undefined ? line.price : Math.min(current, line.price));
  }

  const used = new Set<number>();
  let total = 0;
  for (const lot of routines.slice(0, ROUTINE_MAX_LOTS)) {
    const ids = [...new Set(lot.productIds)];
    if (!ids.includes(lot.anchorId)) continue;
    if (ids.some((id) => used.has(id) || !unitPrice.has(id))) continue;
    const discount = lotDiscount(offer, ids.map((id) => unitPrice.get(id)!));
    if (discount <= 0) continue;
    ids.forEach((id) => used.add(id));
    total += discount;
  }
  return round2(total);
}

/**
 * Adds a lot built from one product page. Building a second lot from the same
 * product replaces the first, and a product can only belong to one lot — the
 * newest claim wins, the older lot loses that product (and with it, usually,
 * its discount). Same rule as the server, so the preview never counts a
 * product twice.
 */
export function withRoutine(routines: CartRoutine[], lot: CartRoutine): CartRoutine[] {
  const ids = [...new Set(lot.productIds)];
  const others = routines
    .filter((r) => r.anchorId !== lot.anchorId)
    .map((r) => ({ ...r, productIds: r.productIds.filter((id) => !ids.includes(id)) }))
    .filter((r) => r.productIds.includes(r.anchorId) && r.productIds.length >= 2);
  return [...others, { anchorId: lot.anchorId, productIds: ids }].slice(-ROUTINE_MAX_LOTS);
}

/** Lots whose products are all still in the cart. A lot the shopper broke by
 * removing a product is dropped rather than kept dormant. */
export function keepLiveRoutines(routines: CartRoutine[], lines: RoutineLine[]): CartRoutine[] {
  const inCart = new Set(lines.filter((l) => l.qty > 0).map((l) => l.productId));
  return routines.filter((r) => r.productIds.every((id) => inCart.has(id)));
}

/** Reads what localStorage holds, which is whatever an older build or a user
 * left there. Malformed entries are dropped. */
export function parseStoredRoutines(raw: unknown): CartRoutine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartRoutine[] = [];
  for (const entry of raw) {
    const anchorId = Number((entry as { anchorId?: unknown })?.anchorId);
    const ids = (entry as { productIds?: unknown })?.productIds;
    if (!Number.isInteger(anchorId) || !Array.isArray(ids)) continue;
    const productIds = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (productIds.includes(anchorId) && productIds.length <= ROUTINE_MAX_ITEMS) out.push({ anchorId, productIds });
  }
  return out.slice(-ROUTINE_MAX_LOTS);
}
