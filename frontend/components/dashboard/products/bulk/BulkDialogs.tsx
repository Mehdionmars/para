"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { BulkOperation } from "@/app/dashboard/(app)/products/actions";
import { Button } from "@/components/dashboard/ui/Button";
import { Modal } from "@/components/dashboard/ui/Modal";
import { CATEGORY_OPTIONS, type Brand, type Product } from "@/lib/dashboard/products-types";

/**
 * The bulk edit dialogs.
 *
 * Each one shows a real preview computed from the actual selected rows —
 * "149 MAD → 134 MAD", "12 → 22" — before anything is sent. The preview uses
 * the same arithmetic as the server, but it is only ever a *display*: the
 * request carries the instruction (mode + value), never the computed result,
 * and the server recomputes from the database. If the two ever disagree, the
 * server's answer is the one that lands.
 */

const money = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;
const round2 = (n: number) => Math.round(n * 100) / 100;

function labelFor(count: number) {
  return `${count} produit${count > 1 ? "s" : ""}`;
}

/** Shared shell: title, preview list, error, and a submit that cannot be
 * double-clicked. */
function DialogShell({
  title,
  count,
  busy,
  error,
  disabled,
  submitLabel = "Appliquer",
  onSubmit,
  onClose,
  children,
  preview,
  warning,
}: {
  title: string;
  count: number;
  busy: boolean;
  error?: string;
  disabled?: boolean;
  submitLabel?: string;
  onSubmit: () => void;
  onClose: () => void;
  children: React.ReactNode;
  preview?: React.ReactNode;
  warning?: string;
}) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-gray-500">{labelFor(count)} concerné{count > 1 ? "s" : ""}.</p>

        {children}

        {preview && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-600">Aperçu</p>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/60 p-2 text-xs">
              {preview}
            </div>
          </div>
        )}

        {warning && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{warning}</p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={busy || disabled}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "Application…" : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PreviewRows({
  products,
  render,
}: {
  products: Product[];
  render: (p: Product) => { before: string; after: string } | null;
}) {
  const rows = products.map((p) => ({ p, change: render(p) })).filter((r) => r.change);
  if (rows.length === 0) {
    return <p className="px-1 py-2 text-gray-500">Aucun changement à appliquer sur cette sélection.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {rows.slice(0, 40).map(({ p, change }) => (
        <li key={p.id} className="flex items-center justify-between gap-3 px-1">
          <span className="min-w-0 truncate text-gray-600">{p.name}</span>
          <span className="shrink-0 tabular-nums text-gray-900">
            {change!.before} <span className="text-gray-400">→</span>{" "}
            <span className="font-medium">{change!.after}</span>
          </span>
        </li>
      ))}
      {rows.length > 40 && (
        <li className="px-1 pt-1 text-gray-500">et {rows.length - 40} autre(s)…</li>
      )}
    </ul>
  );
}

const RADIO_CLASS = "flex cursor-pointer items-center gap-2 text-sm text-gray-700";
const FIELD_CLASS =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

// ------------------------------------------------------------------ stock

export function BulkStockDialog({
  products,
  busy,
  error,
  onApply,
  onClose,
}: {
  products: Product[];
  busy: boolean;
  error?: string;
  onApply: (op: BulkOperation) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"set" | "increase" | "decrease">("increase");
  const [value, setValue] = useState("10");
  const [reason, setReason] = useState("");

  const n = Number(value);
  const valid = Number.isInteger(n) && n >= 0;

  return (
    <DialogShell
      title={`Modifier le stock de ${labelFor(products.length)}`}
      count={products.length}
      busy={busy}
      error={error}
      disabled={!valid}
      onClose={onClose}
      onSubmit={() => onApply({ mode, reason: reason.trim() || undefined, type: "stock", value: n })}
      warning={`Cette opération modifiera le stock de ${labelFor(products.length)} et sera tracée dans les mouvements de stock.`}
      preview={
        valid ? (
          <PreviewRows
            products={products}
            render={(p) => {
              const after =
                mode === "set" ? n : mode === "increase" ? p.stock + n : Math.max(0, p.stock - n);
              return after === p.stock ? null : { after: String(after), before: String(p.stock) };
            }}
          />
        ) : null
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-gray-600">Mode</legend>
        {(
          [
            ["set", "Remplacer le stock"],
            ["increase", "Ajouter au stock"],
            ["decrease", "Retirer du stock"],
          ] as const
        ).map(([m, label]) => (
          <label key={m} className={RADIO_CLASS}>
            <input
              type="radio"
              name="stock-mode"
              checked={mode === m}
              onChange={() => setMode(m)}
              className="h-4 w-4 accent-violet-700"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="bulk-stock-value" className="mb-1.5 block text-xs font-medium text-gray-600">
          Valeur
        </label>
        <input
          id="bulk-stock-value"
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={FIELD_CLASS}
        />
        {!valid && <p className="mt-1 text-xs text-red-600">Entrez un entier positif.</p>}
      </div>

      <div>
        <label htmlFor="bulk-stock-reason" className="mb-1.5 block text-xs font-medium text-gray-600">
          Motif (optionnel)
        </label>
        <input
          id="bulk-stock-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Inventaire, casse, réception…"
          className={FIELD_CLASS}
        />
      </div>
    </DialogShell>
  );
}

// ------------------------------------------------------------------ price

export function BulkPriceDialog({
  products,
  busy,
  error,
  onApply,
  onClose,
}: {
  products: Product[];
  busy: boolean;
  error?: string;
  onApply: (op: BulkOperation) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"set" | "increase" | "decrease">("decrease");
  const [value, setValue] = useState("10");

  const n = Number(value);
  const valid = Number.isFinite(n) && n >= 0 && (mode === "set" || n <= 100);

  return (
    <DialogShell
      title={`Modifier les prix de ${labelFor(products.length)}`}
      count={products.length}
      busy={busy}
      error={error}
      disabled={!valid}
      onClose={onClose}
      onSubmit={() => onApply({ mode, type: "price", value: n })}
      warning="Le prix final est recalculé par le serveur à partir du prix actuel en base."
      preview={
        valid ? (
          <PreviewRows
            products={products}
            render={(p) => {
              const after =
                mode === "set"
                  ? round2(n)
                  : mode === "increase"
                    ? round2(p.price * (1 + n / 100))
                    : round2(p.price * (1 - n / 100));
              return after === p.price ? null : { after: money(after), before: money(p.price) };
            }}
          />
        ) : null
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-gray-600">Mode</legend>
        {(
          [
            ["set", "Remplacer par un prix fixe"],
            ["increase", "Augmenter de X %"],
            ["decrease", "Diminuer de X %"],
          ] as const
        ).map(([m, label]) => (
          <label key={m} className={RADIO_CLASS}>
            <input
              type="radio"
              name="price-mode"
              checked={mode === m}
              onChange={() => setMode(m)}
              className="h-4 w-4 accent-violet-700"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="bulk-price-value" className="mb-1.5 block text-xs font-medium text-gray-600">
          {mode === "set" ? "Prix (MAD)" : "Pourcentage (%)"}
        </label>
        <input
          id="bulk-price-value"
          type="number"
          min={0}
          max={mode === "set" ? undefined : 100}
          step={mode === "set" ? 1 : 0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={FIELD_CLASS}
        />
        {!valid && (
          <p className="mt-1 text-xs text-red-600">
            {mode === "set" ? "Entrez un prix positif." : "Entrez un pourcentage entre 0 et 100."}
          </p>
        )}
      </div>
    </DialogShell>
  );
}

// ----------------------------------------------------------------- status

const STATUS_LABELS = {
  archived: "Archivé",
  draft: "Brouillon",
  published: "Publié",
} as const;

function statusOf(p: Product): keyof typeof STATUS_LABELS {
  return p.discontinued ? "archived" : p.isPublished ? "published" : "draft";
}

export function BulkStatusDialog({
  products,
  busy,
  error,
  onApply,
  onClose,
}: {
  products: Product[];
  busy: boolean;
  error?: string;
  onApply: (op: BulkOperation) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState<"published" | "draft" | "archived">("published");
  const changing = products.filter((p) => statusOf(p) !== value).length;

  return (
    <DialogShell
      title={`Modifier le statut de ${labelFor(products.length)}`}
      count={products.length}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={() => onApply({ type: "status", value })}
      warning={
        value === "published"
          ? `${changing} produit(s) deviendront visibles sur la boutique.`
          : `${changing} produit(s) seront retirés de la boutique.`
      }
      preview={
        <PreviewRows
          products={products}
          render={(p) =>
            statusOf(p) === value
              ? null
              : { after: STATUS_LABELS[value], before: STATUS_LABELS[statusOf(p)] }
          }
        />
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-gray-600">Nouveau statut</legend>
        {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((s) => (
          <label key={s} className={RADIO_CLASS}>
            <input
              type="radio"
              name="status-value"
              checked={value === s}
              onChange={() => setValue(s)}
              className="h-4 w-4 accent-violet-700"
            />
            {STATUS_LABELS[s]}
          </label>
        ))}
      </fieldset>
    </DialogShell>
  );
}

// -------------------------------------------------------------- promotion

export function BulkPromotionDialog({
  products,
  busy,
  error,
  onApply,
  onClose,
}: {
  products: Product[];
  busy: boolean;
  error?: string;
  onApply: (op: BulkOperation) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"percent" | "price" | "disable">("percent");
  const [value, setValue] = useState("20");

  const n = Number(value);
  const valid =
    mode === "disable" ||
    (mode === "percent" ? Number.isFinite(n) && n > 0 && n < 100 : Number.isFinite(n) && n >= 0);

  return (
    <DialogShell
      title={`Promotion sur ${labelFor(products.length)}`}
      count={products.length}
      busy={busy}
      error={error}
      disabled={!valid}
      onClose={onClose}
      onSubmit={() =>
        onApply(
          mode === "disable"
            ? { mode: "disable", type: "promotion" }
            : mode === "percent"
              ? { mode: "enable", percent: n, type: "promotion" }
              : { mode: "enable", price: n, type: "promotion" },
        )
      }
      warning={
        mode === "disable"
          ? "Le prix barré redevient le prix de vente."
          : "La réduction s'applique au prix de référence (le prix barré s'il existe), jamais à un prix déjà réduit."
      }
      preview={
        valid ? (
          <PreviewRows
            products={products}
            render={(p) => {
              if (mode === "disable") {
                return p.oldPrice ? { after: money(p.oldPrice), before: money(p.price) } : null;
              }
              const reference = p.oldPrice ?? p.price;
              const next = mode === "percent" ? round2(reference * (1 - n / 100)) : round2(n);
              if (next >= reference) return { after: "⚠ trop élevé", before: money(p.price) };
              return { after: money(next), before: money(p.price) };
            }}
          />
        ) : null
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-gray-600">Action</legend>
        {(
          [
            ["percent", "Activer une réduction en %"],
            ["price", "Définir un prix promotionnel"],
            ["disable", "Désactiver la promotion"],
          ] as const
        ).map(([m, label]) => (
          <label key={m} className={RADIO_CLASS}>
            <input
              type="radio"
              name="promo-mode"
              checked={mode === m}
              onChange={() => setMode(m)}
              className="h-4 w-4 accent-violet-700"
            />
            {label}
          </label>
        ))}
      </fieldset>

      {mode !== "disable" && (
        <div>
          <label htmlFor="bulk-promo-value" className="mb-1.5 block text-xs font-medium text-gray-600">
            {mode === "percent" ? "Réduction (%)" : "Prix promotionnel (MAD)"}
          </label>
          <input
            id="bulk-promo-value"
            type="number"
            min={0}
            max={mode === "percent" ? 99 : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={FIELD_CLASS}
          />
          {!valid && (
            <p className="mt-1 text-xs text-red-600">
              {mode === "percent" ? "Entrez une réduction entre 1 et 99 %." : "Entrez un prix positif."}
            </p>
          )}
        </div>
      )}
    </DialogShell>
  );
}

// -------------------------------------------------------- category/brand

export function BulkTaxonomyDialog({
  kind,
  products,
  brands,
  busy,
  error,
  onApply,
  onClose,
}: {
  kind: "category" | "brand";
  products: Product[];
  brands: Brand[];
  busy: boolean;
  error?: string;
  onApply: (op: BulkOperation) => void;
  onClose: () => void;
}) {
  const options = useMemo(
    () =>
      kind === "category"
        ? CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))
        : brands.map((b) => ({ label: b.name, value: String(b.id) })),
    [kind, brands],
  );

  const [value, setValue] = useState(options[0]?.value ?? "");
  const [filter, setFilter] = useState("");

  const visible = options.filter((o) => o.label.toLowerCase().includes(filter.trim().toLowerCase()));
  const chosen = options.find((o) => o.value === value);

  return (
    <DialogShell
      title={kind === "category" ? "Changer la catégorie" : "Changer la marque"}
      count={products.length}
      busy={busy}
      error={error}
      disabled={!value}
      onClose={onClose}
      onSubmit={() =>
        onApply(kind === "category" ? { type: "category", value } : { type: "brand", value: Number(value) })
      }
      preview={
        chosen ? (
          <p className="px-1 py-1 text-gray-700">
            {labelFor(products.length)} <span className="text-gray-400">→</span>{" "}
            <span className="font-medium">{chosen.label}</span>
          </p>
        ) : null
      }
    >
      <div>
        <label htmlFor="taxonomy-search" className="mb-1.5 block text-xs font-medium text-gray-600">
          {kind === "category" ? "Catégorie" : "Marque"}
        </label>
        {/* Searchable rather than a bare select: the brand list runs to
            dozens of entries and scrolling a native select to find one is
            the slowest part of the job. */}
        <input
          id="taxonomy-search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer…"
          className={`${FIELD_CLASS} mb-2`}
        />
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
          {visible.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-500">Aucun résultat.</p>
          ) : (
            visible.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="taxonomy-value"
                  checked={value === o.value}
                  onChange={() => setValue(o.value)}
                  className="h-4 w-4 accent-violet-700"
                />
                <span className="truncate">{o.label}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </DialogShell>
  );
}
