import { payloadCount, payloadFetch } from "./payload";
import type { Product } from "./products-types";

export type StockMovementSource = "import" | "manual" | "order" | "adjustment" | "restock";

export type StockMovement = {
  id: number;
  product?: { id: number; name: string } | number | null;
  previousStock: number;
  newStock: number;
  delta: number;
  source: StockMovementSource;
  reason?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  supplier?: { id: number; name: string } | number | null;
  reference?: string | null;
  createdBy?: { id: number; email: string } | number | null;
  createdAt: string;
};

export type Supplier = { id: number; name: string };

export type InventoryBatch = {
  id: number;
  product?: { id: number; name: string } | number | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  supplier?: { id: number; name: string } | number | null;
  quantity: number;
  receivedAt?: string | null;
};

// ------------------------------------------------------------ stock table

export const INVENTORY_FILTERS = ["all", "out", "low", "ok"] as const;
export type InventoryFilter = (typeof INVENTORY_FILTERS)[number];

/** A product as the stock table shows it, and nothing more. */
export type InventoryRow = Pick<Product, "id" | "name" | "sku" | "stock" | "lowStockThreshold" | "isPublished" | "discontinued"> & {
  brand: string;
};

export const INVENTORY_PAGE_SIZE = 50;

/** The `where` for a filter and a search, as bracketed REST params. */
function inventoryWhere(filter: InventoryFilter, search: string): URLSearchParams {
  const p = new URLSearchParams();
  let i = 0;
  const q = search.trim();
  if (q) {
    p.set(`where[and][${i}][or][0][name][like]`, q);
    p.set(`where[and][${i}][or][1][sku][like]`, q);
    i++;
  }
  // `isLowStock` is maintained by a database trigger as stock > 0 and
  // stock <= threshold — the same rule stockStatus() applies on screen.
  if (filter === "out") p.set(`where[and][${i++}][stock][less_than_equal]`, "0");
  if (filter === "low") p.set(`where[and][${i++}][isLowStock][equals]`, "true");
  if (filter === "ok") {
    p.set(`where[and][${i++}][stock][greater_than]`, "0");
    p.set(`where[and][${i++}][isLowStock][equals]`, "false");
  }
  return p;
}

/**
 * One page of the stock table, lowest stock first — the order the table
 * always had — filtered and searched in Postgres.
 *
 * It used to fetch the whole catalogue with every relation populated and
 * sort it in the browser: on a 12 000-product database that was a 1.4 MB page
 * answering in eleven seconds. `select` and `populate` keep each row to the
 * eight fields the table reads.
 */
export async function listInventoryPage({
  filter,
  search,
  page,
}: {
  filter: InventoryFilter;
  search: string;
  page: number;
}): Promise<{ rows: InventoryRow[]; totalDocs: number; totalPages: number; page: number }> {
  const p = inventoryWhere(filter, search);
  p.set("depth", "1");
  p.set("limit", String(INVENTORY_PAGE_SIZE));
  p.set("page", String(page));
  p.set("sort", "stock,name");
  for (const f of ["name", "sku", "stock", "lowStockThreshold", "isPublished", "discontinued", "brand"]) p.set(`select[${f}]`, "true");
  p.set("populate[brands][name]", "true");

  const res = await payloadFetch(`/api/products?${p.toString()}`);
  if (!res.ok) throw new Error("Impossible de charger l'inventaire.");
  const data = await res.json();
  type Raw = Omit<InventoryRow, "brand"> & { brand?: { name?: string } | number | null };
  return {
    page: data.page ?? page,
    rows: ((data.docs ?? []) as Raw[]).map((d) => ({
      ...d,
      brand: typeof d.brand === "object" && d.brand ? d.brand.name ?? "" : "",
      lowStockThreshold: d.lowStockThreshold ?? 5,
      stock: d.stock ?? 0,
    })),
    totalDocs: data.totalDocs ?? 0,
    totalPages: data.totalPages ?? 1,
  };
}

/** The tiles above the table, counted rather than downloaded. Null when the
 * catalogue cannot be read, so the tiles say "—" instead of 0. */
export async function inventoryCounts(): Promise<{ total: number; low: number; out: number } | null> {
  const [total, low, out] = await Promise.all([
    payloadCount("/api/products/count"),
    payloadCount("/api/products/count?where[isLowStock][equals]=true"),
    payloadCount("/api/products/count?where[stock][less_than_equal]=0"),
  ]);
  return total === null || low === null || out === null ? null : { low, out, total };
}

/** Batches of the given products only — what the table's supplier and
 * expiry columns need for the page on screen. */
export async function listBatchesFor(productIds: number[]): Promise<InventoryBatch[]> {
  if (productIds.length === 0) return [];
  const p = new URLSearchParams({ depth: "1", limit: "1000", sort: "expiryDate" });
  p.set("where[product][in]", productIds.join(","));
  for (const f of ["product", "expiryDate", "supplier", "batchNumber", "quantity"]) p.set(`select[${f}]`, "true");
  // The product stays an id; only the supplier's name is needed.
  p.set("populate[products][id]", "true");
  p.set("populate[suppliers][name]", "true");
  const res = await payloadFetch(`/api/inventory?${p.toString()}`);
  if (!res.ok) return [];
  return (await res.json()).docs ?? [];
}

export async function listRecentStockMovements(limit = 20): Promise<StockMovement[]> {
  // Populated, but only with the names the movements table prints.
  const res = await payloadFetch(
    `/api/stock-movements?limit=${limit}&depth=1&sort=-createdAt&populate[products][name]=true&populate[suppliers][name]=true&populate[users][email]=true`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs;
}

export async function listProductMovements(productId: number, limit = 100): Promise<StockMovement[]> {
  const where = encodeURIComponent(JSON.stringify({ product: { equals: productId } }));
  const res = await payloadFetch(`/api/stock-movements?where=${where}&limit=${limit}&depth=1&sort=-createdAt`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const res = await payloadFetch("/api/suppliers?limit=500&sort=name&depth=0");
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs;
}


/** Batches expiring within `withinDays`, still holding stock — used for the
 * "Expiring soon" dashboard stat and the inventory table's expiry column. */
export async function listExpiringBatches(withinDays = 60): Promise<InventoryBatch[]> {
  const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000).toISOString();
  const where = encodeURIComponent(
    JSON.stringify({ and: [{ expiryDate: { less_than: cutoff } }, { quantity: { greater_than: 0 } }] }),
  );
  // depth=0: the caller only counts distinct product ids.
  const res = await payloadFetch(`/api/inventory?where=${where}&limit=200&depth=0&sort=expiryDate&select[product]=true&select[expiryDate]=true`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs;
}
