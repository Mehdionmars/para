import type { OrderStatus } from "./orders-types";

export type RevenuePoint = { date: string; revenue: number };
export type StatusPoint = { status: OrderStatus; label: string; count: number };
export type TopProduct = { name: string; quantity: number; revenue: number };

export type AnalyticsData = {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  revenueByDay: RevenuePoint[];
  statusBreakdown: StatusPoint[];
  topProducts: TopProduct[];
};
