import { ArrowRight, ShoppingCart, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrdersCalendar, type CalendarOrder } from "@/components/dashboard/overview/OrdersCalendar";
import {
  OverviewCharts,
  type RevenuePoint,
  type StatusSlice,
} from "@/components/dashboard/overview/OverviewCharts";
import { OverviewTabs, type RecentProduct } from "@/components/dashboard/overview/OverviewTabs";
import { StatsRow, type Kpi } from "@/components/dashboard/stats/StatsRow";
import { listRecentCoupons, type Coupon } from "@/lib/dashboard/coupons";
import { dayKey, money, shortDate } from "@/lib/dashboard/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS } from "@/lib/dashboard/orders-types";
import { payloadFetch } from "@/lib/dashboard/payload";
import { mediaSrc } from "@/lib/mediaSrc";
import type { Product } from "@/lib/dashboard/products-types";

type ProductStats = { total: number; lowStock: number; published: number; catalogValue: number };

/** The calendar's row plus the email, which the customer metrics need. */
type OverviewOrder = CalendarOrder & { customerEmail?: string | null };

const DAY = 86_400_000;

async function getProductStats(): Promise<ProductStats> {
  // `select` keeps this to the four numbers the cards need. Without it the
  // same 1 000 rows arrive carrying every description and image URL in the
  // catalogue, to compute four integers.
  const res = await payloadFetch(
    "/api/products?limit=1000&depth=0&select[price]=true&select[stock]=true&select[lowStockThreshold]=true&select[isPublished]=true",
  );
  if (!res.ok) return { total: 0, lowStock: 0, published: 0, catalogValue: 0 };

  const { docs } = (await res.json()) as {
    docs: { price: number; stock: number; lowStockThreshold: number; isPublished: boolean }[];
  };

  return {
    catalogValue: docs.reduce((sum, p) => sum + p.price * (p.stock || 0), 0),
    lowStock: docs.filter((p) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length,
    published: docs.filter((p) => p.isPublished).length,
    total: docs.length,
  };
}

/**
 * One fetch, four jobs: the KPI cards, the sparklines, the calendar grid and
 * the recent list all read from this array. Loading it once is also what
 * bounds the calendar — it can only show months contained in the newest
 * 1 000 orders, which at the current volume is comfortably more than a year.
 *
 * customerEmail joined the `select` for the new-customers card. It is the
 * identity the storefront actually collects at checkout; customerName is not
 * unique and not stable across two orders from the same person.
 */
async function getOrders(): Promise<OverviewOrder[]> {
  const res = await payloadFetch(
    "/api/orders?limit=1000&depth=0&sort=-createdAt&select[orderNumber]=true&select[customerName]=true&select[customerEmail]=true&select[total]=true&select[status]=true&select[createdAt]=true",
  );
  if (!res.ok) throw new Error("Impossible de charger les commandes.");
  const { docs } = (await res.json()) as { docs: OverviewOrder[] };
  return docs;
}

async function getRecentProducts(): Promise<RecentProduct[]> {
  // depth=1 so the image relation resolves to a URL. Only six rows, so the
  // cost of populating them is trivial — unlike doing it for the stats query.
  const res = await payloadFetch("/api/products?limit=6&depth=1&sort=-createdAt");
  if (!res.ok) throw new Error("Impossible de charger les produits.");
  const { docs } = (await res.json()) as { docs: Product[] };

  return docs.map((p) => ({
    id: p.id,
    name: p.name,
    // Through mediaSrc, not raw. Payload reports its own uploads as
    // /api/media/file/<name>, which is a path on the CMS (:3001) — handing it
    // to next/image resolves it against the dashboard (:3000), where no such
    // route exists, and every thumbnail 404s while the row around it renders
    // perfectly. mediaSrc rewrites it onto the /api/cms-media proxy so media
    // stays same-origin. ProductsTable and lib/dashboard/orders already did
    // this; this call site was the one that did not.
    imageUrl: typeof p.image === "object" && p.image?.url ? mediaSrc(p.image.url) || null : null,
    price: p.price,
    stock: p.stock,
    isPublished: p.isPublished,
    createdAt: p.createdAt,
  }));
}

/** Cancelled and refunded orders are money that did not arrive. */
function isRevenueOrder(o: OverviewOrder) {
  return o.status !== "cancelled" && o.status !== "refunded";
}

/**
 * The last seven days, and the seven before them.
 *
 * Split once and reused by every card, rather than each metric walking the
 * full array with its own age arithmetic — which is what the previous
 * `weekOverWeek(orders, value)` helper did, one pass per KPI.
 */
function splitWindows(orders: OverviewOrder[]) {
  const now = Date.now();
  const current: OverviewOrder[] = [];
  const previous: OverviewOrder[] = [];

  for (const o of orders) {
    const age = now - new Date(o.createdAt).getTime();
    // Future-dated rows are seed data or clock skew, not sales.
    if (age < 0) continue;
    if (age < 7 * DAY) current.push(o);
    else if (age < 14 * DAY) previous.push(o);
  }

  return { current, previous };
}

/**
 * Relative change, or null when the comparison would be meaningless.
 *
 * Two guards, both inherited from the version of this that lived inline:
 * there is no percentage to compute against a previous value of zero, and a
 * base of one or two orders turns any movement into a four-digit percentage
 * that says more about the divisor than about the shop. Below that, the
 * honest answer is no trend rather than a dramatic one — the card then
 * renders without a badge.
 */
function pctChange(current: number, previous: number, previousSample: number): number | null {
  if (previous === 0 || previousSample < 3) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Seven daily totals, oldest first, for a sparkline.
 *
 * Bucketed through dayKey rather than the ISO string's date substring:
 * orders arrive as UTC, and slicing the string files a 01:30 Casablanca
 * order under the previous day.
 */
function dailySeries(orders: OverviewOrder[], value: (o: OverviewOrder) => number): number[] {
  const today = new Date();
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
  }

  const totals = new Map(keys.map((k) => [k, 0]));
  for (const o of orders) {
    const key = dayKey(new Date(o.createdAt));
    const running = totals.get(key);
    // Anything outside the seven days is simply not in the map.
    if (running !== undefined) totals.set(key, running + value(o));
  }

  return keys.map((k) => totals.get(k) ?? 0);
}

/**
 * Daily revenue for the chart, labelled and oldest-first.
 *
 * Shares dayKey with the sparklines for the same timezone reason, but keeps
 * its own loop: this one needs a human label per point, and threading a
 * formatter through dailySeries to serve one caller would make the simpler
 * function harder to read than both are apart.
 */
function revenueByDay(orders: OverviewOrder[], days: number): RevenuePoint[] {
  const today = new Date();
  const slots: { key: string; label: string }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    slots.push({ key: dayKey(d), label: shortDate(d.toISOString()) });
  }

  const totals = new Map(slots.map((s) => [s.key, 0]));
  for (const o of orders) {
    const key = dayKey(new Date(o.createdAt));
    const running = totals.get(key);
    if (running !== undefined) totals.set(key, running + o.total);
  }

  return slots.map((s) => ({ label: s.label, revenue: totals.get(s.key) ?? 0 }));
}

