import type { RevenuePoint, StatusSlice } from "@/components/dashboard/overview/OverviewCharts";
import type { RecentOrder } from "@/components/dashboard/overview/OverviewTabs";
import type { SnapshotItem, TodoItem } from "@/components/dashboard/overview/TodoPanel";
import type { Kpi } from "@/components/dashboard/stats/KpiCard";
import { casablancaToday, listBookings } from "@/lib/dashboard/bookings";
import type { Booking } from "@/lib/dashboard/bookings-types";
import { dayKey, money, shortDate } from "@/lib/dashboard/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS, type OrderStatus } from "@/lib/dashboard/orders-types";
import { payloadCount, payloadFetchAll } from "@/lib/dashboard/payload";

/**
 * The shop's recent activity, loaded once and read two ways: the dashboard
 * home shows the headline of it, /dashboard/overview the whole board.
 *
 * Two functions, on purpose. `loadStoreActivity` is the only part that talks
 * to Payload; `summarizeActivity` is pure, takes the clock as an argument,
 * and is what the tests exercise. Every figure on both pages comes out of the
 * second one, so the home and the overview cannot disagree about what "this
 * week's revenue" means.
 *
 * A source that failed to load is `null`, never an empty list or a zero. The
 * summary turns that into "—" and drops the to-do rows it can no longer
 * count: "0 MAD" printed over a failed request reads as a dead week, which is
 * a worse lie than an honest gap.
 */

export type ActivityOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type CatalogueStats = { total: number; published: number; lowStock: number; stockValue: number };

export type StoreActivity = {
  orders: ActivityOrder[] | null;
  catalogue: CatalogueStats | null;
  bookings: Booking[] | null;
  /** "YYYY-MM-DD" in Casablanca — the day the bookings were loaded from. */
  today: string;
};

export type ActivitySummary = {
  /** The four headline figures: revenue, orders, basket, new customers. */
  headline: Kpi[];
  /** What asks for an action, most time-sensitive first; rows at zero are kept
   * and dropped by the panel, rows that could not be counted are left out. */
  todos: TodoItem[];
  /** The state of the catalogue, a snapshot rather than a trend. */
  snapshot: SnapshotItem[];
  /** Daily encaissé revenue over the last 30 days, oldest first. */
  revenueSeries: RevenuePoint[];
  /** Order counts per status over the loaded window, lifecycle order. */
  statusSeries: StatusSlice[];
  /** The latest orders, newest first, or null when orders did not load. */
  recentOrders: RecentOrder[] | null;
};

const DAY = 86_400_000;

/** 400 days: the overview's calendar browses months, and the year-ago month is
 * the comparison an operator reaches for at the end of a season. */
const ORDER_WINDOW_DAYS = 400;

async function loadOrders(): Promise<ActivityOrder[]> {
  // Bounded by date, not by row count, and paged: the API caps a page at 100,
  // so a busy month would otherwise silently truncate every comparison.
  const since = new Date(Date.now() - ORDER_WINDOW_DAYS * DAY).toISOString();
  const docs = await payloadFetchAll<ActivityOrder>(
    `/api/orders?depth=0&sort=-createdAt&where[createdAt][greater_than]=${since}&select[orderNumber]=true&select[customerName]=true&select[customerEmail]=true&select[total]=true&select[status]=true&select[createdAt]=true`,
  );
  if (!docs) throw new Error("Impossible de charger les commandes.");
  return docs;
}

async function loadCatalogue(): Promise<CatalogueStats> {
  // Counted in Postgres rather than by downloading the catalogue: the
  // previous version fetched every product to compute four numbers. "À
  // réapprovisionner" is out of stock plus low — `isLowStock` is kept by a
  // database trigger as stock > 0 and stock <= threshold, the same rule the
  // product list's "Stock faible" filter reads. Only the stock value still
  // needs rows, and only those with stock: a product at 0 adds nothing.
  const [total, published, outOfStock, low, stocked] = await Promise.all([
    payloadCount("/api/products/count"),
    payloadCount("/api/products/count?where[isPublished][equals]=true"),
    payloadCount("/api/products/count?where[stock][less_than_equal]=0"),
    payloadCount("/api/products/count?where[isLowStock][equals]=true"),
    payloadFetchAll<{ price: number; stock: number }>(
      "/api/products?depth=0&select[price]=true&select[stock]=true&where[stock][greater_than]=0",
      1000,
    ),
  ]);
  if (total === null || published === null || outOfStock === null || low === null || stocked === null) {
    throw new Error("Impossible de charger le catalogue.");
  }
  return {
    lowStock: outOfStock + low,
    published,
    stockValue: stocked.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0),
    total,
  };
}

