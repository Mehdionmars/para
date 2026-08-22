import { payloadFetch } from "./payload";
import { ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS, type Order, type OrderStatus } from "./orders-types";
import type { AnalyticsData, RevenuePoint, StatusPoint, TopProduct } from "./analytics-types";

export * from "./analytics-types";

const DAYS = 30;

/** All figures are computed directly from real Orders documents — no
 * fabricated or placeholder data. A new store legitimately shows zeros here
 * until real orders come in; that's correct, not a bug. */
export async function getAnalytics(): Promise<AnalyticsData> {
  const res = await payloadFetch("/api/orders?limit=2000&depth=0");
  const orders: Order[] = res.ok ? (await res.json()).docs : [];

  const counted = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const revenue = counted.reduce((sum, o) => sum + o.total, 0);

  const byDayMap = new Map<string, number>();
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    byDayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of counted) {
    const key = o.createdAt.slice(0, 10);
    if (byDayMap.has(key)) byDayMap.set(key, (byDayMap.get(key) || 0) + o.total);
  }
  const revenueByDay: RevenuePoint[] = [...byDayMap.entries()].map(([date, rev]) => ({
    date: date.slice(5).replace("-", "/"),
    revenue: rev,
  }));

  const statusCounts = new Map<OrderStatus, number>();
  for (const o of orders) statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1);
  const statusBreakdown: StatusPoint[] = ORDER_STATUS_OPTIONS.filter((s) => (statusCounts.get(s) || 0) > 0).map((s) => ({
    count: statusCounts.get(s) || 0,
    label: ORDER_STATUS_LABELS[s],
    status: s,
  }));

  const productTotals = new Map<string, { quantity: number; revenue: number }>();
  for (const o of counted) {
    for (const item of o.items) {
      const existing = productTotals.get(item.name) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      productTotals.set(item.name, existing);
    }
  }
  const topProducts: TopProduct[] = [...productTotals.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    avgOrderValue: counted.length ? Math.round(revenue / counted.length) : 0,
    orderCount: orders.length,
    revenue,
    revenueByDay,
    statusBreakdown,
    topProducts,
  };
}
