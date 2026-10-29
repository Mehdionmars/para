/**
 * Badge presets, on their own module because the admin's client components
 * read them (components/BadgesPreviewField). Importing them from
 * collections/Products dragged the whole collection config into the browser
 * bundle, hooks included — and the stock-alert hook reaches nodemailer, whose
 * node:net import made `next build` fail. Keep this file free of imports.
 */

/**
 * One preset per badge type: default wording, default colours and the
 * default sort priority (lower shows first).
 *
 * Single source of truth — the storefront mirrors this table rather than
 * keeping its own copy, so adding a type here is the only edit needed to
 * make it available end to end. Existing enum values are never renamed
 * (`nouveau`, `bestseller`, `exclusivite`… predate this) because that would
 * invalidate rows already stored in Postgres.
 *
 * Priority 1 is deliberately left free: it belongs to the automatic discount
 * badge, which is computed from oldPrice/price and always outranks a
 * manually configured one.
 */
export const BADGE_TYPE_PRESETS = {
  nouveau: { label: 'Nouveauté', bgColor: '#6D28D9', textColor: '#FFFFFF', priority: 2 },
  bestseller: { label: 'Best-seller', bgColor: '#111827', textColor: '#FFFFFF', priority: 3 },
  // #00758A rather than the brand teal #008AA5: white on the brighter teal
  // measures 4.06:1 at the size these pills render, under the AA floor.
  // Kept in step with frontend/lib/productBadges.core.mjs.
  exclusivite: { label: 'Exclu web', bgColor: '#00758A', textColor: '#FFFFFF', priority: 4 },
  routine: { label: 'Routine', bgColor: '#F7EEE5', textColor: '#373020', priority: 5 },
  coupdecoeur: { label: 'Coup de cœur', bgColor: '#F7EEE5', textColor: '#6D28D9', priority: 6 },
  offrespeciale: { label: 'Offre spéciale', bgColor: '#6D28D9', textColor: '#FFFFFF', priority: 7 },
  solde: { label: 'Solde', bgColor: '#DC2626', textColor: '#FFFFFF', priority: 7 },
  promo: { label: 'Promo', bgColor: '#DC2626', textColor: '#FFFFFF', priority: 7 },
  top: { label: 'Top', bgColor: '#111827', textColor: '#FFFFFF', priority: 8 },
  editionlimitee: { label: 'Édition limitée', bgColor: '#373020', textColor: '#FFFFFF', priority: 8 },
  custom: { label: '', bgColor: '', textColor: '', priority: 8 },
} as const satisfies Record<string, { label: string; bgColor: string; textColor: string; priority: number }>

export type BadgeType = keyof typeof BADGE_TYPE_PRESETS

export const BADGE_TYPES = (Object.keys(BADGE_TYPE_PRESETS) as BadgeType[]).map((value) => ({
  label: BADGE_TYPE_PRESETS[value].label || 'Personnalisé',
  value,
}))

// Shown when a badge's own `text` is left empty — lets an editor swap a
// type's default wording without that being a second, disconnected field.
export const BADGE_TYPE_DEFAULT_LABEL: Record<string, string> = Object.fromEntries(
  (Object.keys(BADGE_TYPE_PRESETS) as BadgeType[]).map((k) => [k, BADGE_TYPE_PRESETS[k].label]),
)
