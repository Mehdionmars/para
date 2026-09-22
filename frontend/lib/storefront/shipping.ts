const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag: shipping rules change with courier pricing, not with content. */
export const SHIPPING_TAG = "shipping-rules";

export type ShippingOption = {
  city: string;
  price: number;
  freeFrom: number | null;
  isDefault: boolean;
};

/**
 * The published delivery tariffs, read server-side.
 *
 * Same rows as app/api/shipping-rules (the cart's city picker) and as
 * backend/src/lib/pricing.ts (what checkout actually charges). /livraison
 * reads them directly rather than through the API route because it is a
 * Server Component and does not need the extra hop.
 *
 * This is the whole reason the delivery page holds no prices of its own: a
 * figure typed into a CGV or a "nos tarifs" paragraph becomes wrong the first
 * time someone edits a rule in the admin, and nobody finds out. Here the page
 * is wrong only if checkout is wrong too.
 */
export async function fetchShippingOptions(): Promise<ShippingOption[]> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/shipping-rules?limit=100&depth=0&where[enabled][equals]=true&sort=price`, {
      next: { revalidate: 300, tags: [SHIPPING_TAG] },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  const docs = (data?.docs ?? []) as { city?: string; price?: number; freeFrom?: number | null; isDefault?: boolean }[];

  return docs
    .map((d) => ({
      city: d.city?.trim() || "",
      freeFrom: typeof d.freeFrom === "number" ? d.freeFrom : null,
      isDefault: !!d.isDefault,
      price: Number(d.price) || 0,
    }))
    .filter((r) => r.city);
}

/** "20 MAD" / "Offerte" — the shop's own formatting for a delivery price. */
export function formatShippingPrice(price: number): string {
  return price > 0 ? `${price} MAD` : "Offerte";
}
