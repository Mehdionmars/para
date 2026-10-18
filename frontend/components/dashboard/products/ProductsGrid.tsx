"use client";

import Link from "next/link";
import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { Checkbox } from "@/components/dashboard/ui/Checkbox";
import { Badge } from "@/components/ui/badge";
import { stockStatus, type Product } from "@/lib/dashboard/products-types";
import { brandName, imageUrl, money, type RowAction, RowActions, STOCK_BADGE, statusBadge, Thumbnail } from "./ProductsTable";

type ViewProps = {
  products: Product[];
  selectedIds: Set<number>;
  canEdit: boolean;
  canDelete: boolean;
  busy: boolean;
  onToggleRow: (id: number, selected: boolean) => void;
  onRowAction: (action: RowAction, product: Product) => void;
};

function Price({ product }: { product: Product }) {
  const promo = product.oldPrice && product.oldPrice > product.price;
  return (
    <span className="flex items-baseline gap-1.5 tabular-nums">
      <span className={`font-semibold ${promo ? "text-destructive-strong" : "text-foreground"}`}>{money(product.price)}</span>
      {promo && <s className="text-xs text-muted-foreground">{money(product.oldPrice!)}</s>}
    </span>
  );
}

/**
 * The catalogue as cards: the photograph first, for an operator who finds a
 * product by its packaging rather than its name. Same page, filters,
 * selection and actions as the table.
 */
export function ProductsGrid({ products, selectedIds, canEdit, canDelete, busy, onToggleRow, onRowAction }: ViewProps) {
  const selectable = canEdit || canDelete;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => {
        const selected = selectedIds.has(p.id);
        const stock = STOCK_BADGE[stockStatus(p)];
        const status = statusBadge(p);
        return (
          <li
            key={p.id}
            className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md ${
              selected ? "border-primary ring-2 ring-primary/30" : "border-border"
            }`}
          >
            <Link href={`/dashboard/products/${p.id}`} className="relative block aspect-square bg-muted" aria-label={`Modifier ${p.name}`}>
              <CloudinaryImage
                src={imageUrl(p)}
                alt=""
                preset="thumb"
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                fallbackSrc={PRODUCT_PLACEHOLDER}
              />
            </Link>
            {selectable && (
              <div className="absolute top-2 left-2 rounded-md bg-card/90 p-1 shadow-sm">
                <Checkbox checked={selected} onChange={(e) => onToggleRow(p.id, e.target.checked)} aria-label={`Sélectionner ${p.name}`} />
              </div>
            )}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              <Badge variant={stock.variant}>{stock.label}</Badge>
              {status.label !== "Publié" && <Badge variant={status.variant}>{status.label}</Badge>}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-3">
              {brandName(p) && <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{brandName(p)}</p>}
              <Link href={`/dashboard/products/${p.id}`} className="line-clamp-2 text-sm font-medium text-foreground hover:underline">
                {p.name}
              </Link>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <div className="flex flex-col">
                  <Price product={p} />
                  <span className="text-xs text-muted-foreground tabular-nums">{p.stock} en stock</span>
                </div>
                <RowActions product={p} canEdit={canEdit} canDelete={canDelete} busy={busy} onRowAction={onRowAction} compact />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const LANES = [
  { key: "out", label: "Rupture", hint: "à réapprovisionner d'abord", tone: "border-t-destructive" },
  { key: "low", label: "Stock faible", hint: "sous le seuil d'alerte", tone: "border-t-warning" },
  { key: "ok", label: "En stock", hint: "au-dessus du seuil", tone: "border-t-success" },
] as const;

/**
 * The page's products sorted by stock state, one column each — what to
 * reorder first reads from left to right. Covers the products on this page,
 * which the count in each header says; the stock filter narrows it to one
 * state across the whole catalogue.
 */
export function ProductsStockBoard({ products, selectedIds, canEdit, canDelete, busy, onToggleRow, onRowAction }: ViewProps) {
  const selectable = canEdit || canDelete;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {LANES.map((lane) => {
        const items = products.filter((p) => stockStatus(p) === lane.key).sort((a, b) => a.stock - b.stock);
        return (
          <section key={lane.key} className={`flex min-w-0 flex-col rounded-xl border border-t-4 border-border bg-muted/30 ${lane.tone}`}>
            <header className="flex items-baseline justify-between gap-2 px-4 pt-3 pb-2">
              <h2 className="text-sm font-semibold text-foreground">
                {lane.label} <span className="font-normal text-muted-foreground tabular-nums">· {items.length}</span>
              </h2>
              <span className="text-xs text-muted-foreground">{lane.hint}</span>
            </header>
            {items.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">Aucun produit sur cette page.</p>
            ) : (
              <ul className="flex flex-col gap-2 px-2 pb-2">
                {items.map((p) => {
                  const selected = selectedIds.has(p.id);
                  return (
                    <li
                      key={p.id}
                      className={`flex items-center gap-3 rounded-lg border bg-card p-2 shadow-xs ${selected ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
                    >
                      {selectable && (
                        <Checkbox checked={selected} onChange={(e) => onToggleRow(p.id, e.target.checked)} aria-label={`Sélectionner ${p.name}`} />
                      )}
                      <Thumbnail product={p} size={44} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/dashboard/products/${p.id}`} className="block truncate text-sm font-medium text-foreground hover:underline">
                          {p.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground tabular-nums">{p.stock}</span> en stock · seuil {p.lowStockThreshold}
                          {brandName(p) && ` · ${brandName(p)}`}
                        </p>
                      </div>
                      <RowActions product={p} canEdit={canEdit} canDelete={canDelete} busy={busy} onRowAction={onRowAction} compact />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
