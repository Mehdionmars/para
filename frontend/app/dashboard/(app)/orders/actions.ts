"use server";

import { revalidatePath } from "next/cache";
import { payloadFetch } from "@/lib/dashboard/payload";
import type { OrderStatus, PaymentStatus } from "@/lib/dashboard/orders-types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Moves an order to a new status.
 *
 * The transition itself is validated by the Orders beforeChange hook, so this
 * action deliberately does no checking of its own — a second copy of the
 * rules here could disagree with the server's. Its job is to surface the
 * server's refusal as a message instead of an unhandled throw, so the
 * operator sees *why* a move was rejected.
 */
export async function updateOrderStatus(id: number, status: OrderStatus): Promise<ActionResult> {
  const res = await payloadFetch(`/api/orders/${id}`, { body: JSON.stringify({ status }), method: "PATCH" });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    // Payload reports field/hook errors as { errors: [{ message }] }.
    const message =
      body?.errors?.[0]?.message || body?.message || "Échec de la mise à jour du statut.";
    return { error: String(message), ok: false };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function updatePaymentStatus(id: number, paymentStatus: PaymentStatus): Promise<ActionResult> {
  const res = await payloadFetch(`/api/orders/${id}`, {
    body: JSON.stringify({ paymentStatus }),
    method: "PATCH",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.errors?.[0]?.message || body?.message || "Échec de la mise à jour du paiement.";
    return { error: String(message), ok: false };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
  return { ok: true };
}

/** Marks one internal notification as read. */
export async function markNotificationRead(id: number): Promise<ActionResult> {
  const res = await payloadFetch(`/api/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) return { error: "Impossible de marquer comme lue.", ok: false };
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return { ok: true };
}
