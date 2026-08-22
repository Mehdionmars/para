import { payloadFetch } from "./payload";
import { ORDER_TYPES, STOCK_TYPES, type NotificationRow, type Order, type OrderStatusHistoryEntry } from "./orders-types";

export * from "./orders-types";

export async function listOrders(): Promise<Order[]> {
  const res = await payloadFetch("/api/orders?limit=1000&depth=0&sort=-createdAt");
  if (!res.ok) throw new Error("Impossible de charger les commandes.");
  const data = await res.json();
  return data.docs;
}

export async function getOrder(id: string): Promise<Order | null> {
  const res = await payloadFetch(`/api/orders/${id}?depth=0`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Thumbnails for a set of order lines, in one request.
 *
 * An order line snapshots the product's name and price at purchase time but
 * not its image, so the workspace had nothing to show and every row fell back
 * to the placeholder. The image has to be looked up from the product itself.
 *
 * Deliberately a separate `where[id][in]` query rather than raising the
 * order's own `depth`: depth=2 would embed each full product document —
 * description, badges, variants, the lot — inside the order payload, several
 * kilobytes per line, to extract one URL. This stays one extra request
 * whatever the basket size, and asks only for the media relation.
 *
 * A deleted product simply has no entry, and the caller keeps the placeholder.
 */
export async function getOrderItemImages(productIds: number[]): Promise<Map<number, string>> {
  const ids = [...new Set(productIds)];
  if (ids.length === 0) return new Map();

  const res = await payloadFetch(
    `/api/products?where[id][in]=${ids.join(",")}&limit=${ids.length}&depth=1&select[image]=true`,
  );
  if (!res.ok) return new Map();

  const data = (await res.json()) as { docs?: { id: number; image?: { url?: string } | null }[] };
  const map = new Map<number, string>();
  for (const doc of data.docs ?? []) {
    if (doc.image?.url) map.set(doc.id, doc.image.url);
  }
  return map;
}

/** Status history for one order, oldest first — the order the timeline reads. */
export async function getOrderHistory(id: number | string): Promise<OrderStatusHistoryEntry[]> {
  const res = await payloadFetch(
    `/api/order-status-history?where[order][equals]=${id}&limit=100&depth=0&sort=createdAt`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs ?? [];
}

export async function listNotifications(limit = 100): Promise<NotificationRow[]> {
  const res = await payloadFetch(`/api/notifications?limit=${limit}&depth=1&sort=-createdAt`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs ?? [];
}

/** Counts by group, for the notification centre's stat row. One aggregate
 * request per counter rather than fetching every row and tallying in JS —
 * `limit=0` returns totalDocs and no documents. */
export async function notificationStats(): Promise<{
  total: number;
  unread: number;
  lowStock: number;
  outOfStock: number;
  backInStock: number;
  orders: number;
  failed: number;
}> {
  const count = async (query: string) => {
    const res = await payloadFetch(`/api/notifications?limit=0&depth=0&${query}`);
    if (!res.ok) return 0;
    return Number((await res.json()).totalDocs) || 0;
  };

  const [total, unread, lowStock, outOfStock, backInStock, orders, failed] = await Promise.all([
    count(""),
    count("where[channel][equals]=internal&where[readAt][exists]=false"),
    count("where[type][equals]=LOW_STOCK&where[channel][equals]=internal"),
    count("where[type][equals]=OUT_OF_STOCK&where[channel][equals]=internal"),
    count("where[type][equals]=BACK_IN_STOCK&where[channel][equals]=internal"),
    count(`where[type][in]=${ORDER_TYPES.join(",")}&where[channel][equals]=internal`),
    count("where[status][equals]=failed"),
  ]);

  return { backInStock, failed, lowStock, orders, outOfStock, total, unread };
}

/** One page of notifications, filtered server-side. */
export async function listNotificationsPage({
  group = "all",
  page = 1,
  perPage = 25,
}: {
  group?: "all" | "unread" | "stock" | "orders" | "system";
  page?: number;
  perPage?: number;
}): Promise<{ docs: NotificationRow[]; totalDocs: number; totalPages: number; page: number }> {
  const p = new URLSearchParams({
    depth: "1",
    limit: String(perPage),
    page: String(page),
    sort: "-createdAt",
  });

  let i = 0;
  const where = (path: string, value: string) => p.set(`where[and][${i++}]${path}`, value);

  if (group === "unread") {
    where("[channel][equals]", "internal");
    where("[readAt][exists]", "false");
  } else if (group === "stock") {
    where("[type][in]", STOCK_TYPES.join(","));
  } else if (group === "orders") {
    // Explicit list rather than `like: "ORDER_"`: on an enum column that
    // pattern matched nothing, and `_` is a single-character wildcard in SQL
    // LIKE anyway — an easy way to match more than intended.
    where("[type][in]", ORDER_TYPES.join(","));
  } else if (group === "system") {
    // Whatever is neither a stock alert nor an order event.
    where("[type][not_in]", [...STOCK_TYPES, ...ORDER_TYPES].join(","));
  }

  const res = await payloadFetch(`/api/notifications?${p.toString()}`);
  if (!res.ok) throw new Error("Impossible de charger les notifications.");
  const data = await res.json();
  return {
    docs: data.docs ?? [],
    page: data.page ?? page,
    totalDocs: data.totalDocs ?? 0,
    totalPages: data.totalPages ?? 1,
  };
}

/** Email/WhatsApp/push deliveries, for the monitoring panel. */
export async function listDeliveries(status?: "pending" | "sent" | "failed"): Promise<NotificationRow[]> {
  const p = new URLSearchParams({ depth: "1", limit: "50", sort: "-createdAt" });
  p.set("where[and][0][channel][not_equals]", "internal");
  if (status) p.set("where[and][1][status][equals]", status);

  const res = await payloadFetch(`/api/notifications?${p.toString()}`);
  if (!res.ok) return [];
  return (await res.json()).docs ?? [];
}

/** Unread internal notifications, for the bell badge. */
export async function countUnreadNotifications(): Promise<number> {
  const res = await payloadFetch(
    "/api/notifications?limit=0&depth=0&where[channel][equals]=internal&where[readAt][exists]=false",
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data.totalDocs) || 0;
}