/**
 * Orders, catalogue and bookings, each allowed to fail on its own: one
 * collection being unreachable costs the figures drawn from it and nothing
 * else.
 */
export async function loadStoreActivity(): Promise<StoreActivity> {
  const today = casablancaToday();
  const [orders, catalogue, bookings] = await Promise.allSettled([loadOrders(), loadCatalogue(), listBookings(today)]);
  return {
    bookings: bookings.status === "fulfilled" ? bookings.value : null,
    catalogue: catalogue.status === "fulfilled" ? catalogue.value : null,
    orders: orders.status === "fulfilled" ? orders.value : null,
    today,
  };
}

/** Cancelled and refunded orders are money that did not arrive. */
export function isRevenueOrder(o: Pick<ActivityOrder, "status">): boolean {
  return o.status !== "cancelled" && o.status !== "refunded";
}

/**
 * Relative change, or null when the comparison would be meaningless: no base
 * to divide by, or a base of one or two orders, where any movement becomes a
 * four-digit percentage about the divisor rather than the shop.
 */
export function pctChange(current: number, previous: number, previousSample: number): number | null {
  if (previous === 0 || previousSample < 3) return null;
  return ((current - previous) / previous) * 100;
}

/** The last `days` calendar days ending on `now`, oldest first, as local
 * day keys — UTC date substrings would file a 01:30 Casablanca order under the
 * previous day. */
