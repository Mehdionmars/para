/**
 * Coupon shape and the pure helpers that read it.
 *
 * Split from coupons.ts for the same reason orders-types.ts is split from
 * orders.ts: the fetching module imports payloadFetch, which reaches for
 * next/headers and is server-only. A client component that needs nothing but
 * a label and a badge would drag that whole chain into the browser bundle and
 * fail the build.
 */

export const COUPON_TYPE_LABELS = {
  fixed: "Montant fixe",
  percentage: "Pourcentage",
} as const;

export type CouponType = keyof typeof COUPON_TYPE_LABELS;

export type Coupon = {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  minimumAmount?: number | null;
  maximumDiscount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  usageCount?: number | null;
  active: boolean;
  createdAt: string;
};

/**
 * Whether a code would be refused today, and why.
 *
 * Deliberately a display helper and nothing more — the real decision is made
 * server-side at checkout against the cart. It exists so the panel can say
 * "Expiré" instead of showing a dead code as if it still worked.
 */
export function couponState(
  c: Coupon,
  now = new Date(),
): { label: string; variant: "success" | "warning" | "default" | "danger" } {
  if (!c.active) return { label: "Inactif", variant: "default" };
  if (c.endDate && new Date(c.endDate) < now) return { label: "Expiré", variant: "danger" };
  if (c.startDate && new Date(c.startDate) > now) return { label: "Programmé", variant: "warning" };
  if (typeof c.usageLimit === "number" && c.usageLimit > 0 && (c.usageCount ?? 0) >= c.usageLimit) {
    return { label: "Épuisé", variant: "danger" };
  }
  return { label: "Actif", variant: "success" };
}
