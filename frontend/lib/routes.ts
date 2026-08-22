// Single source of truth for every internal URL the storefront links to.
// Nothing outside this file should build a `/shop/...`, `/marques/...` or
// `/produit/...` string by hand — import `routes` (or `resolveNavigationUrl`
// for CMS-configured links) instead, so a URL shape change only ever
// requires editing this one file.

export const routes = {
  home: () => "/",
  catalogue: () => "/catalogue",
  category: (slug: string) => `/shop/${slug}`,
  brands: () => "/marques",
  brand: (slug: string) => `/marques/${slug}`,
  product: (slug: string) => `/produit/${slug}`,
  search: (query: string) => `/catalogue?q=${encodeURIComponent(query)}`,
} as const;

/**
 * A navigation link exactly as configured in the Payload `Navigation` global
 * / the Storefront Builder's CTA pickers. `type` mirrors the lowercase
 * NAV_LINK_TYPES already stored by the CMS (backend/src/globals/Navigation.ts)
 * — equivalent to the CATEGORY/BRAND/COLLECTION/PAGE/CUSTOM_URL types.
 */
export type NavigationTarget =
  | { type: "category"; categorySlug: string }
  | { type: "brand"; slug: string }
  | { type: "product"; slug: string }
  | { type: "collection"; route: string }
  | { type: "page"; route: string }
  | { type: "custom"; url: string };

/**
 * Resolves any CMS-configured navigation target to a real, working href.
 * `collection`/`page` targets pass their curated static route straight
 * through — see NAV_COLLECTION_ROUTES/NAV_PAGE_ROUTES — never inventing a
 * path from free text.
 */
export function resolveNavigationUrl(target: NavigationTarget): string {
  switch (target.type) {
    case "category":
      return routes.category(target.categorySlug);
    case "brand":
      return routes.brand(target.slug);
    case "product":
      return routes.product(target.slug);
    case "collection":
      return target.route || routes.catalogue();
    case "page":
      return target.route || routes.home();
    case "custom":
      return target.url || routes.catalogue();
  }
}
