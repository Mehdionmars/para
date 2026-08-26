// Server-only: live catalogue data for the /catalogue page.
//
// The catalogue deliberately INCLUDES out-of-stock products (shown with a
// "Rupture de stock" state) instead of hiding them, so shoppers can still
// find and favorite something that's temporarily unavailable.
//
// ## What changed, and why
//
// This module used to answer every query by calling `fetchVisibleDocs()`:
// one request for **1000 products at depth=1 with `cache: "no-store"`**, on
// every /catalogue and /marques hit, followed by filtering, sorting, faceting
// and pagination in Node. Three things were wrong with that:
//
//   1. It was silently wrong above 1000 products. The limit truncated the
//      set with no error, so the catalogue would simply stop showing part of
//      itself — and the facet counts would quietly disagree with reality.
//   2. Every page view transferred and parsed the entire sellable catalogue,
//      then threw almost all of it away to render 24 cards.
//   3. `no-store` meant none of it could be shared between visitors, so the
//      cost was paid per request rather than per minute.
//
// Filtering, sorting and counting are what a database does. Postgres now does
// all three, through the index added in migration 20260826_100000, and the
// facet counts come from one cacheable aggregate endpoint.
//
// The exported shapes are unchanged — `CatalogueResult`, `CatalogueProduct`,
// `CatalogueFacets`, `StorefrontBrand` — so no component was touched.
import { CMS_URL } from "@/lib/dashboard/constants";
import { stockStatus } from "@/lib/dashboard/products-types";
import { CATALOGUE_BRANDS, TAG_TO_CATEGORY } from "@/data/catalogue";
import type { Category, Product } from "@/data/products";
import {
  resolveBadges,
  resolveBrandName,
  resolveMediaUrl,
  type PayloadBadge,
  type PayloadBrandRef,
  type PayloadMediaRef,
} from "./products";

export type StockState = "ok" | "low" | "out";

export type CatalogueProduct = Product & {
  image: string;
  stock: number;
  stockState: StockState;
};

type CatalogueDoc = {
  id: number;
  slug?: string | null;
  name: string;
  brand?: PayloadBrandRef;
  category: string;
  size?: string | null;
  price: number;
  oldPrice?: number | null;
  badges?: PayloadBadge[] | null;
  rating?: number | null;
  reviews?: number | null;
  tint?: string | null;
  description?: string | null;
  image?: PayloadMediaRef;
  createdAt: string;
  featured?: boolean | null;
  stock: number;
  lowStockThreshold: number;
};

/** Mirrors Products.access.read on the backend, which now appends the same
 * clause for anonymous callers. Kept explicit here so the intent is readable
 * at the call site rather than depending on a server-side default. */
const VISIBLE = [{ isPublished: { equals: true } }, { discontinued: { not_equals: true } }];

/** The backend caps `limit` at 100 for anonymous callers (publicQueryGuard),
 * so a cumulative "load more" past 100 has to be assembled from pages rather
 * than asked for in one shot. Below 100 — which is every ordinary session —
 * this is exactly one request. */
const MAX_PER_REQUEST = 100;

export const CATALOGUE_CATEGORIES: Category[] = [
  "Visage",
  "Corps",
  "Cheveux",
  "Solaire",
  "Baby & Mom",
  "Maquillage",
  "Bucco-Dentaire",
  "Compléments alimentaires",
  "Hygiène",
];

function toCatalogueProduct(doc: CatalogueDoc): CatalogueProduct {
  const stock = doc.stock ?? 0;
  const lowStockThreshold = doc.lowStockThreshold ?? 5;
  return {
    badges: resolveBadges(doc),
    brand: resolveBrandName(doc.brand),
    cat: doc.category as Category,
    desc: doc.description || "",
    id: doc.id,
    slug: doc.slug || String(doc.id),
    image: resolveMediaUrl(doc.image),
    name: doc.name,
    old: doc.oldPrice && doc.oldPrice > doc.price ? doc.oldPrice : 0,
    price: doc.price,
    rating: doc.rating ?? 5,
    reviews: doc.reviews ?? 0,
    size: doc.size || "",
    stock,
    stockState: stockStatus({ lowStockThreshold, stock }),
    tint: doc.tint || "#F2F2F2",
  };
}

