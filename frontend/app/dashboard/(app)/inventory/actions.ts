"use server";

import { revalidatePath } from "next/cache";
import { payloadFetch } from "@/lib/dashboard/payload";

export type RestockInput = {
  productId: number;
  quantity: number;
  supplierId?: number;
  supplierName?: string;
  batchNumber?: string;
  expiryDate?: string;
  reference?: string;
  note?: string;
};

export type RestockResult = { previousStock: number; newStock: number; movementId: number; productName: string };

/** Calls the backend's atomic restock endpoint — never computes or sends the
 * new stock value itself; the server is the only source of truth for that. */
export async function restockProduct(input: RestockInput): Promise<RestockResult> {
  const res = await payloadFetch("/api/inventory/restock", {
    body: JSON.stringify(input),
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Échec du réapprovisionnement.");
  }
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
  return data as RestockResult;
}
