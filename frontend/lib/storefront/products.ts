// Server-only: live product data for storefront rails, fetched directly from
// Payload on every request — NOT data/products.ts, which is a point-in-time
// snapshot written by `npm run sync-cms`. A price/stock/image edit made in
// the CMS shows up here on the next page load, no re-sync needed.
import { CMS_URL } from "@/lib/dashboard/constants";
import { stockStatus } from "@/lib/dashboard/products-types";
import { BADGE_TYPE_PRESETS, resolveProductBadges } from "@/lib/productBadges";
import type { Category, Product } from "@/data/products";
import type { RailDef } from "@/data/home";
import type { StockState } from "./catalogue";

export type LiveProduct = Product & { image: string };

export type ResolvedBadge = { text: string; bgColor: string; textColor: string; priority: number };

export type PayloadMediaRef = { url?: string } | number | null | undefined;
export type PayloadBrandRef = { id?: number; name?: string } | number | null | undefined;

export type PayloadBadge = {
  enabled?: boolean | null;
  type?: string | null;
  text?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  priority?: number | null;
};

export type PayloadProductDoc = {
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
};

export type PayloadVariantRow = {
  /** Payload's own array-row id (a varchar). Stable across edits to the row,
   * which is what makes it usable as a cart and order-line identity. */
  id?: string | null;
  image?: PayloadMediaRef;
  optionValue?: string | null;
  sku?: string | null;
  barcode?: string | null;
  /** Null in "same-price" mode — the product's own price applies. */
  price?: number | null;
  oldPrice?: number | null;
  stock?: number | null;
  lowStockThreshold?: number | null;
  active?: boolean | null;
};

/** The extra fields only the product detail page needs (gallery, live
 * inventory, variants) on top of what rails already read. */
export type PayloadProductDetailDoc = PayloadProductDoc & {
  hasVariants?: boolean | null;
  variantOptionType?: string | null;
  variantPricingMode?: "same-price" | "per-variant" | null;
  variants?: PayloadVariantRow[] | null;
  updatedAt?: string;
  gallery?: { image?: PayloadMediaRef }[] | null;
  stock?: number | null;
  lowStockThreshold?: number | null;
  sku?: string | null;
  barcode?: string | null;
  isPublished?: boolean | null;
  discontinued?: boolean | null;
};

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Badge labels/colours/priorities now live in lib/productBadges.ts, shared
// with the ProductBadges component — this file used to keep its own copy.

export function resolveMediaUrl(media: PayloadMediaRef): string {
  if (media && typeof media === "object" && media.url) {
    return media.url.startsWith("http") ? media.url : `${CMS_URL}${media.url}`;
  }
  return "";
}

export function resolveBrandName(brand: PayloadBrandRef): string {
  return brand && typeof brand === "object" && brand.name ? brand.name : "";
}

/**
 * A badge derived from real signals when the editor configured none.
 *
 * The discount case is handled upstream by resolveProductBadges (it must
 * coexist with configured badges, not replace them), so this only covers
 * "featured" and "recently added". Empty bgColor/textColor means "use the
 * theme's default badge colors", resolved at render time from the
 * --pdh-badge-* vars so a theme change applies without a re-sync.
 */
function computeAutoBadge(doc: PayloadProductDoc): Omit<ResolvedBadge, "priority"> | null {
  if (doc.featured) return { text: "Top", bgColor: "", textColor: "" };
  if (Date.now() - new Date(doc.createdAt).getTime() < NEW_WINDOW_MS) return { text: "Nouveau", bgColor: "", textColor: "" };
  return null;
}

/** An editor's explicitly configured badges win; only when none are enabled
 * (or none resolve to real text) does a single badge get computed from real
 * signals — a genuine discount, "featured", or recency — never random. */
export function resolveBadges(doc: PayloadProductDoc): ResolvedBadge[] {
  const oldPrice = doc.oldPrice ?? null;

  // The editor's badges plus the automatic discount pill, merged and
  // ordered by priority (discount is always 1, so a real markdown leads).
  const resolved = resolveProductBadges(doc.badges || [], doc.price, oldPrice);
  if (resolved.length > 0) return resolved;

  // Nothing configured and no markdown: fall back to a single signal-derived
  // badge (featured / recently added). Deliberately only when the editor
  // configured nothing — otherwise every new product would wear an extra
  // "Nouveau" on top of the badges someone actually chose.
  const auto = computeAutoBadge(doc);
  return auto ? [{ ...auto, priority: BADGE_TYPE_PRESETS.nouveau.priority }] : [];
}

