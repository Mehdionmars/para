import type { SortField } from "@/lib/dashboard/product-query";

export const COLUMN_KEYS = [
  "image",
  "name",
  "brand",
  "category",
  "price",
  "oldPrice",
  "stock",
  "status",
  "showcase",
  "sku",
  "barcode",
  "updatedAt",
] as const;

export type ColumnKey = (typeof COLUMN_KEYS)[number];

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  barcode: "Code-barres",
  brand: "Marque",
  category: "Catégorie",
  image: "Image",
  name: "Produit",
  oldPrice: "Ancien prix",
  price: "Prix",
  showcase: "Vitrine",
  sku: "SKU",
  status: "Statut",
  stock: "Stock",
  updatedAt: "Modifié le",
};

/** `name` is not toggleable: a row with no product name is unusable, and
 * hiding it would leave no way to tell rows apart. */
export const TOGGLEABLE_COLUMNS: ColumnKey[] = COLUMN_KEYS.filter((k) => k !== "name");

export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  "image",
  "name",
  "category",
  "price",
  "stock",
  "status",
  "showcase",
];

/** Which columns map to a server-side sort, and under which field. */
export const COLUMN_SORT: Partial<Record<ColumnKey, SortField>> = {
  category: "category",
  name: "name",
  price: "price",
  status: "isPublished",
  stock: "stock",
  updatedAt: "updatedAt",
};

export const COLUMNS_STORAGE_KEY = "products-table-columns";

export function storeColumns(columns: ColumnKey[]): void {
  try {
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
  } catch {
    // Private browsing or a full quota — the table still works, the choice
    // just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

// A minimal external store, read through useSyncExternalStore.
//
// localStorage is external state, and reading it in an effect means rendering
// the default set first and overwriting it a frame later — a visible flash of
// the wrong columns. useSyncExternalStore is the primitive built for this:
// the server snapshot is null (so SSR and hydration agree on the defaults)
// and the client snapshot is the stored value.
const listeners = new Set<() => void>();

export function subscribeToColumns(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab changing the preference should be reflected here too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getColumnsSnapshot(): string | null {
  try {
    return localStorage.getItem(COLUMNS_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Server render has no localStorage; null resolves to the default set. */
export function getColumnsServerSnapshot(): string | null {
  return null;
}

/** Parses a raw stored value into a usable column list, falling back to the
 * defaults when it is missing or no longer valid. */
export function resolveColumns(raw: string | null): ColumnKey[] {
  if (!raw) return DEFAULT_VISIBLE_COLUMNS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_VISIBLE_COLUMNS;
    const valid = parsed.filter((k): k is ColumnKey => (COLUMN_KEYS as readonly string[]).includes(k as string));
    return valid.length > 0 ? valid : DEFAULT_VISIBLE_COLUMNS;
  } catch {
    return DEFAULT_VISIBLE_COLUMNS;
  }
}
