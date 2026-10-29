"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InventoryRow, Supplier } from "@/lib/dashboard/inventory";
import { railEligibility, stockStatus } from "@/lib/dashboard/products-types";
import { RestockModal } from "./RestockModal";

const STOCK_BADGE = {
  low: { label: "Stock faible", variant: "warning" as const },
  ok: { label: "En stock", variant: "success" as const },
  out: { label: "Rupture de stock", variant: "danger" as const },
};

const ELIGIBILITY_BADGE = {
  discontinued: { label: "Discontinué", variant: "outline" as const },
  draft: { label: "Brouillon", variant: "outline" as const },
  eligible: { label: "Éligible vitrine", variant: "success" as const },
  "out-of-stock": { label: "Rupture de stock", variant: "danger" as const },
};

export type ProductBatchInfo = { supplierName: string | null; nearestExpiry: string | null };

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

/**
 * One page of the stock table (the page itself loads and filters it).
 *
 * A restock updates its row at once from the answer, then refreshes the page
 * so the counters above follow. Below `md` each product is a stacked row with
 * its actions, where even five columns would scroll sideways.
 */
export function InventoryTable({
  rows,
  suppliers,
  batchInfo,
}: {
  rows: InventoryRow[];
  suppliers: Supplier[];
  batchInfo: Record<number, ProductBatchInfo>;
}) {
  const router = useRouter();
  const [restockTarget, setRestockTarget] = useState<{ id: number; name: string; stock: number } | null>(null);
  const [liveStock, setLiveStock] = useState<Record<number, number>>({});
  const [successMessage, setSuccessMessage] = useState("");

  function handleSuccess(productId: number, newStock: number, productName: string) {
    setLiveStock((prev) => ({ ...prev, [productId]: newStock }));
    setRestockTarget(null);
    setSuccessMessage(`${productName} réapprovisionné — nouveau stock : ${newStock}.`);
    router.refresh();
  }

  const view = rows.map((product) => {
    const stock = liveStock[product.id] ?? product.stock;
    const effective = { ...product, stock };
    return {
      eligibility: ELIGIBILITY_BADGE[railEligibility(effective)],
      info: batchInfo[product.id],
      product,
      status: STOCK_BADGE[stockStatus(effective)],
      stock,
    };
  });

  const actions = (product: InventoryRow, stock: number) => (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/dashboard/inventory/${product.id}/movements`}
        className="inline-flex min-h-8 items-center rounded-md px-2 text-xs font-medium text-primary hover:bg-accent hover:underline"
      >
        Historique
      </Link>
      <Button size="sm" onClick={() => setRestockTarget({ id: product.id, name: product.name, stock })}>
        Réapprovisionner
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {successMessage && (
        <p role="status" className="rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success-strong">
          {successMessage}
        </p>
      )}

      <div className="min-w-0 rounded-xl border border-border bg-card shadow-xs">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun produit ne correspond à ces filtres.</p>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {view.map(({ product, stock, status, info }) => (
                <li key={product.id} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[product.brand, product.sku].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex flex-none flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums text-foreground">{stock}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                  {(info?.supplierName || info?.nearestExpiry) && (
                    <p className="text-xs text-muted-foreground">
                      {[info.supplierName, info.nearestExpiry ? `expire le ${date(info.nearestExpiry)}` : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {actions(product, stock)}
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                {/* Five columns, not nine: the brand, SKU, supplier and
                    nearest expiry read as the product's second and third
                    lines, the threshold under the stock. At nine the product
                    name wrapped to five lines and the restock button left the
                    frame on a laptop. */}
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-4 py-3">Produit</th>
                    <th scope="col" className="px-4 py-3 text-right">Stock</th>
                    <th scope="col" className="px-4 py-3">Statut</th>
                    <th scope="col" className="px-4 py-3">Éligibilité vitrine</th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {view.map(({ product, stock, status, eligibility, info }) => (
                    <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="min-w-[16rem] px-4 py-3">
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[product.brand, product.sku ? `SKU ${product.sku}` : null].filter(Boolean).join(" · ") || "—"}
                        </div>
                        {(info?.supplierName || info?.nearestExpiry) && (
                          <div className="text-xs text-muted-foreground">
                            {[info.supplierName, info.nearestExpiry ? `expire le ${date(info.nearestExpiry)}` : null].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-medium tabular-nums text-foreground">{stock}</div>
                        <div className="text-xs tabular-nums text-muted-foreground">seuil {product.lowStockThreshold}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={eligibility.variant}>{eligibility.label}</Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{actions(product, stock)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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
