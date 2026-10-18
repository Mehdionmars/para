import type { Category } from "@/data/products";

/**
 * Which `/shop/<slug>` URLs are a real broad category.
 *
 * Lifted out of app/(site)/shop/[slug]/page.tsx, unchanged, because a second
 * caller now needs it: the home page's category circles have to know whether
 * the shelf behind a tile actually holds anything before they offer it.
 *
 * Kept as one map in one file rather than copied, for the obvious reason —
 * a slug added to the shop page and forgotten here would make the home page
 * quietly hide a working category, which is the failure that is hardest to
 * notice because nothing breaks.
 *
 * This is deliberately only the nine broad categories. Aisle slugs
 * (`nettoyants`, `peaux-seches`, …) filter on `subCategory` and are resolved
 * separately by the shop page; brand slugs redirect to /marques. A slug in
 * none of those groups renders an honest empty state.
 */
export const REAL_CATEGORY_BY_SLUG: Record<string, Category> = {
  "bebe-maman": "Baby & Mom",
  "bucco-dentaire": "Bucco-Dentaire",
  cheveux: "Cheveux",
  "complements-alimentaires": "Compléments alimentaires",
  corps: "Corps",
  hygiene: "Hygiène",
  maquillage: "Maquillage",
  solaire: "Solaire",
  visage: "Visage",
};

/** The category a `/shop/<slug>` href points at, or null when the href is
 * not a broad-category page (an aisle, a brand, a quick filter, /catalogue). */
export function categoryFromHref(href: string): Category | null {
  const match = /^\/shop\/([^/?#]+)/.exec(href.trim());
  if (!match) return null;
  return REAL_CATEGORY_BY_SLUG[match[1]] ?? null;
}

/** "Bébé & Maman", "bebe-maman" → "bebe maman": no accents, no case, any run
 * of punctuation read as one space. */
function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Each broad category under its own name and under its slug, so a menu entry
// renamed in the CMS ("Bébé & Maman" for "Baby & Mom") still finds its shelf.
const CATEGORY_BY_NAME_KEY = new Map<string, Category>(
  Object.entries(REAL_CATEGORY_BY_SLUG).flatMap(([slug, category]) => [
    [nameKey(slug), category],
    [nameKey(category), category],
  ]),
);

/**
 * The broad category a CMS category name stands for, or null when it is not
 * one: "Bucco-dentaire" is Bucco-Dentaire, "Bébé & Maman" is Baby & Mom, and
 * "Soldes" or "K Beauty" are menu groupings no product is filed under.
 * Querying products with a name that is not one of the nine is rejected by
 * Postgres, since `category` is an enum.
 */
export function categoryFromName(name: string): Category | null {
  return CATEGORY_BY_NAME_KEY.get(nameKey(name)) ?? null;
}

/**
 * Should this link be offered, given what the catalogue actually holds?
 *
 * The rule is deliberately permissive: only a link that maps to a known
 * broad category *and* whose count is known *and* is zero gets hidden.
 *
 * Everything else is shown. An aisle link, a brand link, /catalogue, a
 * marketing URL, or any category whose count could not be fetched all pass
 * through — because the alternative is a strip that empties itself the first
 * time the facets request times out, and a blank category browser is worse
 * than one dead tile.
 */
export function hasProductsBehind(href: string, counts: Map<Category, number>): boolean {
  const category = categoryFromHref(href);
  if (!category) return true;
  const count = counts.get(category);
  if (count === undefined) return true;
  return count > 0;
}
