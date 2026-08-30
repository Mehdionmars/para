/**
 * The storefront's language and writing direction, in one place.
 *
 * ## Why a constant and not a router
 *
 * There is no translation layer in this project: every string in every
 * component is French, written inline. Adding locale-prefixed routes before
 * there is a second language to route to would be scaffolding with nothing
 * to hold up.
 *
 * What this does buy is that `dir` is no longer hardcoded in the layout. The
 * stylesheet is written against logical properties, so flipping the value
 * below mirrors the whole storefront — which is what makes the RTL work
 * testable now and switchable later, rather than a rewrite deferred until
 * the day Arabic copy exists.
 *
 * ## When Arabic arrives
 *
 * Replace this constant with a per-request read (a route segment, a cookie,
 * an Accept-Language negotiation) and pass the result into the layout. Every
 * consumer already reads it from here; nothing else has to change for the
 * layout to mirror. The remaining work is then the translations themselves,
 * which are content, not code.
 */

/** BCP 47 tag, used for `<html lang>` and for `toLocaleString` formatting. */
export const SITE_LOCALE = "fr" as const;

export type SiteDirection = "ltr" | "rtl";

/** Languages this storefront can present, and which way each one reads. */
const DIRECTION_BY_LOCALE: Record<string, SiteDirection> = {
  ar: "rtl",
  fr: "ltr",
};

/**
 * Writing direction for the active locale.
 *
 * Derived rather than declared, so a locale and its direction cannot drift
 * apart — setting SITE_LOCALE to "ar" mirrors the site by itself.
 */
export const SITE_DIR: SiteDirection = DIRECTION_BY_LOCALE[SITE_LOCALE] ?? "ltr";
