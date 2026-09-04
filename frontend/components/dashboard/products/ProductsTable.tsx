"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Star,
  StarOff,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { Badge } from "@/components/dashboard/ui/Badge";
import { Button, buttonVariants } from "@/components/dashboard/ui/Button";
import { Checkbox } from "@/components/dashboard/ui/Checkbox";
import { MenuItem, MenuSeparator, Popover } from "@/components/dashboard/ui/Popover";
import { Tooltip } from "@/components/dashboard/ui/Tooltip";
import type { ProductQuery, SortField } from "@/lib/dashboard/product-query";
import { railEligibility, stockStatus, type Product } from "@/lib/dashboard/products-types";
import { COLUMN_LABELS, COLUMN_SORT, type ColumnKey } from "./product-columns";
import { mediaSrc } from "@/lib/mediaSrc";

export type RowAction =
  | "edit"
  | "view"
  | "duplicate"
  | "stock"
  | "price"
  | "publish"
  | "draft"
  | "feature"
  | "unfeature"
  | "delete";

const money = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

const STOCK_BADGE = {
  low: { label: "Faible", variant: "warning" as const },
  ok: { label: "En stock", variant: "success" as const },
  out: { label: "Rupture", variant: "danger" as const },
};

const SHOWCASE_BADGE = {
  discontinued: { label: "Archivé", variant: "default" as const },
  draft: { label: "Brouillon", variant: "default" as const },
  eligible: { label: "Éligible", variant: "success" as const },
  "out-of-stock": { label: "Rupture", variant: "danger" as const },
};

function brandName(p: Product): string {
  return typeof p.brand === "object" && p.brand ? p.brand.name : "";
}

function imageUrl(p: Product): string | null {
  // Payload reports a relative URL; handing it straight to next/image made
  // it resolve against the dashboard, where no such route exists (400).
  return typeof p.image === "object" && p.image?.url ? mediaSrc(p.image.url) : null;
}

function statusBadge(p: Product) {
  if (p.discontinued) return { label: "Archivé", variant: "default" as const };
  return p.isPublished
    ? { label: "Publié", variant: "info" as const }
    : { label: "Brouillon", variant: "default" as const };
}

/**
 * The catalogue table.
 *
 * Two presentations of the same data, chosen by CSS at the `md` breakpoint:
 * a real <table> on desktop, and a list of cards on mobile. A single table
 * with horizontal scroll was the alternative and it is a poor one — nine
 * columns on a 375px screen means the operator scrolls sideways to find the
 * price of a row whose name has already scrolled out of view.
 *
 * Rows are deliberately compact (~64px): the job here is scanning 50 products
 * at a glance, not admiring any one of them.
 */
