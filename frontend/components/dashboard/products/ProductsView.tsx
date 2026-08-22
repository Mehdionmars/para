"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import {
  bulkUpdateProducts,
  deleteProducts,
  exportProductsCsv,
  selectAllMatching,
  type BulkOperation,
} from "@/app/dashboard/(app)/products/actions";
import { AlertDialog } from "@/components/dashboard/ui/AlertDialog";
import { Button } from "@/components/dashboard/ui/Button";
import { useToast } from "@/components/dashboard/ui/Toast";
import { toSearchParams, type ProductQuery, type SortField } from "@/lib/dashboard/product-query";
import type { Brand, Product } from "@/lib/dashboard/products-types";
import {
  BulkPriceDialog,
  BulkPromotionDialog,
  BulkStatusDialog,
  BulkStockDialog,
  BulkTaxonomyDialog,
} from "./bulk/BulkDialogs";
import {
  getColumnsServerSnapshot,
  getColumnsSnapshot,
  resolveColumns,
  storeColumns,
  subscribeToColumns,
  type ColumnKey,
} from "./product-columns";
import { ProductBulkToolbar, type BulkAction } from "./ProductBulkToolbar";
import { ProductsTable, type RowAction } from "./ProductsTable";
import { ProductEmptyState, ProductsTableSkeleton } from "./ProductsTableStates";
import { ProductsToolbar } from "./ProductsToolbar";

type DialogKind = "stock" | "price" | "status" | "promotion" | "category" | "brand" | null;

/**
 * Orchestrates the products page.
 *
 * State is split deliberately:
 *  - the *query* (search, filters, sort, page) lives in the URL, so the
 *    server can fetch exactly one page and the view is shareable;
 *  - the *selection* lives here, because it spans pages and must survive a
 *    filter change no more than the operator expects;
 *  - the *column choice* lives in localStorage, because it is a personal
 *    preference, not part of what a shared link should carry.
 */