export type CatalogueQuery = {
  q?: string;
  categories?: Category[];
  brand?: string;
  tag?: string;
  /** One of the top quick-filter pills (curated in Payload's catalogue-page
   * global). Only the four with a real, checkable signal actually narrow
   * results — the rest are shown as togglable chips without a matching
   * product attribute, same as before this rewrite. */
  quick?: string;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "pertinence" | "price-asc" | "price-desc" | "newest";
  limit?: number;
};

export type CatalogueFacets = {
  categories: { value: Category; count: number }[];
  brands: { name: string; count: number }[];
  inStockCount: number;
  totalCount: number;
};

export type CatalogueResult = {
  products: CatalogueProduct[];
  total: number;
  facets: CatalogueFacets;
};

export type StorefrontBrand = {
  id: number;
  /** The brand's own logo, or null while none has been uploaded. Consumers
   * fall back to a composed monogram — never to a broken image. */
  logo: string | null;
  name: string;
  productCount: number;
  slug: string;
};

type FacetsResponse = {
  brands: { count: number; id: number; logo: string | null; name: string; slug: string }[];
  categories: { count: number; value: string }[];
  inStockCount: number;
  totalCount: number;
};

const EMPTY_FACETS: FacetsResponse = { brands: [], categories: [], inStockCount: 0, totalCount: 0 };

/**
 * The counts behind the filter bar and the brand pages.
 *
 * These do not depend on the visitor's filters — the count next to "Solaire"
 * says how many Solaire products exist, not how many survive the rest of the
 * form — so the response is the same for everyone and is cached at the edge
 * (`Cache-Control` is set on the backend route). `revalidate` here is the
 * second layer, for Next's own data cache.
 */
async function fetchFacets(): Promise<FacetsResponse> {
  try {
    const res = await fetch(`${CMS_URL}/api/catalogue/facets`, { next: { revalidate: 120 } });
    if (!res.ok) return EMPTY_FACETS;
    return (await res.json()) as FacetsResponse;
  } catch {
    // A missing facet bar degrades the page; it must not empty the grid.
    return EMPTY_FACETS;
  }
}

/** Payload's `sort`, from the UI's sort value. "pertinence" is rating then
 * review count, the same two-key ordering the in-memory version applied. */
function sortParam(sort: CatalogueQuery["sort"]): string {
  switch (sort) {
    case "price-asc":
      return "price";
    case "price-desc":
      return "-price";
    case "newest":
      return "-createdAt";
    default:
      return "-rating,-reviews";
  }
}

/**
 * Translates the UI's filter state into a Payload `where`.
 *
 * Every branch here replaces an `Array.prototype.filter` that used to run
 * over the whole catalogue in Node. The one deliberate change in meaning is
 * noted inline.
 */
function buildWhere(query: CatalogueQuery): Record<string, unknown> {
  const and: Record<string, unknown>[] = [...VISIBLE];

  if (query.maxPrice) and.push({ price: { less_than_equal: query.maxPrice } });
  if (query.categories?.length) and.push({ category: { in: query.categories } });
  if (query.brand) and.push({ "brand.name": { equals: query.brand } });
  if (query.inStockOnly) and.push({ stock: { greater_than: 0 } });

  if (query.q) {
    // Same two fields the in-memory version searched: product name and brand
    // name. `like` is case-insensitive on the Postgres adapter, which matches
    // the old `.toLowerCase().includes()`.
    and.push({ or: [{ name: { like: query.q } }, { "brand.name": { like: query.q } }] });
  }

  if (query.tag) {
    const brandMatch = CATALOGUE_BRANDS.find((b) => b.toLowerCase() === query.tag!.toLowerCase());
    const mappedCategory = TAG_TO_CATEGORY[query.tag];
    if (brandMatch) and.push({ "brand.name": { equals: brandMatch } });
    else if (mappedCategory) and.push({ category: { equals: mappedCategory } });
  }

  switch (query.quick) {
    case "−25% sélection soin":
      and.push({ oldPrice: { greater_than: 0 } });
      break;
    case "Nouveautés":
      // The in-memory version tested `badge.text === "Nouveau"`, which never
      // matched anything: the `nouveau` preset renders as "Nouveauté", and a
      // badge's `text` is empty unless an editor overrode it. Filtering on
      // the badge *type* is what the pill has always meant, and is the one
      // place this rewrite deliberately changes an outcome — from "always
      // empty" to "the products actually flagged new".
      and.push({ "badges.type": { equals: "nouveau" } });
      break;
    case "Meilleures ventes":
      and.push({ rating: { equals: 5 } });
      break;
    case "Solaire SPF 50+":
      and.push({ category: { equals: "Solaire" } });
      break;
    default:
      break;
  }

  return { and };
}