export function ProductsTable({
  products,
  query,
  visibleColumns,
  selectedIds,
  canEdit,
  canDelete,
  busy,
  onToggleRow,
  onToggleAll,
  onSort,
  onRowAction,
}: {
  products: Product[];
  query: ProductQuery;
  visibleColumns: Set<ColumnKey>;
  selectedIds: Set<number>;
  canEdit: boolean;
  canDelete: boolean;
  busy: boolean;
  onToggleRow: (id: number, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onSort: (field: SortField) => void;
  onRowAction: (action: RowAction, product: Product) => void;
}) {
  const selectable = canEdit || canDelete;
  const pageIds = products.map((p) => p.id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

  const show = (key: ColumnKey) => visibleColumns.has(key);

  return (
    <>
      {/* ------------------------------------------------ desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white md:block">
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">Catalogue produits, triable et sélectionnable</caption>
          <colgroup>
            {selectable && <col style={{ width: 44 }} />}
            {show("image") && <col style={{ width: 60 }} />}
            <col />
            {show("brand") && <col style={{ width: 130 }} />}
            {show("category") && <col style={{ width: 130 }} />}
            {show("sku") && <col style={{ width: 110 }} />}
            {show("barcode") && <col style={{ width: 130 }} />}
            {show("price") && <col style={{ width: 120 }} />}
            {show("oldPrice") && <col style={{ width: 110 }} />}
            {show("stock") && <col style={{ width: 140 }} />}
            {show("status") && <col style={{ width: 110 }} />}
            {show("showcase") && <col style={{ width: 110 }} />}
            {show("updatedAt") && <col style={{ width: 120 }} />}
            <col style={{ width: 108 }} />
          </colgroup>

          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {selectable && (
                <th scope="col" className="px-4 py-2.5">
                  <Checkbox
                    checked={allOnPageSelected}
                    indeterminate={someOnPageSelected}
                    onChange={(e) => onToggleAll(e.target.checked)}
                    aria-label={
                      allOnPageSelected ? "Désélectionner tous les produits de la page" : "Sélectionner tous les produits de la page"
                    }
                    disabled={products.length === 0 || busy}
                  />
                </th>
              )}
              {show("image") && <th scope="col" className="px-2 py-2.5 text-left text-xs font-medium text-gray-500">Img</th>}
              <HeaderCell column="name" query={query} onSort={onSort} />
              {show("brand") && <HeaderCell column="brand" query={query} onSort={onSort} />}
              {show("category") && <HeaderCell column="category" query={query} onSort={onSort} />}
              {show("sku") && <HeaderCell column="sku" query={query} onSort={onSort} />}
              {show("barcode") && <HeaderCell column="barcode" query={query} onSort={onSort} />}
              {show("price") && <HeaderCell column="price" query={query} onSort={onSort} />}
              {show("oldPrice") && <HeaderCell column="oldPrice" query={query} onSort={onSort} />}
              {show("stock") && <HeaderCell column="stock" query={query} onSort={onSort} />}
              {show("status") && <HeaderCell column="status" query={query} onSort={onSort} />}
              {show("showcase") && <HeaderCell column="showcase" query={query} onSort={onSort} />}
              {show("updatedAt") && <HeaderCell column="updatedAt" query={query} onSort={onSort} />}
              <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => {
              const selected = selectedIds.has(p.id);
              const stock = STOCK_BADGE[stockStatus(p)];
              const status = statusBadge(p);
              const showcase = SHOWCASE_BADGE[railEligibility(p)];

              return (
                <tr
                  key={p.id}
                  className={`border-b border-gray-50 last:border-0 ${selected ? "bg-violet-50/50" : "hover:bg-gray-50/60"}`}
                >
                  {selectable && (
                    <td className="px-4 py-2">
                      <Checkbox
                        checked={selected}
                        onChange={(e) => onToggleRow(p.id, e.target.checked)}
                        aria-label={`Sélectionner ${p.name}`}
                        disabled={busy}
                      />
                    </td>
                  )}

                  {show("image") && (
                    <td className="px-2 py-2">
                      <Thumbnail product={p} size={44} />
                    </td>
                  )}

                  <td className="px-3 py-2">
                    <div className="min-w-0">
                      {/* title= gives the full name on hover without a
                          JS tooltip on every one of 50 rows. */}
                      <div className="truncate text-sm font-medium text-gray-900" title={p.name}>
                        {p.name}
                      </div>
                      {!show("brand") && brandName(p) && (
                        <div className="truncate text-xs text-gray-500">{brandName(p)}</div>
                      )}
                    </div>
                  </td>

                  {show("brand") && (
                    <td className="truncate px-3 py-2 text-gray-600" title={brandName(p)}>
                      {brandName(p) || "—"}
                    </td>
                  )}
                  {show("category") && <td className="truncate px-3 py-2 text-gray-600">{p.category}</td>}
                  {show("sku") && <td className="truncate px-3 py-2 text-xs text-gray-500">{p.sku || "—"}</td>}
                  {show("barcode") && <td className="truncate px-3 py-2 text-xs text-gray-500">{p.barcode || "—"}</td>}

                  {show("price") && (
                    <td className="px-3 py-2">
                      <span className="font-medium text-gray-900">{money(p.price)}</span>
                      {!show("oldPrice") && !!p.oldPrice && (
                        <span className="ml-1.5 text-xs text-gray-400 line-through">{money(p.oldPrice)}</span>
                      )}
                    </td>
                  )}
                  {show("oldPrice") && (
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {p.oldPrice ? <span className="line-through">{money(p.oldPrice)}</span> : "—"}
                    </td>
                  )}

                  {show("stock") && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums text-gray-700">{p.stock}</span>
                        <Badge variant={stock.variant}>{stock.label}</Badge>
                      </div>
                    </td>
                  )}
                  {show("status") && (
                    <td className="px-3 py-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  )}
                  {show("showcase") && (
                    <td className="px-3 py-2">
                      <Badge variant={showcase.variant}>{showcase.label}</Badge>
                    </td>
                  )}
                  {show("updatedAt") && (
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  )}

                  <td className="px-4 py-2">
                    <RowActions
                      product={p}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      busy={busy}
                      onRowAction={onRowAction}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --------------------------------------------------- mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {selectable && products.length > 0 && (
          <li className="flex items-center gap-2.5 px-1 pb-1">
            <Checkbox
              checked={allOnPageSelected}
              indeterminate={someOnPageSelected}
              onChange={(e) => onToggleAll(e.target.checked)}
              aria-label="Sélectionner tous les produits de la page"
              disabled={busy}
            />
            <span className="text-xs text-gray-500">Tout sélectionner sur cette page</span>
          </li>
        )}

        {products.map((p) => {
          const selected = selectedIds.has(p.id);
          const stock = STOCK_BADGE[stockStatus(p)];
          const status = statusBadge(p);

          return (
            <li
              key={p.id}
              className={`flex gap-3 rounded-xl border p-3 ${
                selected ? "border-violet-300 bg-violet-50/60" : "border-gray-100 bg-white"
              }`}
            >
              {selectable && (
                <Checkbox
                  checked={selected}
                  onChange={(e) => onToggleRow(p.id, e.target.checked)}
                  aria-label={`Sélectionner ${p.name}`}
                  disabled={busy}
                  className="mt-1"
                />
              )}

              <Thumbnail product={p} size={44} />

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{p.name}</p>
                {brandName(p) && <p className="mt-0.5 text-xs text-gray-500">{brandName(p)}</p>}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="font-medium text-gray-900">{money(p.price)}</span>
                  <span className="text-gray-500">Stock : {p.stock}</span>
                  <Badge variant={stock.variant}>{stock.label}</Badge>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>

              <RowActions
                product={p}
                canEdit={canEdit}
                canDelete={canDelete}
                busy={busy}
                onRowAction={onRowAction}
                compact
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Thumbnail({ product, size }: { product: Product; size: number }) {
  const url = imageUrl(product);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg bg-gray-100"
      style={{ height: size, width: size }}
    >
      {/* preset="thumb" keeps this to a ~96px Cloudinary render — a 2000px
          original scaled down in CSS would be 50 needless megabytes per page. */}
      <CloudinaryImage
        src={url}
        alt=""
        preset="thumb"
        fill
        sizes={`${size * 2}px`}
        className="object-cover"
        fallbackSrc={PRODUCT_PLACEHOLDER}
      />
    </div>
  );
}

function HeaderCell({
  column,
  query,
  onSort,
}: {
  column: ColumnKey;
  query: ProductQuery;
  onSort: (field: SortField) => void;
}) {
  const field = COLUMN_SORT[column];
  const active = field && query.sort === field;
  const Icon = !active ? ArrowUpDown : query.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      className="px-3 py-2.5 text-left text-xs font-medium text-gray-500"
      aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : undefined}
    >
      {field ? (
        <button
          type="button"
          onClick={() => onSort(field)}
          className="inline-flex items-center gap-1 rounded hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          {COLUMN_LABELS[column]}
          <Icon className={`h-3 w-3 ${active ? "text-violet-600" : "opacity-40"}`} aria-hidden="true" />
        </button>
      ) : (
        COLUMN_LABELS[column]
      )}
    </th>
  );
}

function RowActions({
  product,
  canEdit,
  canDelete,
  busy,
  onRowAction,
  compact = false,
}: {
  product: Product;
  canEdit: boolean;
  canDelete: boolean;
  busy: boolean;
  onRowAction: (action: RowAction, product: Product) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${compact ? "" : "justify-end"}`}>
      {canEdit && !compact && (
        <Tooltip label="Modifier">
          <Link
            href={`/dashboard/products/${product.id}`}
            aria-label={`Modifier ${product.name}`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Tooltip>
      )}

      <Popover
        label={`Actions pour ${product.name}`}
        panelClassName="w-56"
        trigger={({ toggle, ...aria }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            disabled={busy}
            aria-label={`Autres actions pour ${product.name}`}
            {...aria}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      >
        {(close) => (
          <>
            {canEdit && (
              <MenuItem icon={Pencil} onClick={() => { close(); onRowAction("edit", product); }}>
                Modifier
              </MenuItem>
            )}
            <MenuItem icon={ExternalLink} onClick={() => { close(); onRowAction("view", product); }}>
              Voir sur la boutique
            </MenuItem>
            {canEdit && (
              <>
                <MenuItem icon={Copy} onClick={() => { close(); onRowAction("duplicate", product); }}>
                  Dupliquer
                </MenuItem>
                <MenuSeparator />
                <MenuItem icon={Boxes} onClick={() => { close(); onRowAction("stock", product); }}>
                  Modifier le stock
                </MenuItem>
                <MenuItem icon={Tag} onClick={() => { close(); onRowAction("price", product); }}>
                  Modifier le prix
                </MenuItem>
                <MenuSeparator />
                {product.isPublished ? (
                  <MenuItem onClick={() => { close(); onRowAction("draft", product); }}>
                    Mettre en brouillon
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => { close(); onRowAction("publish", product); }}>Publier</MenuItem>
                )}
                {product.featured ? (
                  <MenuItem icon={StarOff} onClick={() => { close(); onRowAction("unfeature", product); }}>
                    Retirer de la vitrine
                  </MenuItem>
                ) : (
                  <MenuItem icon={Star} onClick={() => { close(); onRowAction("feature", product); }}>
                    Ajouter à la vitrine
                  </MenuItem>
                )}
              </>
            )}
            {canDelete && (
              <>
                <MenuSeparator />
                <MenuItem icon={Trash2} destructive onClick={() => { close(); onRowAction("delete", product); }}>
                  Supprimer
                </MenuItem>
              </>
            )}
          </>
        )}
      </Popover>
    </div>
  );
}