function toLiveProduct(doc: PayloadProductDoc): LiveProduct {
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
    tint: doc.tint || "#F2F2F2",
  };
}

// Every eligibility rule a homepage rail applies, in one place — mirrors the
// "why is this product excluded" reasons shown in the dashboard.
const BASE_ELIGIBILITY: Record<string, unknown>[] = [
  { isPublished: { equals: true } },
  { discontinued: { not_equals: true } },
  { stock: { greater_than: 0 } },
];

function sortParam(sortOrder: RailDef["sortOrder"]): string {
  switch (sortOrder) {
    case "price-asc":
      return "price";
    case "price-desc":
      return "-price";
    case "name-asc":
      return "name";
    case "rating-desc":
      return "-rating";
    default:
      return "-createdAt";
  }
}

async function fetchProducts(where: Record<string, unknown>, limit: number, sort: string): Promise<PayloadProductDoc[]> {
  const params = new URLSearchParams();
  params.set("where", JSON.stringify(where));
  params.set("limit", String(limit));
  params.set("depth", "1");
  params.set("sort", sort);

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

/** Real order-quantity ranking from the PII-free aggregate endpoint — never
 * a fabricated "sales" number. Empty when no non-cancelled orders exist yet. */
async function fetchBestSellingRanking(limit: number): Promise<number[]> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/homepage/best-selling?limit=${limit * 3}`, { cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const data = await res.json();
  return (data.ranked as { productId: number; quantity: number }[]).map((r) => r.productId);
}

/** The "no eligible products for this rail's configured source" case —
 * falls back to the broadest honest query (any in-stock, published,
 * non-discontinued product, newest first) rather than an empty section. */
async function fetchFallback(limit: number): Promise<PayloadProductDoc[]> {
  return fetchProducts({ and: BASE_ELIGIBILITY }, limit, "-createdAt");
}

/** Resolves one rail's products live against Payload/Postgres. Always
 * `cache: "no-store"` — this is specifically the data whose freshness on
 * refresh matters (price/stock/image edits), unlike the rest of the page's
 * synced editorial copy. */
export async function fetchRailProducts(rail: RailDef): Promise<LiveProduct[]> {
  const limit = rail.limit || 8;
  let docs: PayloadProductDoc[] = [];

  if (rail.productSource === "manual") {
    if (rail.productIds.length) {
      const and = [...BASE_ELIGIBILITY, { id: { in: rail.productIds } }];
      const found = await fetchProducts({ and }, rail.productIds.length, "-createdAt");
      const byId = new Map(found.map((d) => [d.id, d]));
      // Payload's `in` doesn't preserve request order — restore the curator's own picked order.
      docs = rail.productIds.map((id) => byId.get(id)).filter((d): d is PayloadProductDoc => Boolean(d));
    }
  } else if (rail.productSource === "bestSelling") {
    const ranking = await fetchBestSellingRanking(limit);
    if (ranking.length) {
      const and = [...BASE_ELIGIBILITY, { id: { in: ranking } }];
      const found = await fetchProducts({ and }, ranking.length, "-createdAt");
      const byId = new Map(found.map((d) => [d.id, d]));
      docs = ranking
        .map((id) => byId.get(id))
        .filter((d): d is PayloadProductDoc => Boolean(d))
        .slice(0, limit);
    }
    // No real sales yet (new store, or every past order was cancelled/refunded)
    // — falls through to the generic fallback below rather than inventing a ranking.
  } else {
    // "brand" has no extra clause of its own — brandFilterId below is the
    // whole point of that source. "promotion" means a real discount is set
    // (oldPrice only ever holds a value when there's a genuine markdown,
    // same convention `computeBadge` above already relies on).
    const and = [...BASE_ELIGIBILITY];
    if (rail.brandFilterId) and.push({ brand: { equals: rail.brandFilterId } });
    if (rail.productSource === "featured") and.push({ featured: { equals: true } });
    if (rail.productSource === "category" && rail.category) and.push({ category: { equals: rail.category } });
    if (rail.productSource === "promotion") and.push({ oldPrice: { greater_than: 0 } });
    docs = await fetchProducts({ and }, limit, sortParam(rail.sortOrder));
  }

  if (docs.length === 0) {
    docs = await fetchFallback(limit);
  }

  return docs.map(toLiveProduct);
}

/** Resolves a specific, curator-picked set of products live (same eligibility
 * rules and order-preservation as a manual rail) — used for the campaign
 * block's product picks and the dermo corner's per-product highlights. */
export async function fetchProductsByIds(ids: number[]): Promise<LiveProduct[]> {
  if (ids.length === 0) return [];
  const and = [...BASE_ELIGIBILITY, { id: { in: ids } }];
  const found = await fetchProducts({ and }, ids.length, "-createdAt");
  const byId = new Map(found.map((d) => [d.id, d]));
  return ids.map((id) => byId.get(id)).filter((d): d is PayloadProductDoc => Boolean(d)).map(toLiveProduct);
}

// ---- product detail page ------------------------------------------------

/** Thrown when Payload itself is unreachable/erroring, as opposed to
 * answering "no such product". The detail page must tell these apart: the
 * first is a 500 (a real outage we should surface), the second a 404.
 * Collapsing them would make every CMS hiccup look like a deleted product
 * and quietly de-index the whole catalogue. */
export class CmsUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Payload CMS is unreachable");
    this.name = "CmsUnavailableError";
    this.cause = cause;
  }
}

/** One selectable option (a contenance, a format, a shade…) as the PDP
 * needs it: price already resolved for the product's pricing mode, stock
 * and identifiers always its own. */
export type LiveVariant = {
  /** The `products_variants` row id. The cart, the checkout and the order
   * line all key on it — never on the option's label, which an editor can
   * rename without that meaning "a different product". */
  id: string;
  optionValue: string;
  sku: string;
  price: number;
  old: number;
  stock: number;
  stockState: StockState;
  /** This option's own photo. Empty when the row has none, in which case the
   * product's gallery stands. */
  image: string;
};

export type LiveProductDetail = Product & {
  image: string;
  /** Hero image first, then the CMS gallery rows. Never empty. */
  gallery: string[];
  stock: number;
  stockState: StockState;
  sku: string;
  updatedAt: string;
  /** Empty when the product has no variants — the PDP then shows no
   * option selector at all rather than an invented one. */
  variants: LiveVariant[];
  /** Label for the selector, e.g. "Contenance". Empty when no variants. */
  variantOptionLabel: string;
  /** True when every variant shares the product's price, so the displayed
   * amount must not change as the shopper switches option. */
  sameVariantPrice: boolean;
};

/** A product page is only served for a product the storefront actually
 * sells — same visibility rule the catalogue applies, so unpublishing or
 * discontinuing one in Payload takes its page down on the next request
 * without a rebuild. */
const DETAIL_VISIBLE = [{ isPublished: { equals: true } }, { discontinued: { not_equals: true } }];

const NO_PHOTO_PLACEHOLDER = "/assets/product-placeholder.svg";

/** Human label for the selector, from the CMS's option-type enum. */
const VARIANT_OPTION_LABELS: Record<string, string> = {
  contenance: "Contenance",
  format: "Format",
  taille: "Taille",
  couleur: "Couleur",
  parfum: "Parfum",
  pack: "Pack",
  autre: "Option",
};

function toLiveProductDetail(doc: PayloadProductDetailDoc): LiveProductDetail {
  const hero = resolveMediaUrl(doc.image) || NO_PHOTO_PLACEHOLDER;
  const galleryImages = (doc.gallery || []).map((row) => resolveMediaUrl(row.image)).filter(Boolean);
  const stock = doc.stock ?? 0;

  // "same-price" is the default and the fallback for a null: a variant row
  // without its own price must never render as 0 MAD.
  const sameVariantPrice = (doc.variantPricingMode ?? "same-price") !== "per-variant";

  const variants: LiveVariant[] = doc.hasVariants
    ? (doc.variants || [])
        // A row with no id could not be told apart from another in the cart
        // or on an order, so it is not offered for sale at all.
        .filter((v) => v.active !== false && v.optionValue && v.id)
        .map((v) => {
          const variantStock = v.stock ?? 0;
          const price = sameVariantPrice ? doc.price : (v.price ?? doc.price);
          const old = sameVariantPrice
            ? doc.oldPrice && doc.oldPrice > doc.price
              ? doc.oldPrice
              : 0
            : v.oldPrice && v.price && v.oldPrice > v.price
              ? v.oldPrice
              : 0;
          return {
            id: String(v.id),
            image: resolveMediaUrl(v.image) || "",
            old,
            optionValue: String(v.optionValue),
            price,
            sku: v.sku || doc.sku || "",
            stock: variantStock,
            stockState: stockStatus({ lowStockThreshold: v.lowStockThreshold ?? 5, stock: variantStock }),
          };
        })
    : [];

  return {
    sameVariantPrice,
    variantOptionLabel: variants.length ? VARIANT_OPTION_LABELS[doc.variantOptionType || "contenance"] || "Option" : "",
    variants,
    badges: resolveBadges(doc),
    brand: resolveBrandName(doc.brand),
    cat: doc.category as Category,
    desc: doc.description || "",
    gallery: [hero, ...galleryImages],
    id: doc.id,
    image: hero,
    name: doc.name,
    old: doc.oldPrice && doc.oldPrice > doc.price ? doc.oldPrice : 0,
    price: doc.price,
    rating: doc.rating ?? 5,
    reviews: doc.reviews ?? 0,
    size: doc.size || "",
    sku: doc.sku || "",
    slug: doc.slug || String(doc.id),
    stock,
    stockState: stockStatus({ lowStockThreshold: doc.lowStockThreshold ?? 5, stock }),
    tint: doc.tint || "#F2F2F2",
    updatedAt: doc.updatedAt || doc.createdAt,
  };
}

/** One product, resolved live against Payload by its `slug` (never by id —
 * see fetchProductByLegacyId for the old numeric-URL redirect path).
 *
 * `cache: "no-store"`: this page shows price, stock and availability, the
 * data a shopper acts on and where being stale is actively harmful. Slower-
 * moving page furniture (similar products) is cached separately below.
 *
 * Returns null when Payload answers but has no matching visible product
 * (→ 404); throws CmsUnavailableError when Payload can't be reached at all. */
export async function fetchProductBySlug(slug: string): Promise<LiveProductDetail | null> {
  const params = new URLSearchParams();
  params.set("where", JSON.stringify({ and: [...DETAIL_VISIBLE, { slug: { equals: slug } }] }));
  params.set("limit", "1");
  params.set("depth", "2");

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/products?${params.toString()}`, { cache: "no-store" });
  } catch (err) {
    throw new CmsUnavailableError(err);
  }
  if (!res.ok) throw new CmsUnavailableError(`HTTP ${res.status}`);

  const data = await res.json();
  const doc = (data.docs || [])[0] as PayloadProductDetailDoc | undefined;
  return doc ? toLiveProductDetail(doc) : null;
}

