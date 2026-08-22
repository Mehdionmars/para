// Shared, client-safe description of the catalogue list state.
//
// The whole products page is driven by the URL: search, filters, sort, page
// and page size all live in the query string. That makes a filtered view
// shareable and bookmarkable, survives a refresh, and — the reason it
// matters most — lets the list be fetched *server-side* with only the rows
// that are actually displayed, instead of pulling the entire catalogue into
// the browser and filtering it there.

export const STOCK_FILTERS = ["all", "in-stock", "low", "out"] as const;
export type StockFilter = (typeof STOCK_FILTERS)[number];

export const STATUS_FILTERS = ["all", "published", "draft", "archived"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const PROMO_FILTERS = ["all", "on-sale", "no-sale"] as const;
export type PromoFilter = (typeof PROMO_FILTERS)[number];

export const SORTABLE = ["name", "category", "price", "stock", "isPublished", "updatedAt"] as const;
export type SortField = (typeof SORTABLE)[number];

export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 50;

export type ProductQuery = {
  search: string;
  category: string;
  brand: string;
  status: StatusFilter;
  stock: StockFilter;
  promo: PromoFilter;
  featured: boolean;
  minPrice: string;
  maxPrice: string;
  sort: SortField;
  dir: "asc" | "desc";
  page: number;
  perPage: number;
};

export const EMPTY_QUERY: ProductQuery = {
  brand: "all",
  category: "all",
  dir: "desc",
  featured: false,
  maxPrice: "",
  minPrice: "",
  page: 1,
  perPage: DEFAULT_PAGE_SIZE,
  promo: "all",
  search: "",
  sort: "updatedAt",
  status: "all",
  stock: "all",
};

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes((value ?? "") as T) ? ((value ?? "") as T) : fallback;
}

export function parseProductQuery(params: Record<string, string | string[] | undefined>): ProductQuery {
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const perPage = Number(get("perPage"));
  const page = Number(get("page"));

  return {
    brand: get("brand") || "all",
    category: get("category") || "all",
    dir: get("dir") === "asc" ? "asc" : "desc",
    featured: get("featured") === "1",
    maxPrice: get("maxPrice") || "",
    minPrice: get("minPrice") || "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    perPage: (PAGE_SIZES as readonly number[]).includes(perPage) ? perPage : DEFAULT_PAGE_SIZE,
    promo: oneOf(get("promo"), PROMO_FILTERS, "all"),
    search: (get("search") || "").trim(),
    sort: oneOf(get("sort"), SORTABLE, "updatedAt"),
    status: oneOf(get("status"), STATUS_FILTERS, "all"),
    stock: oneOf(get("stock"), STOCK_FILTERS, "all"),
  };
}

/** Serialises back to a query string, omitting defaults so the URL stays readable. */
export function toSearchParams(query: Partial<ProductQuery>): URLSearchParams {
  const params = new URLSearchParams();
  const q = { ...EMPTY_QUERY, ...query };

  if (q.search) params.set("search", q.search);
  if (q.category !== "all") params.set("category", q.category);
  if (q.brand !== "all") params.set("brand", q.brand);
  if (q.status !== "all") params.set("status", q.status);
  if (q.stock !== "all") params.set("stock", q.stock);
  if (q.promo !== "all") params.set("promo", q.promo);
  if (q.featured) params.set("featured", "1");
  if (q.minPrice) params.set("minPrice", q.minPrice);
  if (q.maxPrice) params.set("maxPrice", q.maxPrice);
  if (q.sort !== EMPTY_QUERY.sort) params.set("sort", q.sort);
  if (q.dir !== EMPTY_QUERY.dir) params.set("dir", q.dir);
  if (q.page > 1) params.set("page", String(q.page));
  if (q.perPage !== DEFAULT_PAGE_SIZE) params.set("perPage", String(q.perPage));

  return params;
}

/** How many filters the "Filtres (n)" badge should show. Search, sort and
 * pagination are not filters — they have their own visible controls. */
export function countActiveFilters(q: ProductQuery): number {
  let n = 0;
  if (q.category !== "all") n++;
  if (q.brand !== "all") n++;
  if (q.status !== "all") n++;
  if (q.stock !== "all") n++;
  if (q.promo !== "all") n++;
  if (q.featured) n++;
  if (q.minPrice) n++;
  if (q.maxPrice) n++;
  return n;
}
