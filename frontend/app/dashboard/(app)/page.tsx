import { TriangleAlert } from "lucide-react";
import { StatsRow, type Stat } from "@/components/dashboard/stats/StatsRow";
import { OrdersCalendar, type CalendarOrder } from "@/components/dashboard/overview/OrdersCalendar";
import { OverviewTabs, type RecentProduct } from "@/components/dashboard/overview/OverviewTabs";
import { listRecentCoupons, type Coupon } from "@/lib/dashboard/coupons";
import { money } from "@/lib/dashboard/format";
import { payloadFetch } from "@/lib/dashboard/payload";
import type { Product } from "@/lib/dashboard/products-types";

type ProductStats = { total: number; lowStock: number; published: number; catalogValue: number };
type OrderStats = { count: number; revenue: number; pending: number };

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
 * One fetch, three jobs: the KPI cards, the calendar grid and the recent list
 * all read from this array. Loading it once is also what bounds the calendar —
 * it can only show months contained in the newest 1 000 orders, which at the
 * current volume is comfortably more than a year.
 */
async function getOrders(): Promise<CalendarOrder[]> {
  const res = await payloadFetch(
    "/api/orders?limit=1000&depth=0&sort=-createdAt&select[orderNumber]=true&select[customerName]=true&select[total]=true&select[status]=true&select[createdAt]=true",
  );
  if (!res.ok) throw new Error("Impossible de charger les commandes.");
  const { docs } = (await res.json()) as { docs: CalendarOrder[] };
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
    imageUrl: typeof p.image === "object" && p.image?.url ? p.image.url : null,
    price: p.price,
    stock: p.stock,
    isPublished: p.isPublished,
    createdAt: p.createdAt,
  }));
}

/**
 * Change over the last seven days against the seven before them.
 *
 * Returns null rather than a number whenever the comparison would be
 * meaningless — no orders in the earlier window means there is no percentage
 * to compute, and "+100%" against zero is a sentence about arithmetic, not
 * about the shop. The card then renders without a badge, which is the honest
 * answer to "how does this compare".
 */
function weekOverWeek(orders: CalendarOrder[], value: (o: CalendarOrder) => number): number | null {
  const DAY = 86_400_000;
  const now = Date.now();
  let current = 0;
  let previous = 0;
  let previousOrders = 0;

  for (const o of orders) {
    const age = now - new Date(o.createdAt).getTime();
    if (age < 0) continue;
    if (age < 7 * DAY) current += value(o);
    else if (age < 14 * DAY) {
      previous += value(o);
      previousOrders++;
    }
  }

  // A base of one or two orders turns any movement into a four-digit
  // percentage that says more about the divisor than about the shop. Below
  // this, the honest answer is no trend rather than a dramatic one.
  if (previous === 0 || previousOrders < 3) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * The block's badge, coloured by direction, using its own two tints.
 *
 * Clamped for display at three digits. A genuine +1 819% — one seeded burst
 * against a quiet week — is arithmetically true and completely unreadable in
 * a pill this size; ">+999%" says the same thing without pretending the exact
 * figure is the point.
 */
function trendBadge(pct: number | null): Pick<Stat, "statusValue" | "badgeColor"> {
  if (pct === null) return {};
  const rounded = Math.round(pct);
  const sign = rounded >= 0 ? "+" : "-";
  const magnitude = Math.abs(rounded);
  return {
    statusValue: magnitude > 999 ? `>${sign}999%` : `${sign}${magnitude}%`,
    badgeColor: rounded >= 0 ? "bg-teal-400/10" : "bg-orange-400/10",
  };
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

  const allOrders: CalendarOrder[] | null = orders.status === "fulfilled" ? orders.value : null;
  const recent: RecentProduct[] | null = recentProducts.status === "fulfilled" ? recentProducts.value : null;
  const couponList: Coupon[] | null = coupons.status === "fulfilled" ? coupons.value : null;

  const orderStats: OrderStats = {
    count: allOrders?.length ?? 0,
    pending: allOrders?.filter((o) => o.status === "pending").length ?? 0,
    revenue:
      allOrders
        ?.filter((o) => o.status !== "cancelled" && o.status !== "refunded")
        .reduce((s, o) => s + o.total, 0) ?? 0,
  };

  const revenueTrend = allOrders
    ? weekOverWeek(
        allOrders.filter((o) => o.status !== "cancelled" && o.status !== "refunded"),
        (o) => o.total,
      )
    : null;
  const countTrend = allOrders ? weekOverWeek(allOrders, () => 1) : null;

  // Only the two order-backed cards carry a badge: the catalogue has no
  // history in this query, so there is nothing to compare a product count
  // against. Their small print keeps the figures the cards showed before.
  const stats: Stat[] = [
    {
      title: "Chiffre d'affaires",
      subtitle: money(orderStats.revenue),
      icon: "revenue",
      caption: "7 derniers jours",
      ...trendBadge(revenueTrend),
    },
    {
      title: "Commandes",
      subtitle: String(orderStats.count),
      icon: "orders",
      caption: orderStats.pending > 0 ? `${orderStats.pending} en attente` : "7 derniers jours",
      ...trendBadge(countTrend),
    },
    {
      title: "Produits au catalogue",
      subtitle: String(products.total),
      icon: "package",
      caption: `${products.published} publiés`,
    },
    {
      title: "Stock faible",
      subtitle: String(products.lowStock),
      icon: "lowStock",
      caption: `valeur stock ${money(products.catalogValue)}`,
    },
  ];


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-gray-500">Para d&apos;Hiver — catalogue et commandes.</p>
      </div>

      {allOrders === null && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <TriangleAlert className="h-4 w-4 flex-none" aria-hidden="true" />
          Les commandes n&apos;ont pas pu être chargées : le chiffre d&apos;affaires et le calendrier sont
          incomplets.
        </p>
      )}

      <StatsRow stats={stats} />

      <OrdersCalendar orders={allOrders ?? []} />

      <OverviewTabs products={recent} orders={allOrders?.slice(0, 6) ?? null} coupons={couponList} />
    </div>
  );
}