export function ProductsView({
  products,
  brands,
  query,
  totalDocs,
  totalPages,
  canEdit,
  canDelete,
  canCreate,
  hasAnyProduct,
}: {
  products: Product[];
  brands: Brand[];
  query: ProductQuery;
  totalDocs: number;
  totalPages: number;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  hasAnyProduct: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  // isPending covers every URL-driven refetch: search, filter, sort, page.
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * The selection, as id → the product row if we have it.
   *
   * A Map rather than a Set of ids because a selection spans pages: once the
   * operator moves to page 2, page 1's rows are gone from `products`, but the
   * bulk dialogs still need their current price and stock to show an honest
   * preview. "Tout sélectionner dans les résultats" stores null for rows that
   * were never loaded — those simply don't appear in the preview list.
   */
  const [selection, setSelection] = useState<Map<number, Product | null>>(new Map());
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);

  const selectedIds = useMemo(() => new Set(selection.keys()), [selection]);

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [dialogError, setDialogError] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    description: React.ReactNode;
    destructive?: boolean;
    run: () => Promise<void>;
  } | null>(null);

  // Read straight from localStorage through an external store, so the saved
  // choice is present on the first client render instead of flashing the
  // defaults for a frame.
  const storedColumns = useSyncExternalStore(
    subscribeToColumns,
    getColumnsSnapshot,
    getColumnsServerSnapshot,
  );
  const columns = useMemo(() => resolveColumns(storedColumns), [storedColumns]);
  const visibleColumns = useMemo(() => new Set(columns), [columns]);

  const selectedProducts = useMemo(() => {
    // Rows currently on screen are always the freshest copy of themselves.
    const onPage = new Map(products.map((p) => [p.id, p]));
    return [...selection.entries()]
      .map(([id, snapshot]) => onPage.get(id) ?? snapshot)
      .filter((p): p is Product => !!p);
  }, [selection, products]);

  /**
   * Newest updatedAt among the rows being acted on. Sent with every bulk
   * request so the server can reject the operation if any of those products
   * changed after the operator last saw them, instead of overwriting a
   * colleague's edit.
   */
  const seenAt = useMemo(() => {
    const stamps = selectedProducts.map((p) => p.updatedAt).filter(Boolean) as string[];
    return stamps.length > 0 ? stamps.sort().at(-1) : undefined;
  }, [selectedProducts]);

  const pushQuery = useCallback(
    (patch: Partial<ProductQuery>) => {
      const next = { ...query, ...patch };
      const params = toSearchParams(next);
      startTransition(() => {
        router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
      });
    },
    [query, pathname, router],
  );

  const clearSelection = useCallback(() => {
    setSelection(new Map());
    setAllMatchingSelected(false);
  }, []);

  function toggleRow(id: number, selected: boolean) {
    setSelection((prev) => {
      const next = new Map(prev);
      if (selected) next.set(id, products.find((p) => p.id === id) ?? null);
      else next.delete(id);
      return next;
    });
    setAllMatchingSelected(false);
  }

  /** The header checkbox — the bug this rewrite set out to fix. It now
   * genuinely adds or removes every row on the current page. */
  function toggleAll(selected: boolean) {
    setSelection((prev) => {
      const next = new Map(prev);
      for (const p of products) {
        if (selected) next.set(p.id, p);
        else next.delete(p.id);
      }
      return next;
    });
    setAllMatchingSelected(false);
  }

  async function handleSelectAllMatching() {
    setBusy(true);
    try {
      const ids = await selectAllMatching(query);
      const onPage = new Map(products.map((p) => [p.id, p]));
      setSelection(new Map(ids.map((id) => [id, onPage.get(id) ?? null])));
      setAllMatchingSelected(true);
      toast.success(`${ids.length} produits sélectionnés`, "Sur l'ensemble des résultats filtrés.");
    } catch {
      toast.error("Sélection impossible", "Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  function toggleColumn(key: ColumnKey) {
    storeColumns(columns.includes(key) ? columns.filter((k) => k !== key) : [...columns, key]);
  }

  function handleRefresh() {
    setRefreshing(true);
    startTransition(() => {
      router.refresh();
      // router.refresh() resolves through the transition; the toast fires on
      // the next tick so it doesn't precede the new data.
      setTimeout(() => {
        setRefreshing(false);
        toast.toast({ title: "Catalogue actualisé" });
      }, 400);
    });
  }

  async function handleExport(scope: "selection" | "results") {
    setExporting(true);
    try {
      const result = await exportProductsCsv({
        ids: scope === "selection" ? [...selectedIds] : undefined,
        query,
      });
      if (!result.ok) {
        toast.error("Export impossible", result.error);
        return;
      }
      // ﻿ so Excel in a French locale reads the accents correctly.
      const blob = new Blob([`﻿${result.csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `produits-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${result.count} produits exportés`);
    } finally {
      setExporting(false);
    }
  }

  /** Single funnel for every bulk mutation, so success/failure reporting,
   * the busy flag and selection clearing can never drift between actions. */
  const applyBulk = useCallback(
    async (ids: number[], operation: BulkOperation, successTitle: string) => {
      setBusy(true);
      setDialogError("");
      try {
        const result = await bulkUpdateProducts(ids, operation, seenAt);

        if (!result.ok) {
          setDialogError(result.error);
          toast.error(result.conflict ? "Modification concurrente" : "Opération échouée", result.error);
          return false;
        }

        const details = [
          `${result.updated} produit${result.updated > 1 ? "s" : ""} modifié${result.updated > 1 ? "s" : ""}.`,
          result.missing > 0 ? `${result.missing} introuvable(s).` : "",
        ]
          .filter(Boolean)
          .join(" ");

        toast.success(successTitle, details);
        setDialog(null);
        clearSelection();
        // Server-confirmed only: the list is refetched rather than patched
        // locally, so what is displayed is what the database actually holds.
        startTransition(() => router.refresh());
        return true;
      } finally {
        setBusy(false);
      }
    },
    [seenAt, toast, clearSelection, router],
  );

  function handleBulkAction(action: BulkAction) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    switch (action) {
      case "stock":
      case "price":
      case "status":
      case "promotion":
      case "category":
      case "brand":
        setDialogError("");
        setDialog(action);
        return;

      case "feature":
      case "unfeature": {
        const on = action === "feature";
        setConfirm({
          description: `${ids.length} produit(s) seront ${on ? "ajoutés à" : "retirés de"} la vitrine.`,
          run: async () => {
            await applyBulk(ids, { type: "featured", value: on }, on ? "Ajoutés à la vitrine" : "Retirés de la vitrine");
          },
          title: on ? "Ajouter à la vitrine ?" : "Retirer de la vitrine ?",
        });
        return;
      }

      case "delete":
        setConfirm({
          description: (
            <>
              Supprimer <strong>{ids.length} produit(s)</strong> ? Cette action est irréversible.
            </>
          ),
          destructive: true,
          run: async () => {
            setBusy(true);
            try {
              const result = await deleteProducts(ids);
              if (result.failed.length > 0) {
                toast.error(
                  `${result.deleted} supprimé(s), ${result.failed.length} échec(s)`,
                  result.failed[0]?.message,
                );
              } else {
                toast.success(`${result.deleted} produit(s) supprimé(s)`);
              }
              clearSelection();
              startTransition(() => router.refresh());
            } finally {
              setBusy(false);
            }
          },
          title: `Supprimer ${ids.length} produit(s) ?`,
        });
        return;
    }
  }

  function handleRowAction(action: RowAction, product: Product) {
    switch (action) {
      case "edit":
        router.push(`/dashboard/products/${product.id}`);
        return;
      case "view":
        window.open(`/produit/${product.slug}`, "_blank", "noopener");
        return;
      case "duplicate":
        // Opens the creation form pre-filled from this product rather than
        // silently creating a near-identical row the operator hasn't checked.
        router.push(`/dashboard/products/new?from=${product.id}`);
        return;

      case "stock":
      case "price":
        setSelection(new Map([[product.id, product]]));
        setAllMatchingSelected(false);
        setDialogError("");
        setDialog(action);
        return;

      case "publish":
      case "draft":
        setConfirm({
          description: `« ${product.name} » passera en ${action === "publish" ? "publié" : "brouillon"}.`,
          run: async () => {
            await applyBulk(
              [product.id],
              { type: "status", value: action === "publish" ? "published" : "draft" },
              action === "publish" ? "Produit publié" : "Produit mis en brouillon",
            );
          },
          title: action === "publish" ? "Publier ce produit ?" : "Mettre en brouillon ?",
        });
        return;

      case "feature":
      case "unfeature":
        setConfirm({
          description: `« ${product.name} » sera ${action === "feature" ? "ajouté à" : "retiré de"} la vitrine.`,
          run: async () => {
            await applyBulk(
              [product.id],
              { type: "featured", value: action === "feature" },
              action === "feature" ? "Ajouté à la vitrine" : "Retiré de la vitrine",
            );
          },
          title: action === "feature" ? "Ajouter à la vitrine ?" : "Retirer de la vitrine ?",
        });
        return;

      case "delete":
        setConfirm({
          description: (
            <>
              Supprimer <strong>« {product.name} »</strong> ? Cette action est irréversible.
            </>
          ),
          destructive: true,
          run: async () => {
            setBusy(true);
            try {
              const result = await deleteProducts([product.id]);
              if (result.failed.length > 0) toast.error("Suppression impossible", result.failed[0].message);
              else toast.success("Produit supprimé");
              clearSelection();
              startTransition(() => router.refresh());
            } finally {
              setBusy(false);
            }
          },
          title: "Supprimer ce produit ?",
        });
        return;
    }
  }

  function handleSort(field: SortField) {
    pushQuery({
      dir: query.sort === field && query.dir === "asc" ? "desc" : "asc",
      page: 1,
      sort: field,
    });
  }

  const firstRow = totalDocs === 0 ? 0 : (query.page - 1) * query.perPage + 1;
  const lastRow = Math.min(query.page * query.perPage, totalDocs);
  const isFiltered =
    !!query.search ||
    query.category !== "all" ||
    query.brand !== "all" ||
    query.status !== "all" ||
    query.stock !== "all" ||
    query.promo !== "all" ||
    query.featured ||
    !!query.minPrice ||
    !!query.maxPrice;

  const dialogProps = {
    busy,
    error: dialogError || undefined,
    onClose: () => setDialog(null),
    products: selectedProducts,
  };

  return (
    <div className="flex flex-col gap-4">
      <ProductsToolbar
        query={query}
        brands={brands}
        visibleColumns={visibleColumns}
        searching={isPending}
        refreshing={refreshing}
        exporting={exporting}
        selectedCount={selectedIds.size}
        onChange={pushQuery}
        onToggleColumn={toggleColumn}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      <ProductBulkToolbar
        count={selectedIds.size}
        totalMatching={totalDocs}
        allMatchingSelected={allMatchingSelected}
        canEdit={canEdit}
        canDelete={canDelete}
        busy={busy}
        onAction={handleBulkAction}
        onSelectAllMatching={handleSelectAllMatching}
        onClear={clearSelection}
      />

      {isPending ? (
        <ProductsTableSkeleton rows={Math.min(query.perPage, 10)} />
      ) : products.length === 0 ? (
        <ProductEmptyState
          filtered={isFiltered || hasAnyProduct}
          canCreate={canCreate}
          onReset={() =>
            pushQuery({
              brand: "all",
              category: "all",
              featured: false,
              maxPrice: "",
              minPrice: "",
              page: 1,
              promo: "all",
              search: "",
              status: "all",
              stock: "all",
            })
          }
        />
      ) : (
        <ProductsTable
          products={products}
          query={query}
          visibleColumns={visibleColumns}
          selectedIds={selectedIds}
          canEdit={canEdit}
          canDelete={canDelete}
          busy={busy}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          onSort={handleSort}
          onRowAction={handleRowAction}
        />
      )}

      {products.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500" aria-live="polite">
            {firstRow}–{lastRow} sur {totalDocs} produit{totalDocs > 1 ? "s" : ""}
          </p>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="hidden sm:inline">Par page</span>
              <select
                value={query.perPage}
                onChange={(e) => pushQuery({ page: 1, perPage: Number(e.target.value) })}
                aria-label="Produits par page"
                className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-violet-400"
              >
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <Button
              variant="outline"
              size="sm"
              disabled={query.page <= 1 || isPending}
              onClick={() => pushQuery({ page: query.page - 1 })}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="text-xs tabular-nums text-gray-600">
              {query.page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={query.page >= totalPages || isPending}
              onClick={() => pushQuery({ page: query.page + 1 })}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {dialog === "stock" && (
        <BulkStockDialog
          {...dialogProps}
          onApply={(op) => applyBulk([...selectedIds], op, "Stock mis à jour")}
        />
      )}
      {dialog === "price" && (
        <BulkPriceDialog {...dialogProps} onApply={(op) => applyBulk([...selectedIds], op, "Prix mis à jour")} />
      )}
      {dialog === "status" && (
        <BulkStatusDialog {...dialogProps} onApply={(op) => applyBulk([...selectedIds], op, "Statut mis à jour")} />
      )}
      {dialog === "promotion" && (
        <BulkPromotionDialog
          {...dialogProps}
          onApply={(op) => applyBulk([...selectedIds], op, "Promotion mise à jour")}
        />
      )}
      {(dialog === "category" || dialog === "brand") && (
        <BulkTaxonomyDialog
          {...dialogProps}
          kind={dialog}
          brands={brands}
          onApply={(op) =>
            applyBulk([...selectedIds], op, dialog === "category" ? "Catégorie mise à jour" : "Marque mise à jour")
          }
        />
      )}

      <AlertDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        destructive={confirm?.destructive}
        confirmLabel={confirm?.destructive ? "Supprimer" : "Confirmer"}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const action = confirm;
          if (!action) return;
          await action.run();
          setConfirm(null);
        }}
      />
    </div>
  );
}
