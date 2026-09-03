"use client";

import {
  CalendarClock,
  CalendarX,
  Package,
  Repeat,
  ShoppingCart,
  TicketPercent,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import Statistic, { type StatisticItem } from "@/components/shadcn-space/blocks/statistics-02/statistics";

/**
 * Icons resolved here, by name, rather than passed down from the page.
 *
 * A Lucide icon is a function component, and functions do not survive the
 * server/client boundary — handing `cardIcon: TrendingUp` to the block from a
 * Server Component throws "Functions cannot be passed directly to Client
 * Components". Pages therefore send a string, and this module, which is
 * already on the client, turns it back into a component.
 */
const ICONS = {
  revenue: TrendingUp,
  orders: ShoppingCart,
  package: Package,
  lowStock: TriangleAlert,
  coupon: TicketPercent,
  usage: Repeat,
  scheduled: CalendarClock,
  expired: CalendarX,
} satisfies Record<string, LucideIcon>;

export type StatIcon = keyof typeof ICONS;

/** Everything a page sends is a plain, serialisable value. */
export type Stat = Omit<StatisticItem, "cardIcon"> & { icon: StatIcon };

export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <Statistic items={stats.map(({ icon, ...rest }) => ({ ...rest, cardIcon: ICONS[icon] }))} />
  );
}