/**
 * Order counts per status, in the lifecycle's own order.
 *
 * Statuses with no orders are dropped rather than drawn as zero-length bars:
 * a shop that has never had a return should not have "Retournée" taking up a
 * row. ORDER_STATUS_OPTIONS drives the sequence so the chart reads
 * pending -> delivered top to bottom instead of alphabetically.
 */
function ordersByStatus(orders: OverviewOrder[]): StatusSlice[] {
  const counts = new Map<string, number>();
  for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);

  return ORDER_STATUS_OPTIONS.map((status) => ({
    label: ORDER_STATUS_LABELS[status],
    count: counts.get(status) ?? 0,
    status,
  })).filter((slice) => slice.count > 0);
}

/**
 * How many distinct customers placed a first order in each window.
 *
 * Bounded by the 1 000 orders fetched, and that bound is the one caveat
 * worth stating: a customer whose genuine first order predates the window
 * counts as new the next time they buy. At current volume the window spans
 * well over a year, so the error is small — but it is the reason this card
 * says "nouveaux clients" and not a number the accounts should rely on.
 */
function countNewCustomers(orders: OverviewOrder[]): { current: number; previous: number } {
  const earliest = new Map<string, number>();

  for (const o of orders) {
    const email = o.customerEmail?.trim().toLowerCase();
    // Guest checkouts without an email cannot be attributed to a person.
    if (!email) continue;
    const at = new Date(o.createdAt).getTime();
    const seen = earliest.get(email);
    if (seen === undefined || at < seen) earliest.set(email, at);
  }

  // Date.now() is read here rather than in the component body: the purity
  // rule (react-hooks/purity) rejects an impure call inside a component, and
  // it is right to — this page is a Server Component today, but the windowing
  // belongs with the bucketing either way.
  const now = Date.now();
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

/** e.g. "4,2 %" — one decimal, French separator. */
function percent(n: number): string {
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export default async function DashboardOverviewPage() {
  // allSettled, not all: the page draws from three collections, and one of
  // them being unreachable should cost that panel and nothing else. A rejected
  // list is passed on as null so the panel says it could not load, rather than
  // rendering empty and reading as "nothing here yet".
  const [productStats, orders, recentProducts, coupons] = await Promise.allSettled([
    getProductStats(),
    getOrders(),
    getRecentProducts(),
    listRecentCoupons(6),
  ]);

  const products: ProductStats =
    productStats.status === "fulfilled" ? productStats.value : { total: 0, lowStock: 0, published: 0, catalogValue: 0 };

  const allOrders: OverviewOrder[] | null = orders.status === "fulfilled" ? orders.value : null;
  const recent: RecentProduct[] | null = recentProducts.status === "fulfilled" ? recentProducts.value : null;
  const couponList: Coupon[] | null = coupons.status === "fulfilled" ? coupons.value : null;

  const { current, previous } = splitWindows(allOrders ?? []);

  const currentRevenue = current.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);
  const previousRevenue = previous.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);
  const totalRevenue = (allOrders ?? []).filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);

  const currentPaid = current.filter(isRevenueOrder).length;
  const previousPaid = previous.filter(isRevenueOrder).length;

  // Average order value, over orders that actually produced revenue —
  // dividing by cancelled orders too would understate every basket.
  const currentAov = currentPaid > 0 ? currentRevenue / currentPaid : 0;
  const previousAov = previousPaid > 0 ? previousRevenue / previousPaid : 0;

  const cancelledNow = current.filter((o) => !isRevenueOrder(o)).length;
  const cancelledBefore = previous.filter((o) => !isRevenueOrder(o)).length;
  const currentCancelRate = current.length > 0 ? (cancelledNow / current.length) * 100 : 0;
  const previousCancelRate = previous.length > 0 ? (cancelledBefore / previous.length) * 100 : 0;

  const { current: newCustomersNow, previous: newCustomersBefore } = countNewCustomers(allOrders ?? []);

  const pending = current.filter((o) => o.status === "pending").length;

  // Both charts read the full loaded window, not the 7-day slice: the point
  // of a chart here is the context the cards cannot show.
  const revenueSeries = revenueByDay((allOrders ?? []).filter(isRevenueOrder), 30);
  const statusSeries = ordersByStatus(allOrders ?? []);

  /**
   * The headline four: what the shop earned, how many orders produced it,
   * what a basket is worth, and how many people are new.
   *
   * All four are genuinely seven-day figures. The revenue card previously
   * showed the sum of every order in the 1 000-row window under a caption
   * reading "7 derniers jours", with a week-over-week badge beside it —
   * three different periods in one card. The total is still here, in the
   * caption, where it does not pretend to be the trend.
   */
  const headline: Kpi[] = [
    {
      label: "Chiffre d'affaires",
      value: money(currentRevenue),
      icon: "revenue",
      caption: `${money(totalRevenue)} au total`,
      href: "/dashboard/analytics",
      deltaPct: pctChange(currentRevenue, previousRevenue, previous.length),
      spark: dailySeries(current.filter(isRevenueOrder), (o) => o.total),
    },
    {
      label: "Commandes",
      value: String(current.length),
      icon: "orders",
      caption: pending > 0 ? `${pending} en attente` : "aucune en attente",
      href: "/dashboard/orders",
      deltaPct: pctChange(current.length, previous.length, previous.length),
      spark: dailySeries(current, () => 1),
    },
    {
      label: "Panier moyen",
      value: money(currentAov),
      icon: "aov",
      caption: `sur ${currentPaid} commande${currentPaid === 1 ? "" : "s"} encaissée${currentPaid === 1 ? "" : "s"}`,
      deltaPct: pctChange(currentAov, previousAov, previous.length),
    },
    {
      label: "Nouveaux clients",
      value: String(newCustomersNow),
      icon: "newCustomers",
      caption: "première commande cette semaine",
      href: "/dashboard/customers",
      // The sample is the number of orders the previous week, as on every
      // other card — passing the previous *count* of new customers measured
      // the guard against a different thing on one of the four headlines.
      deltaPct: pctChange(newCustomersNow, newCustomersBefore, previous.length),
    },
  ];

  /**
   * The operational three, in a slimmer row: state of the catalogue rather
   * than the week's trade. No sparklines — the stats query returns a snapshot
   * with no history to plot, and a flat line would imply one.
   */
  const operations: Kpi[] = [
    {
      label: "Produits au catalogue",
      value: String(products.total),
      icon: "package",
      caption: `${products.published} publié${products.published === 1 ? "" : "s"}`,
      href: "/dashboard/products",
    },
    {
      label: "Stock faible",
      value: String(products.lowStock),
      icon: "lowStock",
      caption: `valeur stock ${money(products.catalogValue)}`,
      href: "/dashboard/inventory",
    },
    {
      // Below three orders the rate is a headline about the divisor: one
      // cancellation out of three prints "33,3 %" as the largest text on the
      // card. The same floor the trend badge already applies, applied to the
      // figure itself.
      label: "Taux d'annulation",
      value: current.length >= 3 ? percent(currentCancelRate) : "—",
      icon: "cancelled",
      caption:
        current.length >= 3
          ? `${cancelledNow} annulée${cancelledNow === 1 ? "" : "s"} ou remboursée${cancelledNow === 1 ? "" : "s"}`
          : "trop peu de commandes cette semaine",
      deltaPct: pctChange(currentCancelRate, previousCancelRate, previous.length),
      // A rising cancellation rate is bad news; without this the badge would
      // be green for the one metric where up is the wrong direction.
      invertDelta: true,
    },
  ];

  return (
    // gap-8 between sections, against gap-3 inside a block below. The page
    // used to be a flat `gap-6` stack of six equal siblings — the rhythm
    // failure layout work names first: one interval repeated until the KPI
    // block, the charts, the calendar and the lists all carry the same
    // weight, so nothing groups and nothing leads.
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Vue d'ensemble"
        description="Para d'Hiver — les sept derniers jours, comparés aux sept précédents."
      />

      {allOrders === null && (
        <p className="flex items-center gap-2 rounded-xl border border-warning/25 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          <TriangleAlert className="size-4 flex-none" aria-hidden="true" />
          Les commandes n&apos;ont pas pu être chargées : le chiffre d&apos;affaires et le calendrier sont
          incomplets.
        </p>
      )}

      {/* The worklist, above the figures: the two numbers that ask for an
          action, as rows that open the list behind them. Hidden entirely when
          there is nothing to do, so an empty counter never reads as a task. */}
      {(pending > 0 || products.lowStock > 0) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {pending > 0 && (
            <Link
              href="/dashboard/orders"
              className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-xs transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-2 text-foreground">
                <ShoppingCart className="size-4 text-muted-foreground" aria-hidden="true" />
                <strong className="font-semibold tabular-nums">{pending}</strong>
                commande{pending === 1 ? "" : "s"} à préparer
              </span>
              <ArrowRight className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
            </Link>
          )}
          {products.lowStock > 0 && (
            <Link
              href="/dashboard/inventory"
              className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-xs transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-2 text-foreground">
                <TriangleAlert className="size-4 text-warning" aria-hidden="true" />
                <strong className="font-semibold tabular-nums">{products.lowStock}</strong>
                produit{products.lowStock === 1 ? "" : "s"} à réapprovisionner
              </span>
              <ArrowRight className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {/* One block, not two sections. Seven cards of the same kind, split
          4+3 by importance — 12px apart so they read as one field of
          figures, with the 32px stack gap separating them from the charts. */}
      <div className="flex flex-col gap-3">
        <StatsRow stats={headline} columns={4} />
        <StatsRow stats={operations} columns={3} />
      </div>

      <OverviewCharts revenue={revenueSeries} statuses={statusSeries} />

      <OrdersCalendar orders={allOrders ?? []} />

      <OverviewTabs products={recent} orders={allOrders?.slice(0, 6) ?? null} coupons={couponList} />
    </div>
  );
}
