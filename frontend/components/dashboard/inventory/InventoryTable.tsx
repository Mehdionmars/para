"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/dashboard/ui/Badge";
import { Button } from "@/components/dashboard/ui/Button";
import type { Supplier } from "@/lib/dashboard/inventory";
import { railEligibility, stockStatus, type Product } from "@/lib/dashboard/products-types";
import { RestockModal } from "./RestockModal";

const STOCK_BADGE = {
  ok: { label: "En stock", variant: "success" as const },
  low: { label: "Stock faible", variant: "warning" as const },
  out: { label: "Rupture de stock", variant: "danger" as const },
};

const ELIGIBILITY_BADGE = {
  discontinued: { label: "Discontinué", variant: "default" as const },
  draft: { label: "Brouillon", variant: "default" as const },
  eligible: { label: "Éligible vitrine", variant: "success" as const },
  "out-of-stock": { label: "Rupture de stock", variant: "danger" as const },
};

export type ProductBatchInfo = { supplierName: string | null; nearestExpiry: string | null };

export function InventoryTable({
  products,
  suppliers,
  batchInfo,
}: {
  products: Product[];
  suppliers: Supplier[];
  batchInfo: Record<number, ProductBatchInfo>;
}) {
  const router = useRouter();
  const [restockTarget, setRestockTarget] = useState<{ id: number; name: string; stock: number } | null>(null);
  const [liveStock, setLiveStock] = useState<Record<number, number>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const sorted = [...products].sort((a, b) => (liveStock[a.id] ?? a.stock) - (liveStock[b.id] ?? b.stock));

  function handleSuccess(productId: number, newStock: number, productName: string) {
    setLiveStock((prev) => ({ ...prev, [productId]: newStock }));
    setRestockTarget(null);
    setSuccessMessage(`${productName} réapprovisionné — nouveau stock : ${newStock}.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {successMessage && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{successMessage}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Seuil faible</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Expiration</th>
              <th className="px-4 py-3">Éligibilité vitrine</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((product) => {
              const stock = liveStock[product.id] ?? product.stock;
              const effectiveProduct = { ...product, stock };
              const status = STOCK_BADGE[stockStatus(effectiveProduct)];
              const eligibility = ELIGIBILITY_BADGE[railEligibility(effectiveProduct)];
              const brand = typeof product.brand === "object" ? product.brand.name : "";
              const info = batchInfo[product.id];
              return (
                <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{brand}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{product.sku || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{stock}</td>
                  <td className="px-4 py-3 text-gray-500">{product.lowStockThreshold}</td>
                  <td className="px-4 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{info?.supplierName || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {info?.nearestExpiry ? new Date(info.nearestExpiry).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={eligibility.variant}>{eligibility.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/inventory/${product.id}/movements`} className="text-xs font-medium text-violet-700 hover:underline">
                        Historique
                      </Link>
                      <Button size="sm" onClick={() => setRestockTarget({ id: product.id, name: product.name, stock })}>
                        Réapprovisionner
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {restockTarget && (
        <RestockModal
          product={restockTarget}
          suppliers={suppliers}
          onClose={() => setRestockTarget(null)}
          onSuccess={({ newStock }) => handleSuccess(restockTarget.id, newStock, restockTarget.name)}
        />
      )}
    </div>
  );
}
