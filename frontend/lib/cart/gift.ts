/**
 * The gift offer, as the storefront previews it ("3 produits Filorga achetés =
 * Summer Trousse offerte").
 *
 * Authority note — the same one as routine.ts: none of this binds.
 * backend/src/lib/giftOffer.ts decides the gift at checkout from the database
 * and writes it on the order. This mirrors its rule so the cart promises
 * exactly what the parcel will hold:
 *
 * - units of the brand, not distinct products;
 * - one gift per order, however far past the threshold;
 * - off unless enabled with a brand.
 *
 * Cart lines only carry the brand's name, so that is what is matched here,
 * without case or accents. Dependency-free, so it is unit-tested directly.
 */

export type GiftOffer = {
  enabled: boolean;
  brandName: string;
  brandSlug: string;
  minItems: number;
  giftName: string;
  /** Resolved media URL of the campaign visual, or "" when none is set. */
  image: string;
};
export type GiftLine = { brand: string; qty: number };
export type GiftProgress = { count: number; remaining: number; granted: boolean };

/** Mirrors GIFT_MAX_ITEMS / GIFT_DEFAULT_NAME in the backend module. */
export const GIFT_MAX_ITEMS = 20;
export const GIFT_DEFAULT_NAME = "Cadeau offert";

export const GIFT_OFF: GiftOffer = { brandName: "", brandSlug: "", enabled: false, giftName: "", image: "", minItems: 3 };

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/** Reads the CMS group fetched at depth 1 (brand and image populated). The
 * image URL is resolved by the caller, which knows how CMS media is served. */
export function parseGiftOffer(raw: unknown, resolveImage: (media: unknown) => string = () => ""): GiftOffer {
  const group = (raw ?? {}) as { enabled?: unknown; brand?: unknown; minItems?: unknown; giftName?: unknown; image?: unknown };
  const brand = (typeof group.brand === "object" && group.brand !== null ? group.brand : {}) as { name?: unknown; slug?: unknown };
  const brandName = typeof brand.name === "string" ? brand.name.trim() : "";
  if (group.enabled !== true || !brandName) return GIFT_OFF;
  const minItems = Math.floor(Number(group.minItems));
  return {
    brandName,
    brandSlug: typeof brand.slug === "string" ? brand.slug : "",
    enabled: true,
    giftName: typeof group.giftName === "string" && group.giftName.trim() ? group.giftName.trim() : GIFT_DEFAULT_NAME,
    image: resolveImage(group.image),
    minItems: Number.isFinite(minItems) ? Math.min(GIFT_MAX_ITEMS, Math.max(1, minItems)) : 3,
  };
}

export function isGiftBrand(offer: GiftOffer, brand: string | null | undefined): boolean {
  return offer.enabled && !!brand && normalize(brand) === normalize(offer.brandName);
}

export function giftProgress(offer: GiftOffer, lines: GiftLine[]): GiftProgress {
  if (!offer.enabled) return { count: 0, granted: false, remaining: 0 };
  const count = lines.reduce((n, l) => (isGiftBrand(offer, l.brand) && l.qty > 0 ? n + Math.floor(l.qty) : n), 0);
  return { count, granted: count >= offer.minItems, remaining: Math.max(0, offer.minItems - count) };
}
