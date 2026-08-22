"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { payloadFetch } from "@/lib/dashboard/payload";
import type { ProductQuery } from "@/lib/dashboard/product-query";
import { listProductIds } from "@/lib/dashboard/products";
import type { Product, ProductBadge, ProductVariant, VariantOptionType } from "@/lib/dashboard/products-types";

export type ProductInput = {
  name: string;
  brand: number;
  category: string;
  size?: string;
  price: number;
  oldPrice?: number;
  badges?: ProductBadge[];
  description: string;
  image?: number;
  /** Secondary shots, in display order. Payload stores this as an array of
   * `{ image: <media id> }` rows — see cleanPayload for the mapping. */
  gallery?: number[];
  sku?: string;
  barcode?: string;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  hasVariants?: boolean;
  variantOptionType?: VariantOptionType;
  variants?: ProductVariant[];
  isPublished: boolean;
};

function cleanPayload(input: ProductInput) {
  const { gallery, ...rest } = input;
  return {
    ...rest,
    oldPrice: input.oldPrice || undefined,
    sku: input.sku || undefined,
    barcode: input.barcode || undefined,
    // Payload's `gallery` is an array field of upload rows, not a flat list
    // of ids. Sent as `undefined` when the caller didn't manage the gallery
    // at all, so an existing one is never wiped by omission.
    gallery: gallery ? gallery.map((id) => ({ image: id })) : undefined,
  };
}

export async function createProduct(input: ProductInput) {
  const res = await payloadFetch("/api/products", {
    body: JSON.stringify(cleanPayload(input)),
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.message || "Échec de la création du produit.");
  }
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProduct(id: number, input: ProductInput) {
  const res = await payloadFetch(`/api/products/${id}`, {
    body: JSON.stringify(cleanPayload(input)),
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.message || "Échec de la mise à jour du produit.");
  }
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProduct(id: number) {
  const res = await payloadFetch(`/api/products/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.message || "Échec de la suppression du produit.");
  }
  revalidatePath("/dashboard/products");
}

export type BulkOperation =
  | { type: "stock"; mode: "set" | "increase" | "decrease"; value: number; reason?: string }
  | { type: "price"; mode: "set" | "increase" | "decrease"; value: number }
  | { type: "status"; value: "published" | "draft" | "archived" }
  | { type: "promotion"; mode: "enable" | "disable"; percent?: number; price?: number }
  | { type: "category"; value: string }
  | { type: "brand"; value: number }
  | { type: "featured"; value: boolean };

export type BulkResult =
  | { ok: true; updated: number; missing: number }
  | { ok: false; error: string; conflict?: boolean };

/**
 * Applies one bulk operation.
 *
 * This action carries no arithmetic: it forwards the *instruction* to
 * /api/products/bulk, which recomputes every resulting price and stock level
 * from the rows as they are in the database, inside a single transaction.
 * A value computed in the browser is never written.
 */
export async function bulkUpdateProducts(
  ids: number[],
  operation: BulkOperation,
  seenAt?: string,
): Promise<BulkResult> {
  if (ids.length === 0) return { error: "Aucun produit sélectionné.", ok: false };

  let res: Response;
  try {
    res = await payloadFetch("/api/products/bulk", {
      body: JSON.stringify({ ids, operation, seenAt }),
      method: "POST",
    });
  } catch {
    return { error: "Service indisponible. Réessayez.", ok: false };
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      // 409 is the concurrency guard, and the operator needs to know to
      // refresh rather than simply retry — hence the distinct flag.
      conflict: res.status === 409,
      error: data?.error || messageForStatus(res.status),
      ok: false,
    };
  }

  revalidatePath("/dashboard/products");
  return { missing: data?.missing ?? 0, ok: true, updated: data?.updated ?? 0 };
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Requête invalide.";
    case 401:
      return "Votre session a expiré. Reconnectez-vous.";
    case 403:
      return "Votre rôle ne permet pas cette opération.";
    case 404:
      return "Produits introuvables.";
    case 409:
      return "Ces produits ont changé entre-temps. Rafraîchissez avant de réappliquer.";
    default:
      return "Une erreur serveur est survenue.";
  }
}

export type BulkDeleteResult = { deleted: number; failed: { id: number; message: string }[] };

/** Deletes each product individually (not a single `where: {id: {in}}` bulk
 * call) so one row's failure — e.g. an access rule rejecting it — never
 * blocks the rest of the selection from being removed. */
/** Ids of every product matching the current filters — powers "tout
 * sélectionner dans les résultats" without shipping the documents. */
export async function selectAllMatching(query: ProductQuery): Promise<number[]> {
  return listProductIds(query);
}

const CSV_COLUMNS = [
  "id",
  "name",
  "brand",
  "category",
  "sku",
  "barcode",
  "price",
  "oldPrice",
  "stock",
  "lowStockThreshold",
  "status",
] as const;

/** RFC 4180 quoting: doubles embedded quotes and wraps anything containing a
 * delimiter, quote or newline. Excel in French locales also needs the BOM
 * added by the caller to read accents correctly. */
function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Builds a CSV of the current selection, or of every filtered result.
 *
 * Returns the text rather than a file: the browser turns it into a download
 * with a Blob, which avoids a second round-trip and keeps the session cookie
 * out of a URL.
 */
export async function exportProductsCsv({
  ids,
  query,
}: {
  ids?: number[];
  query: ProductQuery;
}): Promise<{ ok: true; csv: string; count: number } | { ok: false; error: string }> {
  try {
    const targetIds = ids && ids.length > 0 ? ids : await listProductIds(query);
    if (targetIds.length === 0) return { error: "Aucun produit à exporter.", ok: false };

    const rows: string[] = [CSV_COLUMNS.join(";")];

    // Chunked so a 5 000-product export doesn't build one enormous URL.
    for (let i = 0; i < targetIds.length; i += 200) {
      const chunk = targetIds.slice(i, i + 200);
      const params = new URLSearchParams({ depth: "1", limit: String(chunk.length) });
      chunk.forEach((id, j) => params.set(`where[id][in][${j}]`, String(id)));

      const res = await payloadFetch(`/api/products?${params.toString()}`);
      if (!res.ok) return { error: "Échec de la récupération des produits.", ok: false };
      const data = await res.json();

      for (const p of (data.docs ?? []) as Product[]) {
        rows.push(
          [
            p.id,
            p.name,
            typeof p.brand === "object" && p.brand ? p.brand.name : "",
            p.category,
            p.sku ?? "",
            p.barcode ?? "",
            p.price,
            p.oldPrice ?? "",
            p.stock,
            p.lowStockThreshold,
            p.discontinued ? "archived" : p.isPublished ? "published" : "draft",
          ]
            .map(csvCell)
            .join(";"),
        );
      }
    }

    return { count: rows.length - 1, csv: rows.join("\r\n"), ok: true };
  } catch {
    return { error: "Une erreur est survenue pendant l'export.", ok: false };
  }
}

export async function deleteProducts(ids: number[]): Promise<BulkDeleteResult> {
  let deleted = 0;
  const failed: { id: number; message: string }[] = [];

  for (const id of ids) {
    const res = await payloadFetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      deleted++;
    } else {
      const data = await res.json().catch(() => ({}));
      failed.push({ id, message: data?.errors?.[0]?.message || "Échec de la suppression." });
    }
  }

  revalidatePath("/dashboard/products");
  return { deleted, failed };
}
