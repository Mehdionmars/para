"use server";

import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@/lib/dashboard/bookings-types";
import { payloadFetch } from "@/lib/dashboard/payload";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function patchBooking(id: number, data: Record<string, unknown>, fallback: string): Promise<ActionResult> {
  const res = await payloadFetch(`/api/bookings/${id}`, { body: JSON.stringify(data), method: "PATCH" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message: string = body?.errors?.[0]?.data?.errors?.[0]?.message || body?.errors?.[0]?.message || fallback;
    // The slot index refusing a re-opened booking whose slot was rebooked.
    if (/unique/i.test(message)) return { error: "Ce créneau est déjà pris par un autre rendez-vous.", ok: false };
    return { error: message, ok: false };
  }
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/overview");
  return { ok: true };
}

/** Confirms, cancels, closes or reopens a booking. Access is checked by the
 * Bookings collection (staff only), with the operator's own session. */
export async function updateBookingStatus(id: number, status: BookingStatus): Promise<ActionResult> {
  return patchBooking(id, { status }, "Échec de la mise à jour du rendez-vous.");
}

export async function updateBookingStaffNote(id: number, staffNote: string): Promise<ActionResult> {
  return patchBooking(id, { staffNote: staffNote.slice(0, 2000) }, "Échec de l'enregistrement de la note.");
}
