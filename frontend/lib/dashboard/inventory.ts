import { payloadFetch } from "./payload";

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

export async function listRecentStockMovements(limit = 20): Promise<StockMovement[]> {
  const res = await payloadFetch(`/api/stock-movements?limit=${limit}&depth=1&sort=-createdAt`);
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

/** Every open batch — used to derive a per-product "latest supplier /
 * nearest expiry" summary for the inventory table's Supplier/Expiry columns. */
export async function listInventoryBatches(limit = 1000): Promise<InventoryBatch[]> {
  const res = await payloadFetch(`/api/inventory?limit=${limit}&depth=1&sort=expiryDate`);
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
  const res = await payloadFetch(`/api/inventory?where=${where}&limit=200&depth=1&sort=expiryDate`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs;
}
