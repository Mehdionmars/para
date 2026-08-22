"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchProducts, type ProductSearchResult } from "@/app/dashboard/(app)/storefront/actions";

export type PickedProduct = { id: number; label: string; slug?: string };

/** Debounced product search + multi-select, backed by a live server action
 * (not a static snapshot) so newly-added or renamed products show up
 * immediately. Used for rail manual picks, campaign products, dermo picks. */
export function ProductPicker({
  selected,
  onChange,
  max,
}: {
  selected: PickedProduct[];
  onChange: (next: PickedProduct[]) => void;
  max?: number;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchProducts(query));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function add(p: ProductSearchResult) {
    if (selected.some((s) => s.id === p.id)) return;
    if (max && selected.length >= max) return;
    onChange([...selected, { id: p.id, slug: p.slug, label: p.brand ? `${p.name} — ${p.brand}` : p.name }]);
    setQuery("");
    setResults([]);
  }

  function remove(id: number) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-violet-400"
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-gray-400" />}
      </div>

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => add(p)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span className="truncate">{p.name}</span>
              {p.brand && <span className="flex-none text-xs text-gray-400">{p.brand}</span>}
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span key={s.id} className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              {s.label}
              <button type="button" aria-label={`Retirer ${s.label}`} onClick={() => remove(s.id)} className="text-violet-400 hover:text-violet-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
