/**
 * Product badge presets and resolution — typed surface for app code.
 *
 * The rules themselves live in ./productBadges.core.mjs, which is plain ESM so
 * that `scripts/sync-cms.mjs` (bare Node, outside the Next build) can import
 * the same code instead of keeping its own copy. This file adds the TypeScript
 * types and re-exports; it deliberately holds no logic of its own.
 */
import * as core from "./productBadges.core.mjs";

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

/** Shape the full-document resolver needs — the CMS row plus its price signals. */
export type BadgeSourceDoc = {
  badges?: RawBadge[] | null;
  price: number;
  oldPrice?: number | null;
  featured?: boolean | null;
  createdAt?: string | null;
};

/** Priority 1 belongs to the automatic discount badge — a real markdown
 * always outranks a manually configured pill. */
export const BADGE_TYPE_PRESETS: Record<BadgeType, BadgePreset> = core.BADGE_TYPE_PRESETS;

export const MAX_BADGES: number = core.MAX_BADGES;

/** How long after `createdAt` a product still counts as "Nouveau". */
export const NEW_WINDOW_MS: number = core.NEW_WINDOW_MS;

/**
 * Percentage off, or null when there is no genuine markdown.
 *
 * Guards `oldPrice <= price` as well as null: a "discount" that isn't one
 * would be a false claim on a pharmacy storefront, not just a cosmetic bug.
 */
export const discountPercentage: (price: number, oldPrice?: number | null) => number | null =
  core.discountPercentage;

/** The automatic markdown pill, or null. Always priority 1. */
export const discountBadge: (price: number, oldPrice?: number | null) => ResolvedBadge | null =
  core.discountBadge;

/**
 * Turns a product's configured badges plus its pricing into the final,
 * ordered list to render.
 *
 * Resolution order per field: the editor's explicit value, then the type's
 * preset, then nothing (a badge that resolves to empty text is dropped —
 * a coloured pill with no words carries no information, which is also the
 * accessibility rule here).
 */
export const resolveProductBadges: (
  badges: RawBadge[] | null | undefined,
  price: number,
  oldPrice?: number | null,
  limit?: number,
) => ResolvedBadge[] = core.resolveProductBadges;

/**
 * The one badge derived from signals (featured / recency) rather than from the
 * editor's rows. Empty colours mean "use the theme default".
 */
export const computeAutoBadge: (doc: {
  featured?: boolean | null;
  createdAt?: string | null;
}) => ResolvedBadge | null = core.computeAutoBadge;

/**
 * Full resolution for a CMS document: configured badges plus any genuine
 * markdown, falling back to a single signal-derived badge only when those
 * produce nothing. Used by both the live storefront path and `sync-cms`.
 */
export const resolveBadgesForDoc: (doc: BadgeSourceDoc, limit?: number) => ResolvedBadge[] =
  core.resolveBadgesForDoc;
