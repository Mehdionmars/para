import { InventoryTable, type ProductBatchInfo } from "@/components/dashboard/inventory/InventoryTable";
import { requireRole } from "@/lib/dashboard/guard";
import {
  listExpiringBatches,
  listInventoryBatches,
  listRecentStockMovements,
  listSuppliers,
} from "@/lib/dashboard/inventory";
import { listProducts } from "@/lib/dashboard/products";
import { stockStatus } from "@/lib/dashboard/products-types";
import { hasRole } from "@/lib/dashboard/roles";

const MOVEMENT_SOURCE_LABELS: Record<string, string> = {
  adjustment: "Ajustement",
  import: "Import",
  manual: "Manuel",
  order: "Commande",
  restock: "Réapprovisionnement",
};

function supplierName(supplier: { id: number; name: string } | number | null | undefined): string | null {
  return typeof supplier === "object" && supplier ? supplier.name : null;
}

/** One "which batch to show" per product: the soonest upcoming expiry if any
 * batch has one, else the most recently received batch — so the table shows
 * something useful even for products without expiry-tracked stock. */
function buildBatchInfo(batches: Awaited<ReturnType<typeof listInventoryBatches>>): Record<number, ProductBatchInfo> {
  const info: Record<number, ProductBatchInfo> = {};
  for (const batch of batches) {
    const productId = typeof batch.product === "object" ? batch.product?.id : batch.product;
    if (!productId) continue;
    const existing = info[productId];
    const hasExpiry = Boolean(batch.expiryDate);
    const shouldReplace =
      !existing ||
      (hasExpiry && (!existing.nearestExpiry || batch.expiryDate! < existing.nearestExpiry)) ||
      (!existing.nearestExpiry && !hasExpiry);
    if (shouldReplace) {
      info[productId] = { nearestExpiry: batch.expiryDate || null, supplierName: supplierName(batch.supplier) };
    }
  }
  return info;
}

export default async function InventoryPage() {
  await requireRole((user) => hasRole(user, "admin", "manager", "stockManager"));
  const [products, movements, suppliers, batches, expiringBatches] = await Promise.all([
    listProducts(),
    listRecentStockMovements(20),
    listSuppliers(),
    listInventoryBatches(),
    listExpiringBatches(60),
  ]);

  const lowStockCount = products.filter((p) => stockStatus(p) === "low").length;
  const outOfStockCount = products.filter((p) => stockStatus(p) === "out").length;
  const recentRestocks = movements.filter((m) => m.source === "restock").length;
  const expiringProductIds = new Set(
    expiringBatches.map((b) => (typeof b.product === "object" ? b.product?.id : b.product)).filter(Boolean),
  );
  const batchInfo = buildBatchInfo(batches);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Inventaire</h1>
        <p className="mt-1 text-sm text-gray-500">
          Niveaux de stock par produit, réapprovisionnement traçable et éligibilité aux rails de la page
          d&apos;accueil.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="text-xs text-gray-500">Produits</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{products.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="text-xs text-gray-500">Stock faible</div>
          <div className="mt-1 text-xl font-semibold text-amber-600">{lowStockCount}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="text-xs text-gray-500">Rupture</div>
          <div className="mt-1 text-xl font-semibold text-red-600">{outOfStockCount}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="text-xs text-gray-500">Expiration proche (60j)</div>
          <div className="mt-1 text-xl font-semibold text-amber-600">{expiringProductIds.size}</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="text-xs text-gray-500">Réappro. récents</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{recentRestocks}</div>
        </div>
      </div>

      <InventoryTable products={products} suppliers={suppliers} batchInfo={batchInfo} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Derniers mouvements de stock</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Variation</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-900">
                    {typeof m.product === "object" && m.product ? m.product.name : "Produit supprimé"}
                  </td>
                  <td className={`px-4 py-3 font-medium ${m.delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {m.delta >= 0 ? "+" : ""}
                    {m.delta}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.previousStock} → {m.newStock}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{MOVEMENT_SOURCE_LABELS[m.source] || m.source}</td>
                  <td className="px-4 py-3 text-gray-500">{m.batchNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{supplierName(m.supplier) || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    Aucun mouvement de stock enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