/** Old links used the numeric id (`/produit/123`). Resolves one so the page
 * can permanent-redirect to the product's real slug instead of 404ing a URL
 * that may still be bookmarked, shared or indexed. */
export async function fetchProductByLegacyId(param: string): Promise<LiveProductDetail | null> {
  if (!/^\d+$/.test(param)) return null;

  const params = new URLSearchParams();
  params.set("where", JSON.stringify({ and: [...DETAIL_VISIBLE, { id: { equals: Number(param) } }] }));
  params.set("limit", "1");
  params.set("depth", "2");

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/products?${params.toString()}`, { cache: "no-store" });
  } catch (err) {
    throw new CmsUnavailableError(err);
  }
  if (!res.ok) throw new CmsUnavailableError(`HTTP ${res.status}`);

  const data = await res.json();
  const doc = (data.docs || [])[0] as PayloadProductDetailDoc | undefined;
  return doc ? toLiveProductDetail(doc) : null;
}

/** Same-category suggestions for the "Vous aimerez aussi" rail. Unlike the
 * product itself this is editorial filler, not data a shopper transacts on,
 * so it's cached for 5 minutes instead of fetched fresh on every hit. */
export async function fetchSimilarProducts(product: { id: number; cat: string }, limit = 4): Promise<LiveProduct[]> {
  const where = {
    and: [...BASE_ELIGIBILITY, { category: { equals: product.cat } }, { id: { not_equals: product.id } }],
  };
  const params = new URLSearchParams();
  params.set("where", JSON.stringify(where));
  params.set("limit", String(limit));
  params.set("depth", "1");
  params.set("sort", "-createdAt");

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/products?${params.toString()}`, { next: { revalidate: 300 } });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.docs || []) as PayloadProductDoc[]).map(toLiveProduct);
}
