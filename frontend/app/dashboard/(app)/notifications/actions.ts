"use server";

import { revalidatePath } from "next/cache";
import { payloadFetch } from "@/lib/dashboard/payload";
import { countUnreadNotifications, listNotifications } from "@/lib/dashboard/orders";
import type { NotificationRow } from "@/lib/dashboard/orders-types";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateNotifications() {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

export async function markRead(id: number): Promise<ActionResult> {
  const res = await payloadFetch(`/api/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) return { error: "Impossible de marquer comme lue.", ok: false };
  revalidateNotifications();
  return { ok: true };
}

export async function markAllRead(): Promise<ActionResult & { updated?: number }> {
  const res = await payloadFetch("/api/notifications/read-all", { method: "POST" });
  if (!res.ok) return { error: "Impossible de tout marquer comme lu.", ok: false };
  const data = await res.json().catch(() => ({}));
  revalidateNotifications();
  return { ok: true, updated: data?.updated ?? 0 };
}

export type RetryResult =
  | { ok: true; attempts: number }
  | { ok: false; error: string; attempts?: number; status?: string };

/**
 * Re-attempts one delivery.
 *
 * Carries no logic of its own: the cap, the "already sent" refusal and the
 * attempt counter all live in the backend service, so a second caller cannot
 * bypass them.
 */
export async function retryDelivery(id: number): Promise<RetryResult> {
  let res: Response;
  try {
    res = await payloadFetch(`/api/notifications/${id}/retry`, { method: "POST" });
  } catch {
    return { error: "Service indisponible.", ok: false };
  }

  const data = await res.json().catch(() => null);

  if (res.ok && data?.ok) {
    revalidateNotifications();
    return { attempts: data.attempts, ok: true };
  }

  revalidateNotifications();
  return {
    attempts: data?.attempts,
    error: data?.error || "Relance impossible.",
    ok: false,
    status: data?.status,
  };
}

/** Feeds the bell without a page reload. */
export async function fetchBellData(): Promise<{ unread: number; recent: NotificationRow[] }> {
  const [unread, all] = await Promise.all([countUnreadNotifications(), listNotifications(8)]);
  return { recent: all.filter((n) => n.channel === "internal").slice(0, 6), unread };
}
