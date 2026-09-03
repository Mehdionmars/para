import { payloadFetch } from "./payload";
import type { Coupon } from "./coupons-types";

export * from "./coupons-types";

/**
 * The most recently created codes, for the overview panel.
 *
 * `depth=0` on purpose: the eligibility group holds relationships to products,
 * categories and brands, and resolving them would pull a document per relation
 * to render a list that shows none of them.
 */
export async function listRecentCoupons(limit = 6): Promise<Coupon[]> {
  const res = await payloadFetch(`/api/coupons?limit=${limit}&depth=0&sort=-createdAt`);
  if (!res.ok) throw new Error("Impossible de charger les coupons.");
  const data = await res.json();
  return data.docs ?? [];
}

/** Every code, newest first, for the Coupons page. */
export async function listCoupons(): Promise<Coupon[]> {
  const res = await payloadFetch("/api/coupons?limit=500&depth=0&sort=-createdAt");
  if (!res.ok) throw new Error("Impossible de charger les coupons.");
  const data = await res.json();
  return data.docs ?? [];
}
