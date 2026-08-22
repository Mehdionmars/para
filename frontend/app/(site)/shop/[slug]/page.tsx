import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
import { MEGA_MENU, NAV_ITEMS } from "@/data/nav";
import type { Category } from "@/data/products";
import { routes } from "@/lib/routes";
import { fetchAllBrandsWithCounts } from "@/lib/storefront/catalogue";

/**
 * A dozen mega-menu entries point at /shop/<brand> — avene, bioderma, cerave,
 * la-roche-posay, vichy and the rest — while the brand pages themselves live
 * at /marques/<brand>. Those slugs are not product categories, so they fell
 * through to the "bientôt disponible" state even though a working page with
 * the right products already existed one route away.
 *
 * Resolved against the Brands collection rather than a hard-coded list, so a
 * brand added in the CMS is routed without a code change.
 */
async function brandRedirect(slug: string): Promise<string | null> {
  if (slug === "marques") return routes.brands();
  const brands = await fetchAllBrandsWithCounts();
  return brands.some((b) => b.slug === slug) ? routes.brand(slug) : null;
}

// Products.category is a fixed 5-value enum — narrower than the full
// Categories-CMS nav taxonomy. Only these slugs have a real, direct product
// filter; "quick" filters reuse the catalogue's existing quick-filter pills
// rather than a second filtering implementation; anything else renders an
// honest "no products yet" state (see CatalogueView's forcedEmptyCategoryLabel).
// A slug works here independently of whether it's also in the main nav
// (NAV_ITEMS) — e.g. "solaire" has a real product filter and a working
// /shop/solaire page but isn't a top-level nav entry, used instead as a
// standalone link target (marketing banners, etc.).
const REAL_CATEGORY_BY_SLUG: Record<string, Category> = {
  "bebe-maman": "Baby & Mom",
  "bucco-dentaire": "Bucco-Dentaire",
  cheveux: "Cheveux",
  "complements-alimentaires": "Compléments alimentaires",
  corps: "Corps",
  "hygiene": "Hygiène",
  maquillage: "Maquillage",
  solaire: "Solaire",
  visage: "Visage",
};

const QUICK_FILTER_BY_SLUG: Record<string, string> = {
  nouveautes: "Nouveautés",
  soldes: "−25% sélection soin",
};

function findNavItem(slug: string) {
  return NAV_ITEMS.find((item) => item.href === `/shop/${slug}`);
}

/**
 * The mega menu links to roughly eighty /shop/* slugs — sub-categories
 * ("nettoyants", "eaux-micellaires"), needs ("peaux-seches"), and campaign
 * pages ("ventes-flash") — none of which are top-level NAV_ITEMS. Every one
 * of them hit `notFound()`, so a link the operator configured in the CMS
 * returned a hard 404 rather than a page.
 *
 * Recognising them here doesn't invent a product filter that doesn't exist:
 * the slug still has no category, so the page renders the "not online yet"
 * state with the aisle selector. A configured link now leads somewhere.
 */
function findMegaLink(slug: string) {
  for (const menu of Object.values(MEGA_MENU)) {
    for (const column of menu.columns) {
      const hit = column.links.find((l) => l.href === `/shop/${slug}`);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Resolves a slug to its display label, trying the nav entry first (so an
 * existing nav item's exact wording still wins) and falling back to the
 * category/quick-filter value for slugs that only exist as a direct
 * product filter, not a nav entry. */
function resolveLabel(slug: string): string | null {
  return (
    findNavItem(slug)?.label ??
    REAL_CATEGORY_BY_SLUG[slug] ??
    QUICK_FILTER_BY_SLUG[slug] ??
    findMegaLink(slug)?.label ??
    null
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const label = resolveLabel(slug);
  if (!label) return { title: "Catalogue — Para d'Hiver" };
  const title = `${label} — Para d'Hiver`;
  const description = `Découvrez notre sélection ${label} : soins dermocosmétiques et parapharmacie en ligne au Maroc, livrés partout au pays.`;
  return {
    title,
    description,
    alternates: { canonical: routes.category(slug) },
    openGraph: { title, description },
  };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;

  const brandTarget = await brandRedirect(slug);
  if (brandTarget) redirect(brandTarget);

  const label = resolveLabel(slug);
  if (!label) notFound();

  return (
    <CatalogueView
      initialQuery={q ?? ""}
      initialCategory={REAL_CATEGORY_BY_SLUG[slug] || (QUICK_FILTER_BY_SLUG[slug] ? "" : label)}
      initialQuick={QUICK_FILTER_BY_SLUG[slug] || ""}
      pageTitle={label}
    />
  );
}
