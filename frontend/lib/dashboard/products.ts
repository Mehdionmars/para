import { payloadFetch } from "./payload";
import type { ProductQuery } from "./product-query";
import type { Brand, Product } from "./products-types";

export * from "./products-types";

export async function listProducts(): Promise<Product[]> {
  const res = await payloadFetch("/api/products?limit=1000&depth=1&sort=-createdAt");
  if (!res.ok) throw new Error("Impossible de charger les produits.");
  const data = await res.json();
  return data.docs;
}

export type ProductPage = {
  docs: Product[];
  totalDocs: number;
  totalPages: number;
  page: number;
};

/**
 * Builds the Payload REST query for one page of the catalogue.
 *
 * Filtering, sorting and pagination all happen in Postgres. The previous
 * implementation fetched every product and filtered in the browser, which is
 * fine at 250 rows and unusable at 5 000: it transferred the whole catalogue
 * (including every image URL) on each visit and re-sorted it in JS.
 */
function buildProductParams(q: ProductQuery): URLSearchParams {
  const p = new URLSearchParams();
  p.set("depth", "1");
  p.set("limit", String(q.perPage));
  p.set("page", String(q.page));
  p.set("sort", `${q.dir === "desc" ? "-" : ""}${q.sort}`);

  let i = 0;
  const where = (path: string, value: string) => p.set(`where[and][${i++}]${path}`, value);

  if (q.search) {
    // One OR group across the fields an operator would actually type into a
    // search box. `brand.name` traverses the relationship server-side.
    const fields = ["name", "sku", "barcode", "brand.name"];
    const group = i++;
    fields.forEach((f, j) => p.set(`where[and][${group}][or][${j}][${f}][like]`, q.search));
  }

  if (q.category !== "all") where("[category][equals]", q.category);
  if (q.brand !== "all") where("[brand][equals]", q.brand);

  if (q.status === "published") {
    where("[isPublished][equals]", "true");
    where("[discontinued][not_equals]", "true");
  } else if (q.status === "draft") {
    where("[isPublished][equals]", "false");
    where("[discontinued][not_equals]", "true");
  } else if (q.status === "archived") {
    where("[discontinued][equals]", "true");
  }

  if (q.stock === "out") where("[stock][less_than_equal]", "0");
  else if (q.stock === "in-stock") where("[stock][greater_than]", "0");
  // Exact, server-side and indexed: `isLowStock` is a column maintained by a
  // Postgres trigger as `stock > 0 AND stock <= lowStockThreshold`. It
  // replaces a `stock <= 100` approximation that missed any product whose own
  // threshold was higher, and that had to over-fetch and refine in JS —
  // which also made the result count wrong.
  else if (q.stock === "low") where("[isLowStock][equals]", "true");

  if (q.promo === "on-sale") where("[oldPrice][greater_than]", "0");
  else if (q.promo === "no-sale") where("[oldPrice][exists]", "false");

  if (q.featured) where("[featured][equals]", "true");
  if (q.minPrice) where("[price][greater_than_equal]", q.minPrice);
  if (q.maxPrice) where("[price][less_than_equal]", q.maxPrice);

  return p;
}

export async function listProductsPage(q: ProductQuery): Promise<ProductPage> {
  const res = await payloadFetch(`/api/products?${buildProductParams(q).toString()}`);
  if (!res.ok) throw new Error("Impossible de charger les produits.");
  const data = await res.json();

  const docs: Product[] = data.docs ?? [];
  const totalDocs: number = data.totalDocs ?? docs.length;

  return {
    docs,
    page: data.page ?? q.page,
    totalDocs,
    totalPages: data.totalPages ?? 1,
  };
}

/** Every id matching the current filters, for "select all across results" and
 * for CSV export. Ids only — deliberately not the full documents. */
export async function listProductIds(q: ProductQuery, cap = 5000): Promise<number[]> {
  const params = buildProductParams({ ...q, page: 1, perPage: 100 });
  params.set("limit", String(cap));
  params.set("depth", "0");
  params.delete("page");

  const res = await payloadFetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error("Impossible de charger la sélection.");
  const data = await res.json();

  const docs: Product[] = data.docs ?? [];
  return docs.map((p) => p.id);
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await payloadFetch(`/api/products/${id}?depth=1`);
  if (!res.ok) return null;
  return res.json();
}

export async function listBrands(): Promise<Brand[]> {
  const res = await payloadFetch("/api/brands?limit=200&sort=name");
  if (!res.ok) throw new Error("Impossible de charger les marques.");
  const data = await res.json();
  return data.docs;
}
