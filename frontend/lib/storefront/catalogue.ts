// Server-only: live catalogue data for the /catalogue page, fetched directly
// from Payload on every request — unlike the homepage rails, the catalogue
// deliberately INCLUDES out-of-stock products (shown with a "Rupture de
// stock" state) instead of hiding them, so shoppers can still find and
// favorite something that's temporarily unavailable.
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

const VISIBLE = [{ isPublished: { equals: true } }, { discontinued: { not_equals: true } }];

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

async function fetchVisibleDocs(): Promise<CatalogueDoc[]> {
  const params = new URLSearchParams();
  params.set("where", JSON.stringify({ and: VISIBLE }));
  params.set("limit", "1000");
  params.set("depth", "1");
  params.set("sort", "-createdAt");

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/products?${params.toString()}`, { cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs || [];
}

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

/** Every real Brand doc that has a slug (a handful of legacy duplicate
 * records — see backend/src/scripts/backfillBrandSlugs.ts — don't, and are
 * skipped rather than linked to a page with 0 real products), with a real
 * count of currently-visible products. Used by /marques and to resolve
 * /marques/[slug]. */
export async function fetchAllBrandsWithCounts(): Promise<StorefrontBrand[]> {
  const [brandsRes, docs] = await Promise.all([
    // depth=1 resolves the logo upload to its media doc; `select` keeps the
    // response to the three fields this needs instead of every brand field.
    fetch(`${CMS_URL}/api/brands?limit=500&sort=name&depth=1&select[name]=true&select[slug]=true&select[logo]=true`, {
      cache: "no-store",
    }).catch(() => null),
    fetchVisibleDocs(),
  ]);
  if (!brandsRes || !brandsRes.ok) return [];
  const brandsData = await brandsRes.json();
  const brandDocs = (brandsData.docs || []) as {
    id: number;
    logo?: { url?: string } | null;
    name: string;
    slug?: string;
  }[];

  const countByBrandId = new Map<number, number>();
  for (const doc of docs) {
    const brandId = typeof doc.brand === "object" && doc.brand ? doc.brand.id : doc.brand;
    if (typeof brandId !== "number") continue;
    countByBrandId.set(brandId, (countByBrandId.get(brandId) || 0) + 1);
  }

  return brandDocs
    .filter((b) => Boolean(b.slug))
    .map((b) => ({
      id: b.id,
      logo: b.logo?.url || null,
      name: b.name,
      productCount: countByBrandId.get(b.id) || 0,
      slug: b.slug as string,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchCatalogue(query: CatalogueQuery): Promise<CatalogueResult> {
  const docs = await fetchVisibleDocs();
  const all = docs.map(toCatalogueProduct);

  const facets: CatalogueFacets = {
    brands: CATALOGUE_BRANDS.map((name) => ({
      count: all.filter((p) => p.brand.toLowerCase() === name.toLowerCase()).length,
      name,
    })).filter((b) => b.count > 0),
    categories: CATALOGUE_CATEGORIES.map((value) => ({
      count: all.filter((p) => p.cat === value).length,
      value,
    })),
    inStockCount: all.filter((p) => p.stockState !== "out").length,
    totalCount: all.length,
  };

  const q = (query.q || "").trim().toLowerCase();
  let list = all
    .filter((p) => !query.maxPrice || p.price <= query.maxPrice)
    .filter((p) => !query.categories?.length || query.categories.includes(p.cat))
    .filter((p) => !query.brand || p.brand.toLowerCase() === query.brand.toLowerCase())
    .filter((p) => !query.inStockOnly || p.stockState !== "out")
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));

  if (query.tag) {
    const brandMatch = CATALOGUE_BRANDS.find((b) => b.toLowerCase() === query.tag!.toLowerCase());
    const mappedCategory = TAG_TO_CATEGORY[query.tag];
    if (brandMatch) list = list.filter((p) => p.brand === brandMatch);
    else if (mappedCategory) list = list.filter((p) => p.cat === mappedCategory);
  }

  switch (query.quick) {
    case "−25% sélection soin":
      list = list.filter((p) => !!p.old);
      break;
    case "Nouveautés":
      list = list.filter((p) => p.badges.some((b) => b.text === "Nouveau"));
      break;
    case "Meilleures ventes":
      list = list.filter((p) => p.rating === 5);
      break;
    case "Solaire SPF 50+":
      list = list.filter((p) => p.cat === "Solaire");
      break;
    default:
      break;
  }

  switch (query.sort) {
    case "price-asc":
      list = list.slice().sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list = list.slice().sort((a, b) => b.price - a.price);
      break;
    case "newest":
      break; // already newest-first from the fetch above
    default:
      list = list.slice().sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  }

  const total = list.length;
  const limit = query.limit || 24;
  const products = list.slice(0, limit);

  return { facets, products, total };
}
