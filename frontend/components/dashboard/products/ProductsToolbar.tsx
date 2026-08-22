"use client";

import { Columns3, Download, Loader2, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/dashboard/ui/Button";
import { Checkbox } from "@/components/dashboard/ui/Checkbox";
import { Popover } from "@/components/dashboard/ui/Popover";
import { Tooltip } from "@/components/dashboard/ui/Tooltip";
import {
  countActiveFilters,
  type ProductQuery,
  PAGE_SIZES,
  type PromoFilter,
  type StatusFilter,
  type StockFilter,
} from "@/lib/dashboard/product-query";
import { CATEGORY_OPTIONS, type Brand } from "@/lib/dashboard/products-types";
import type { ColumnKey } from "./product-columns";
import { COLUMN_LABELS, TOGGLEABLE_COLUMNS } from "./product-columns";

const SELECT_CLASS =
  "h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export function ProductsToolbar({
  query,
  brands,
  visibleColumns,
  searching,
  refreshing,
  exporting,
  selectedCount,
  onChange,
  onToggleColumn,
  onRefresh,
  onExport,
}: {
  query: ProductQuery;
  brands: Brand[];
  visibleColumns: Set<ColumnKey>;
  searching: boolean;
  refreshing: boolean;
  exporting: boolean;
  selectedCount: number;
  onChange: (patch: Partial<ProductQuery>) => void;
  onToggleColumn: (key: ColumnKey) => void;
  onRefresh: () => void;
  onExport: (scope: "selection" | "results") => void;
}) {
  const activeFilters = countActiveFilters(query);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={query.search} searching={searching} onChange={(search) => onChange({ page: 1, search })} />

        {/* The three filters used constantly stay inline on desktop; the rest
            live in the panel so the toolbar never wraps into three rows. */}
        <select
          aria-label="Filtrer par catégorie"
          value={query.category}
          onChange={(e) => onChange({ category: e.target.value, page: 1 })}
          className={`${SELECT_CLASS} hidden lg:block`}
        >
          <option value="all">Toutes catégories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrer par statut"
          value={query.status}
          onChange={(e) => onChange({ page: 1, status: e.target.value as StatusFilter })}
          className={`${SELECT_CLASS} hidden lg:block`}
        >
          <option value="all">Tous statuts</option>
          <option value="published">Publié</option>
          <option value="draft">Brouillon</option>
          <option value="archived">Archivé</option>
        </select>

        <select
          aria-label="Filtrer par stock"
          value={query.stock}
          onChange={(e) => onChange({ page: 1, stock: e.target.value as StockFilter })}
          className={`${SELECT_CLASS} hidden lg:block`}
        >
          <option value="all">Tout stock</option>
          <option value="in-stock">En stock</option>
          <option value="low">Stock faible</option>
          <option value="out">Rupture</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <FiltersPanel query={query} brands={brands} activeCount={activeFilters} onChange={onChange} />

          <Popover
            label="Colonnes affichées"
            trigger={({ toggle, ...aria }) => (
              <Tooltip label="Colonnes">
                <Button variant="outline" size="sm" onClick={toggle} aria-label="Colonnes" {...aria}>
                  <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only md:not-sr-only">Colonnes</span>
                </Button>
              </Tooltip>
            )}
          >
            <div className="p-1">
              {TOGGLEABLE_COLUMNS.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Checkbox checked={visibleColumns.has(key)} onChange={() => onToggleColumn(key)} />
                  {COLUMN_LABELS[key]}
                </label>
              ))}
            </div>
          </Popover>

          <Tooltip label="Rafraîchir">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} aria-label="Rafraîchir">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            </Button>
          </Tooltip>

          <Popover
            label="Exporter"
            trigger={({ toggle, ...aria }) => (
              <Tooltip label="Exporter">
                <Button variant="outline" size="sm" onClick={toggle} disabled={exporting} aria-label="Exporter" {...aria}>
                  {exporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Button>
              </Tooltip>
            )}
          >
            {(close) => (
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { close(); onExport("results"); }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Exporter les résultats filtrés
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={selectedCount === 0}
                  onClick={() => { close(); onExport("selection"); }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
                >
                  Exporter la sélection ({selectedCount})
                </button>
              </div>
            )}
          </Popover>
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {activeFilters} filtre{activeFilters > 1 ? "s" : ""} actif{activeFilters > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() =>
              onChange({
                brand: "all",
                category: "all",
                featured: false,
                maxPrice: "",
                minPrice: "",
                page: 1,
                promo: "all",
                status: "all",
                stock: "all",
              })
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Debounced search.
 *
 * The input is uncontrolled between keystrokes so typing stays instant, and
 * only the settled value is pushed upward after 300 ms — one request per
 * pause instead of one per character. The external value is mirrored back in
 * when it changes for another reason (browser back button, filter reset).
 */
function SearchField({
  value,
  searching,
  onChange,
}: {
  value: string;
  searching: boolean;
  onChange: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const lastPushed = useRef(value);

  useEffect(() => {
    if (value !== lastPushed.current) {
      lastPushed.current = value;
      setLocal(value);
    }
  }, [value]);

  useEffect(() => {
    if (local === lastPushed.current) return;
    const timer = setTimeout(() => {
      lastPushed.current = local;
      onChange(local);
    }, 300);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Nom, SKU, code-barres, marque…"
        aria-label="Rechercher un produit"
        className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
      {searching && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-500" aria-hidden="true" />
      )}
    </div>
  );
}

function FiltersPanel({
  query,
  brands,
  activeCount,
  onChange,
}: {
  query: ProductQuery;
  brands: Brand[];
  activeCount: number;
  onChange: (patch: Partial<ProductQuery>) => void;
}) {
  return (
    <Popover
      label="Filtres avancés"
      panelClassName="w-80 p-3"
      trigger={({ toggle, ...aria }) => (
        <Button variant="outline" size="sm" onClick={toggle} {...aria}>
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filtres
          {activeCount > 0 && (
            <span className="ml-0.5 rounded-full bg-violet-700 px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      )}
    >
      <div className="flex flex-col gap-3">
        <Field label="Catégorie">
          <select
            value={query.category}
            onChange={(e) => onChange({ category: e.target.value, page: 1 })}
            className={`${SELECT_CLASS} w-full`}
          >
            <option value="all">Toutes</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Marque">
          <select
            value={query.brand}
            onChange={(e) => onChange({ brand: e.target.value, page: 1 })}
            className={`${SELECT_CLASS} w-full`}
          >
            <option value="all">Toutes</option>
            {brands.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Statut">
            <select
              value={query.status}
              onChange={(e) => onChange({ page: 1, status: e.target.value as StatusFilter })}
              className={`${SELECT_CLASS} w-full`}
            >
              <option value="all">Tous</option>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </select>
          </Field>

          <Field label="Stock">
            <select
              value={query.stock}
              onChange={(e) => onChange({ page: 1, stock: e.target.value as StockFilter })}
              className={`${SELECT_CLASS} w-full`}
            >
              <option value="all">Tous</option>
              <option value="in-stock">En stock</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture</option>
            </select>
          </Field>
        </div>

        <Field label="Promotion">
          <select
            value={query.promo}
            onChange={(e) => onChange({ page: 1, promo: e.target.value as PromoFilter })}
            className={`${SELECT_CLASS} w-full`}
          >
            <option value="all">Toutes</option>
            <option value="on-sale">En promotion</option>
            <option value="no-sale">Sans promotion</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Prix min.">
            <input
              type="number"
              min={0}
              value={query.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value, page: 1 })}
              placeholder="0"
              className={`${SELECT_CLASS} w-full`}
            />
          </Field>
          <Field label="Prix max.">
            <input
              type="number"
              min={0}
              value={query.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value, page: 1 })}
              placeholder="—"
              className={`${SELECT_CLASS} w-full`}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-gray-700">
          <Checkbox checked={query.featured} onChange={(e) => onChange({ featured: e.target.checked, page: 1 })} />
          Uniquement les produits en vitrine
        </label>

        <Field label="Produits par page">
          <select
            value={query.perPage}
            onChange={(e) => onChange({ page: 1, perPage: Number(e.target.value) })}
            className={`${SELECT_CLASS} w-full`}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Popover>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