function lastDays(now: number, days: number): Date[] {
  const out: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

function dailyTotals(orders: ActivityOrder[], days: Date[], value: (o: ActivityOrder) => number): number[] {
  const keys = days.map(dayKey);
  const totals = new Map(keys.map((k) => [k, 0]));
  for (const o of orders) {
    const key = dayKey(new Date(o.createdAt));
    const running = totals.get(key);
    if (running !== undefined) totals.set(key, running + value(o));
  }
  return keys.map((k) => totals.get(k) ?? 0);
}

function countNewCustomers(orders: ActivityOrder[], now: number): { current: number; previous: number } {
  // Bounded by the loaded window: a customer whose first order predates it
  // counts as new the next time they buy. At this shop's volume the window
  // spans over a year, which is why the card says "nouveaux clients" and not
  // a figure the accounts should rely on.
  const earliest = new Map<string, number>();
  for (const o of orders) {
    const email = o.customerEmail?.trim().toLowerCase();
    if (!email) continue;
    const at = new Date(o.createdAt).getTime();
    const seen = earliest.get(email);
    if (seen === undefined || at < seen) earliest.set(email, at);
  }

  let current = 0;
  let previous = 0;
  for (const at of earliest.values()) {
    const age = now - at;
    if (age < 0) continue;
    if (age < 7 * DAY) current++;
    else if (age < 14 * DAY) previous++;
  }
  return { current, previous };
}

/** French: 0 and 1 take the singular ("0 commande encaissée"). */
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

function percent(n: number): string {
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

const UNAVAILABLE = "—";

export function summarizeActivity(activity: StoreActivity, now: number = Date.now()): ActivitySummary {
  const { bookings, catalogue, orders } = activity;
  const all = orders ?? [];

  // The last seven days and the seven before them, split once for every card.
  const current: ActivityOrder[] = [];
  const previous: ActivityOrder[] = [];
  for (const o of all) {
    const age = now - new Date(o.createdAt).getTime();
    // Future-dated rows are seed data or clock skew, not sales.
    if (age < 0) continue;
    if (age < 7 * DAY) current.push(o);
    else if (age < 14 * DAY) previous.push(o);
  }

  const currentPaid = current.filter(isRevenueOrder);
  const previousPaid = previous.filter(isRevenueOrder);
  const currentRevenue = currentPaid.reduce((s, o) => s + o.total, 0);
  const previousRevenue = previousPaid.reduce((s, o) => s + o.total, 0);
  const totalRevenue = all.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);

  // Over orders that produced revenue: dividing by cancellations too would
  // understate every basket.
  const currentAov = currentPaid.length > 0 ? currentRevenue / currentPaid.length : 0;
  const previousAov = previousPaid.length > 0 ? previousRevenue / previousPaid.length : 0;

  // Every pending order in the window, not just this week's: an order placed
  // nine days ago and never confirmed is the most urgent one on the list.
  const pending = all.filter((o) => o.status === "pending").length;
  const newCustomers = countNewCustomers(all, now);
  const week = lastDays(now, 7);

  const headline: Kpi[] =
    orders === null
      ? [
          { caption: "Commandes indisponibles", href: "/dashboard/analytics", icon: "revenue", label: "Chiffre d'affaires", value: UNAVAILABLE },
          { caption: "Commandes indisponibles", href: "/dashboard/orders", icon: "orders", label: "Commandes", value: UNAVAILABLE },
          { caption: "Commandes indisponibles", icon: "aov", label: "Panier moyen", value: UNAVAILABLE },
          { caption: "Commandes indisponibles", href: "/dashboard/customers", icon: "newCustomers", label: "Nouveaux clients", value: UNAVAILABLE },
        ]
      : [
          {
            caption: `${money(totalRevenue)} sur les ${ORDER_WINDOW_DAYS} derniers jours`,
            deltaPct: pctChange(currentRevenue, previousRevenue, previous.length),
            href: "/dashboard/analytics",
            icon: "revenue",
            label: "Chiffre d'affaires",
            spark: dailyTotals(currentPaid, week, (o) => o.total),
            value: money(currentRevenue),
          },
          {
            caption: pending > 0 ? `${pending} en attente de confirmation` : "aucune en attente",
            deltaPct: pctChange(current.length, previous.length, previous.length),
            href: "/dashboard/orders",
            icon: "orders",
            label: "Commandes",
            spark: dailyTotals(current, week, () => 1),
            value: String(current.length),
          },
          {
            caption: `sur ${plural(currentPaid.length, "commande")} encaissée${currentPaid.length > 1 ? "s" : ""}`,
            deltaPct: pctChange(currentAov, previousAov, previous.length),
            icon: "aov",
            label: "Panier moyen",
            value: currentPaid.length > 0 ? money(currentAov) : UNAVAILABLE,
          },
          {
            caption: "première commande cette semaine",
            deltaPct: pctChange(newCustomers.current, newCustomers.previous, previous.length),
            href: "/dashboard/customers",
            icon: "newCustomers",
            label: "Nouveaux clients",
            value: String(newCustomers.current),
          },
        ];

  const todos: TodoItem[] = [];
  if (bookings !== null) {
    const toConfirm = bookings.filter((b) => b.status === "pending").length;
    todos.push({ count: toConfirm, href: "/dashboard/bookings", icon: "booking", label: "Rendez-vous à confirmer" });
  }
  if (orders !== null) {
    todos.push({ count: pending, href: "/dashboard/orders?status=pending", icon: "order", label: "Commandes à confirmer" });
  }
  if (catalogue !== null) {
    todos.push({ count: catalogue.lowStock, href: "/dashboard/inventory", icon: "stock", label: "Produits à réapprovisionner" });
  }

  const cancelled = current.length - currentPaid.length;
  const snapshot: SnapshotItem[] = [
    {
      caption: catalogue ? `${catalogue.published} publié${catalogue.published > 1 ? "s" : ""}` : "Catalogue indisponible",
      href: "/dashboard/products",
      label: "Produits au catalogue",
      value: catalogue ? String(catalogue.total) : UNAVAILABLE,
    },
    {
      href: "/dashboard/inventory",
      label: "Valeur du stock",
      value: catalogue ? money(catalogue.stockValue) : UNAVAILABLE,
    },
    {
      // Below three orders the rate is a headline about the divisor.
      caption:
        orders === null
          ? "Commandes indisponibles"
          : current.length >= 3
            ? `${cancelled} annulée${cancelled > 1 ? "s" : ""} ou remboursée${cancelled > 1 ? "s" : ""} cette semaine`
            : "trop peu de commandes cette semaine",
      label: "Taux d'annulation",
      value: orders !== null && current.length >= 3 ? percent((cancelled / current.length) * 100) : UNAVAILABLE,
    },
  ];

  const month = lastDays(now, 30);
  const revenueByDay = dailyTotals(all.filter(isRevenueOrder), month, (o) => o.total);
  const revenueSeries: RevenuePoint[] = month.map((d, i) => ({ label: shortDate(d.toISOString()), revenue: revenueByDay[i] }));

  const counts = new Map<string, number>();
  for (const o of all) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
  const statusSeries: StatusSlice[] = ORDER_STATUS_OPTIONS.map((status) => ({
    count: counts.get(status) ?? 0,
    label: ORDER_STATUS_LABELS[status],
    status,
  })).filter((slice) => slice.count > 0);

  return {
    headline,
    recentOrders: orders === null ? null : orders.slice(0, 6),
    revenueSeries,
    snapshot,
    statusSeries,
    todos,
  };
}
