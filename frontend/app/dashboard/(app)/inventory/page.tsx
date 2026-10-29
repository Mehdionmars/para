import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { InventoryTable, type ProductBatchInfo } from "@/components/dashboard/inventory/InventoryTable";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/dashboard/guard";
import {
  INVENTORY_FILTERS,
  INVENTORY_PAGE_SIZE,
  inventoryCounts,
  listBatchesFor,
  listExpiringBatches,
  listInventoryPage,
  listRecentStockMovements,
  listSuppliers,
  type InventoryBatch,
  type InventoryFilter,
} from "@/lib/dashboard/inventory";
import { hasRole } from "@/lib/dashboard/roles";
import { cn } from "@/lib/utils";

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
function buildBatchInfo(batches: InventoryBatch[]): Record<number, ProductBatchInfo> {
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

const FILTER_LABELS: Record<InventoryFilter, string> = {
  all: "Tous",
  low: "Stock faible",
  ok: "En stock",
  out: "Rupture",
};

/** A tile that also filters the table, so "37 en rupture" is one click from
 * the 37 products. */
function Tile({ label, value, tone, href, active }: { label: string; value: string; tone?: string; href?: string; active?: boolean }) {
  const body = (
    <>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tabular-nums", tone ?? "text-foreground")}>{value}</div>
    </>
  );
  const cls = cn("block rounded-xl border bg-card p-4 shadow-xs", active ? "border-primary/40 ring-1 ring-primary/20" : "border-border");
  return href ? (
    <Link href={href} aria-current={active ? "true" : undefined} className={cn(cls, "transition-colors hover:border-primary/30 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function InventoryPage({ searchParams }: PageProps<"/dashboard/inventory">) {
  await requireRole((user) => hasRole(user, "admin", "manager", "stockManager"));
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const filter: InventoryFilter = (INVENTORY_FILTERS as readonly string[]).includes(String(params.status)) ? (params.status as InventoryFilter) : "all";
  const pageNumber = Math.max(1, Number(params.page) || 1);

  const [inventory, counts, movements, suppliers, expiringBatches] = await Promise.all([
    listInventoryPage({ filter, page: pageNumber, search }),
    inventoryCounts(),
    listRecentStockMovements(20),
    listSuppliers(),
    listExpiringBatches(60),
  ]);
  // Only the batches of the products on screen.
  const batchInfo = buildBatchInfo(await listBatchesFor(inventory.rows.map((r) => r.id)));

  const recentRestocks = movements.filter((m) => m.source === "restock").length;
  const expiringProductIds = new Set(
    expiringBatches.map((b) => (typeof b.product === "object" ? b.product?.id : b.product)).filter(Boolean),
  );

  const href = (next: { status?: InventoryFilter; page?: number; q?: string }) => {
    const p = new URLSearchParams();
    const q = next.q ?? search;
    const status = next.status ?? filter;
    if (q) p.set("q", q);
    if (status !== "all") p.set("status", status);
    if ((next.page ?? 1) > 1) p.set("page", String(next.page));
    const s = p.toString();
    return `/dashboard/inventory${s ? `?${s}` : ""}`;
  };
  const show = (n: number | undefined) => (n === undefined ? "—" : n.toLocaleString("fr-FR"));
  const from = (inventory.page - 1) * INVENTORY_PAGE_SIZE + 1;
  const to = from + inventory.rows.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventaire" description="Niveaux de stock par produit, réapprovisionnement traçable et éligibilité aux rails de la page d'accueil." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <Tile label="Produits" value={show(counts?.total)} href={href({ page: 1, status: "all" })} active={filter === "all"} />
        <Tile label="Stock faible" value={show(counts?.low)} tone="text-warning-strong" href={href({ page: 1, status: "low" })} active={filter === "low"} />
        <Tile label="Rupture" value={show(counts?.out)} tone="text-destructive-strong" href={href({ page: 1, status: "out" })} active={filter === "out"} />
        <Tile label="Expiration proche (60j)" value={show(expiringProductIds.size)} tone="text-warning-strong" />
        <Tile label="Réappro. récents" value={show(recentRestocks)} />
      </div>

      <section aria-label="Stock par produit" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* A plain GET form: the search lives in the URL, works without
              JavaScript, and survives a reload or a shared link. */}
          <form action="/dashboard/inventory" className="relative w-full sm:max-w-xs" role="search">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Nom ou SKU…"
              aria-label="Rechercher dans l'inventaire"
              className="h-10 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:h-9"
            />
            {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          </form>
          <nav aria-label="Filtrer par statut" className="scrollbar-none relative -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {INVENTORY_FILTERS.map((f) => (
              <Link
                key={f}
                href={href({ page: 1, status: f })}
                aria-current={filter === f ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 flex-none items-center rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
                  filter === f ? "border-primary/40 bg-primary/10 font-medium text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {FILTER_LABELS[f]}
              </Link>
            ))}
          </nav>
        </div>

        <InventoryTable rows={inventory.rows} suppliers={suppliers} batchInfo={batchInfo} />

        {inventory.totalDocs > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span aria-live="polite">
              {from.toLocaleString("fr-FR")}–{to.toLocaleString("fr-FR")} sur {inventory.totalDocs.toLocaleString("fr-FR")} produit
              {inventory.totalDocs > 1 ? "s" : ""}, stock le plus bas en premier
            </span>
            {inventory.totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center gap-1">
                {inventory.page > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={href({ page: inventory.page - 1 })} rel="prev">
                      <ChevronLeft aria-hidden="true" />
                      Précédent
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft aria-hidden="true" />
                    Précédent
                  </Button>
                )}
                <span className="px-2 tabular-nums">
                  {inventory.page} / {inventory.totalPages}
                </span>
                {inventory.page < inventory.totalPages ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={href({ page: inventory.page + 1 })} rel="next">
                      Suivant
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Suivant
                    <ChevronRight aria-hidden="true" />
                  </Button>
                )}
              </nav>
            )}
          </div>
        )}
      </section>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Derniers mouvements de stock</h2>
        <div className="relative overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
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
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">
                    {typeof m.product === "object" && m.product ? m.product.name : "Produit supprimé"}
                  </td>
                  <td className={`px-4 py-3 font-medium ${m.delta >= 0 ? "text-success-strong" : "text-destructive"}`}>
                    {m.delta >= 0 ? "+" : ""}
                    {m.delta}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.previousStock} → {m.newStock}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{MOVEMENT_SOURCE_LABELS[m.source] || m.source}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.batchNumber || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{supplierName(m.supplier) || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
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
