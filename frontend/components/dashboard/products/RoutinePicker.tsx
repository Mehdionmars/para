"use client";

import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Loader2,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { searchRoutineProducts } from "@/app/dashboard/(app)/products/actions";
import {
  CATEGORY_OPTIONS,
  type Brand,
  type RoutinePick,
} from "@/lib/dashboard/products-types";

/** The storefront block shows the current product plus this many suggestions. */
export const ROUTINE_MAX = 2;

const price = (n: number) => `${n.toFixed(2).replace(".", ",")} MAD`;

function Thumb({ pick }: { pick: RoutinePick }) {
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
      {pick.image && (
        <Image
          src={pick.image}
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      )}
    </span>
  );
}

const selectCls =
  "h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function RoutinePicker({
  picks,
  onChange,
  brands,
  selfId,
  currentBrand,
  currentCategory,
}: {
  picks: RoutinePick[];
  onChange: (next: RoutinePick[]) => void;
  brands: Brand[];
  /** The product being edited: never offered as its own suggestion. */
  selfId?: number;
  currentBrand?: number;
  currentCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RoutinePick[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const full = picks.length >= ROUTINE_MAX;
  const pickIds = picks.map((p) => p.id).join(",");

  useEffect(() => {
    if (full || !open) return;
    setSearching(true);
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const exclude = [
          ...(pickIds ? pickIds.split(",").map(Number) : []),
          ...(selfId ? [selfId] : []),
        ];
        const found = await searchRoutineProducts(query, exclude, {
          brand: brandFilter ? Number(brandFilter) : undefined,
          category: categoryFilter || undefined,
        });
        if (!stale) setResults(found);
      } catch {
        if (!stale) setResults([]);
      } finally {
        if (!stale) setSearching(false);
      }
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [query, full, open, pickIds, selfId, brandFilter, categoryFilter]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const add = (p: RoutinePick) => {
    if (full || picks.some((x) => x.id === p.id)) return;
    onChange([...picks, p]);
    setQuery("");
    setResults([]);
    setOpen(false);
  };
  const remove = (id: number) => onChange(picks.filter((p) => p.id !== id));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= picks.length || from === to) return;
    const next = [...picks];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm font-medium text-foreground">
          Complétez votre routine
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Les produits proposés avec celui-ci sur sa fiche (jusqu&apos;à{" "}
          {ROUTINE_MAX}). Glissez pour changer l&apos;ordre. S&apos;il en
          manque, le bloc se complète avec la même sous-catégorie, puis la même
          catégorie.
        </p>
      </div>

      {picks.length > 0 && (
        <ol
          className="flex flex-col gap-2"
          onDragLeave={() => setDragOver(null)}
        >
          {picks.map((p, i) => (
            <li
              key={p.id}
              draggable
              onDragStart={(e) => {
                setDragFrom(i);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(p.id));
              }}
              onDragOver={(e) => {
                if (dragFrom === null) return;
                e.preventDefault();
                setDragOver(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom !== null) move(dragFrom, i);
                setDragFrom(null);
                setDragOver(null);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
              className={`flex items-center gap-3 rounded-lg border bg-card p-2 ${
                dragOver === i && dragFrom !== i
                  ? "border-primary"
                  : "border-border"
              } ${dragFrom === i ? "opacity-50" : ""}`}
            >
              <GripVertical
                aria-hidden
                className="size-4 shrink-0 cursor-grab text-muted-foreground"
              />
              <Thumb pick={p} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {p.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {[p.brand, price(p.price)].filter(Boolean).join(" · ")}
                  {!p.available && (
                    <span className="ml-2 text-destructive">
                      Indisponible : sera masqué en boutique
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Monter ${p.name}`}
                  className="rounded p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === picks.length - 1}
                  aria-label={`Descendre ${p.name}`}
                  className="rounded p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`Retirer ${p.name}`}
                  className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div ref={boxRef} className="relative">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            disabled={full}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={
              full
                ? `${ROUTINE_MAX} produits choisis : retirez-en un pour changer`
                : "Rechercher par nom, marque ou SKU…"
            }
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {searching && (
            <Loader2
              aria-hidden
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            />
          )}
        </div>

        {open && !full && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover p-2 shadow-lg">
            <div className="mb-2 flex flex-wrap gap-2">
              {currentCategory && (
                <button
                  type="button"
                  onClick={() =>
                    setCategoryFilter(
                      categoryFilter === currentCategory ? "" : currentCategory,
                    )
                  }
                  aria-pressed={categoryFilter === currentCategory}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    categoryFilter === currentCategory
                      ? "border-primary bg-primary text-white"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Même catégorie ({currentCategory})
                </button>
              )}
              {currentBrand ? (
                <button
                  type="button"
                  onClick={() =>
                    setBrandFilter(
                      brandFilter === String(currentBrand)
                        ? ""
                        : String(currentBrand),
                    )
                  }
                  aria-pressed={brandFilter === String(currentBrand)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    brandFilter === String(currentBrand)
                      ? "border-primary bg-primary text-white"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Même marque
                </button>
              ) : null}
            </div>
            <div className="mb-2 flex gap-2">
              <select
                aria-label="Filtrer par marque"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">Toutes les marques</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filtrer par catégorie"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">Toutes les catégories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <ul className="max-h-64 overflow-auto">
              {searching && results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Recherche…
                </li>
              ) : results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Aucun produit publié trouvé.
                </li>
              ) : (
                results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => add(p)}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"
                    >
                      <Thumb pick={p} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">
                          {p.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[p.brand, price(p.price)]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {!p.available && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          Rupture
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {picks.length}/{ROUTINE_MAX} choisis
        {picks.length === 0 && " · sélection automatique"}
      </div>
    </div>
  );
}