/**
 * One page of products, plus the true total.
 *
 * `totalDocs` comes from Postgres' own count over the same `where`, so the
 * "N produits" label and the "Charger plus" button are correct at any
 * catalogue size — the previous implementation could only ever count what it
 * had already downloaded.
 */
async function fetchPage(
  where: Record<string, unknown>,
  sort: string,
  limit: number,
  page: number,
): Promise<{ docs: CatalogueDoc[]; totalDocs: number }> {
  const params = new URLSearchParams();
  params.set("where", JSON.stringify(where));
  params.set("limit", String(limit));
  params.set("page", String(page));
  params.set("depth", "1");
  params.set("sort", sort);

  try {
    const res = await fetch(`${CMS_URL}/api/products?${params.toString()}`, {
      // Short shared window rather than `no-store`: the same handful of filter
      // combinations are requested constantly, and 30s is far too short to
      // mislead anyone about availability. Price and stock are re-read from
      // Postgres inside /api/checkout on every order, so a slightly stale card
      // can never cause an oversell.
      next: { revalidate: 30 },
    });
    if (!res.ok) return { docs: [], totalDocs: 0 };
    const data = await res.json();
    return { docs: (data.docs || []) as CatalogueDoc[], totalDocs: Number(data.totalDocs) || 0 };
  } catch {
    return { docs: [], totalDocs: 0 };
  }
}

export async function fetchCatalogue(query: CatalogueQuery): Promise<CatalogueResult> {
  const where = buildWhere(query);
  const sort = sortParam(query.sort);
  const wanted = query.limit || 24;

  // Facets and the first page are independent, so they go out together
  // instead of one after the other.
  const [facetsData, firstPage] = await Promise.all([
    fetchFacets(),
    fetchPage(where, sort, Math.min(wanted, MAX_PER_REQUEST), 1),
  ]);

  const docs = [...firstPage.docs];

  // "Charger plus" grows the requested limit by 24 each time, so past the
  // fourth click it exceeds the backend's per-request cap. Fetch the extra
  // pages rather than silently returning a short list.
  for (let page = 2; docs.length < wanted && docs.length < firstPage.totalDocs; page += 1) {
    const next = await fetchPage(where, sort, MAX_PER_REQUEST, page);
    if (next.docs.length === 0) break;
    docs.push(...next.docs);
  }

  const byCategory = new Map(facetsData.categories.map((c) => [c.value, c.count]));
  const byBrandName = new Map(facetsData.brands.map((b) => [b.name.toLowerCase(), b.count]));

  return {
    facets: {
      // Still the curated list from data/catalogue.ts rather than every brand
      // in the database: the filter bar has always shown these ten, and the
      // counts are simply now correct instead of derived from a truncated
      // sample. /marques, which does want every brand, uses
      // fetchAllBrandsWithCounts below.
      brands: CATALOGUE_BRANDS.map((name) => ({ count: byBrandName.get(name.toLowerCase()) || 0, name })).filter(
        (b) => b.count > 0,
      ),
      categories: CATALOGUE_CATEGORIES.map((value) => ({ count: byCategory.get(value) || 0, value })),
      inStockCount: facetsData.inStockCount,
      totalCount: facetsData.totalCount,
    },
    products: docs.slice(0, wanted).map(toCatalogueProduct),
    total: firstPage.totalDocs,
  };
}

/**
 * Every brand that has a slug and at least one sellable product, with a real
 * count. Used by /marques and to resolve /marques/[slug].
 *
 * This used to call `fetchVisibleDocs()` — the same 1000-product download —
 * purely to count products per brand, on a page that renders logos and
 * numbers. It is now the brand half of the facets aggregate, which the
 * catalogue page has usually already warmed.
 *
 * Brands without a slug (a handful of legacy duplicate records — see
 * backend/src/scripts/backfillBrandSlugs.ts) are excluded by the query, as
 * they were here: they would link to a page with no products.
 */
export async function fetchAllBrandsWithCounts(): Promise<StorefrontBrand[]> {
  const facets = await fetchFacets();
  return facets.brands
    .map((b) => ({ id: b.id, logo: b.logo, name: b.name, productCount: b.count, slug: b.slug }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
