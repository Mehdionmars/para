import type { NavItem } from "@/data/nav";

/**
 * The main navigation a shop starts with.
 *
 * The sibling of DEFAULT_CATEGORY_CHIPS in `categoryStripDefaults.ts`, and
 * here for the same reason it is: the strip already had a code-level default
 * for an unconfigured CMS and the menu did not, so an empty Navigation global
 * left the storefront with a full row of category tiles above a completely
 * empty menu bar. That is exactly what preprod was serving — the `navigation`
 * table had no row at all, and the API answered with the config defaults,
 * `{"items":[],"catStrip":{"items":[],"enabled":false}}`.
 *
 * It lives here rather than in `data/nav.ts` for that file's own stated
 * reason: it carries an "AUTO-GENERATED — do not edit by hand" header and is
 * overwritten by every `npm run sync-cms`, so a default parked there would
 * disappear the first time anyone synced against an empty CMS — which is the
 * precise situation this exists to survive.
 *
 * Every href is one the storefront already routes, taken from the last
 * snapshot the CMS produced while it still had a menu, so this cannot point
 * somewhere that never existed.
 *
 * Two things in that snapshot are deliberately NOT copied here:
 *
 * - The `-40%` badge on Soldes. A discount is a commercial claim with a date
 *   on it; baking one into a code fallback means a build from today can still
 *   be promising it next season. Badges come from the CMS or not at all.
 * - The `megaKey` on every item. A key here is a promise that MEGA_MENU has a
 *   panel to open, and when the CMS is empty it has none — every hover would
 *   drop an empty panel over the page. A default menu is plain links.
 */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Soldes", href: "/shop/soldes" },
  // The snapshot said /shop/marques, which answers 307 to here. A default
  // should land on the page, not bounce off a redirect on the way.
  { label: "Marques", href: "/marques" },
  { label: "Visage", href: "/shop/visage" },
  { label: "Cheveux", href: "/shop/cheveux" },
  { label: "Corps", href: "/shop/corps" },
  { label: "K Beauty", href: "/shop/k-beauty" },
  { label: "Maquillage", href: "/shop/maquillage" },
  { label: "Bébé & Maman", href: "/shop/bebe-maman" },
  { label: "Bucco-dentaire", href: "/shop/bucco-dentaire" },
  { label: "Compléments alimentaires", href: "/shop/complements-alimentaires" },
];
