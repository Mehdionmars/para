/**
 * Product badge presets and resolution.
 *
 * Mirrors backend/src/collections/Products.ts's BADGE_TYPE_PRESETS. Kept as
 * a mirror rather than an import because the storefront never imports from
 * the Payload project — same reason BADGE_TYPE_DEFAULT_LABEL was already
 * duplicated in lib/storefront/products.ts before this file existed.
 * Adding a type means editing both tables.
 */

export type BadgeType =
  | "nouveau"
  | "bestseller"
  | "exclusivite"
  | "routine"
  | "coupdecoeur"
  | "offrespeciale"
  | "solde"
  | "promo"
  | "top"
  | "editionlimitee"
  | "custom";

export type BadgePreset = { label: string; bgColor: string; textColor: string; priority: number };

/** Priority 1 belongs to the automatic discount badge — a real markdown
 * always outranks a manually configured pill. */
export const BADGE_TYPE_PRESETS: Record<BadgeType, BadgePreset> = {
  nouveau: { label: "Nouveauté", bgColor: "#6D28D9", textColor: "#FFFFFF", priority: 2 },
  bestseller: { label: "Best-seller", bgColor: "#111827", textColor: "#FFFFFF", priority: 3 },
  exclusivite: { label: "Exclu web", bgColor: "#008AA5", textColor: "#FFFFFF", priority: 4 },
  routine: { label: "Routine", bgColor: "#F7EEE5", textColor: "#373020", priority: 5 },
  coupdecoeur: { label: "Coup de cœur", bgColor: "#F7EEE5", textColor: "#6D28D9", priority: 6 },
  offrespeciale: { label: "Offre spéciale", bgColor: "#6D28D9", textColor: "#FFFFFF", priority: 7 },
  solde: { label: "Solde", bgColor: "#DC2626", textColor: "#FFFFFF", priority: 7 },
  promo: { label: "Promo", bgColor: "#DC2626", textColor: "#FFFFFF", priority: 7 },
  top: { label: "Top", bgColor: "#111827", textColor: "#FFFFFF", priority: 8 },
  editionlimitee: { label: "Édition limitée", bgColor: "#373020", textColor: "#FFFFFF", priority: 8 },
  custom: { label: "", bgColor: "#5E4074", textColor: "#FFFFFF", priority: 8 },
};

/** A badge as it reaches the UI: already resolved, already sorted. */
export type ResolvedBadge = {
  text: string;
  bgColor: string;
  textColor: string;
  priority: number;
};

/** Shape stored on a product (CMS row or synced snapshot). Every field is
 * optional because a row may carry only a type and rely on its preset. */
export type RawBadge = {
  enabled?: boolean | null;
  type?: string | null;
  text?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  priority?: number | null;
};

export const MAX_BADGES = 3;

/**
 * Percentage off, or null when there is no genuine markdown.
 *
 * Guards `oldPrice <= price` as well as null: a "discount" that isn't one
 * would be a false claim on a pharmacy storefront, not just a cosmetic bug.
 */
export function discountPercentage(price: number, oldPrice?: number | null): number | null {
  if (!oldPrice || oldPrice <= price || price < 0) return null;
  const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
  return pct > 0 ? pct : null;
}

/** The automatic markdown pill, or null. Always priority 1. */
export function discountBadge(price: number, oldPrice?: number | null): ResolvedBadge | null {
  const pct = discountPercentage(price, oldPrice);
  if (pct === null) return null;
  return { text: `−${pct}%`, bgColor: "var(--pdh-sale)", textColor: "#FFFFFF", priority: 1 };
}

/**
 * Turns a product's configured badges plus its pricing into the final,
 * ordered list to render.
 *
 * Resolution order per field: the editor's explicit value, then the type's
 * preset, then nothing (a badge that resolves to empty text is dropped —
 * a coloured pill with no words carries no information, which is also the
 * accessibility rule here).
 */
export function resolveProductBadges(
  badges: RawBadge[] | null | undefined,
  price: number,
  oldPrice?: number | null,
  limit: number = MAX_BADGES,
): ResolvedBadge[] {
  const configured: ResolvedBadge[] = (badges || [])
    .filter((b) => b.enabled !== false)
    .map((b) => {
      const preset = BADGE_TYPE_PRESETS[(b.type || "custom") as BadgeType] ?? BADGE_TYPE_PRESETS.custom;
      return {
        text: (b.text?.trim() || preset.label || "").trim(),
        bgColor: b.bgColor || preset.bgColor,
        textColor: b.textColor || preset.textColor,
        priority: b.priority ?? preset.priority,
      };
    })
    .filter((b) => b.text);

  const auto = discountBadge(price, oldPrice);
  const all = auto ? [auto, ...configured] : configured;

  // Stable sort: equal priorities keep the editor's own row order.
  return all
    .map((b, i) => ({ b, i }))
    .sort((x, y) => x.b.priority - y.b.priority || x.i - y.i)
    .map(({ b }) => b)
    .slice(0, limit);
}
