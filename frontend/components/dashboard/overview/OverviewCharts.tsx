"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_PROPS,
  CATEGORY_AXIS_PROPS,
  ChartEmpty,
  ChartTooltip,
  GRID_PROPS,
  SERIES,
} from "@/components/dashboard/charts/chartTheme";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/dashboard/format";
import { ORDER_STATUS_TONE } from "@/lib/dashboard/orderStatusTone";
import type { OrderStatus } from "@/lib/dashboard/orders-types";

export type RevenuePoint = { label: string; revenue: number };
/** `status` rather than a colour: the page stays serialisable and the tone
 * is resolved here, on the client, from the one shared map. */
export type StatusSlice = { label: string; count: number; status: OrderStatus };

/**
 * Revenue over the last thirty days.
 *
 * Thirty rather than the seven the KPI cards use: a card states this week's
 * figure, and a chart is where the shape of the month belongs. Seven points
 * is not a trend line, it is the same number the card above it already gave
 * you, drawn sideways.
 */
function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (!data.some((d) => d.revenue > 0)) {
    return <ChartEmpty label="Le graphique s'activera dès la première commande." height={260} />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="overview-revenue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Horizontal rules only: vertical ones at thirty points turn the
              plot into graph paper. */}
          <CartesianGrid {...GRID_PROPS} vertical={false} />

          {/* Every fifth day is labelled. Thirty date labels overlap into an
              unreadable smear at any width the card actually gets. */}
          <XAxis dataKey="label" {...AXIS_PROPS} interval={4} />
          <YAxis
            {...AXIS_PROPS}
            width={44}
            // Thousands, because a 30-day revenue axis in MAD runs to five
            // digits and the full number eats the plot's left edge.
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />

          <Tooltip
            content={<ChartTooltip format={money} />}
            // The default cursor is a filled grey band; a hairline is enough
            // to say which day is being read.
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenu"
            stroke={SERIES[0]}
            strokeWidth={2}
            fill="url(#overview-revenue)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Orders by status, as horizontal bars.
 *
 * Horizontal because the labels are French words of very uneven length ("En
 * préparation" against "Livrée") — vertical bars would either rotate them 45°
 * or truncate them. A donut was the other candidate and loses: eight slices
 * is past the point where anyone can compare two of them by angle.
 */
function StatusChart({ data }: { data: StatusSlice[] }) {
  if (data.length === 0) {
    return <ChartEmpty label="Aucune commande pour le moment." height={260} />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
          <YAxis type="category" dataKey="label" {...CATEGORY_AXIS_PROPS} width={104} />

          <Tooltip
            content={<ChartTooltip />}
            // A category cursor highlights the whole row; at 16px bars the
            // band is taller than the bar and reads as a selection.
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          />

          <Bar dataKey="count" name="Commandes" radius={[0, 4, 4, 0]} barSize={16}>
            {/* Coloured by status, not by position. These bars used to take
                SERIES[index % 5], which meant a bar's colour described where
                it happened to sort — so "Livrée" was emerald in the calendar
                below and an arbitrary fourth-series violet here. Now both
                read the same token. */}
            {data.map((slice) => (
              <Cell key={slice.status} fill={ORDER_STATUS_TONE[slice.status].cssVar} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * The overview's chart row.
 *
 * Two thirds / one third at `lg`, stacked below it. The revenue trend is the
 * thing being read and gets the width; the status breakdown is a reference
 * list that happens to be drawn as bars and does not need it.
 */
export function OverviewCharts({
  revenue,
  statuses,
}: {
  revenue: RevenuePoint[];
  statuses: StatusSlice[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Card className="gap-4 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Chiffre d&apos;affaires</CardTitle>
          <CardDescription>30 derniers jours, commandes encaissées</CardDescription>
        </CardHeader>
        {/* The chart sits outside CardContent's padding on the left so the
            Y-axis labels align with the card's own text, not 24px inside it. */}
        <div className="px-2 pb-2 sm:px-4">
          <RevenueChart data={revenue} />
        </div>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base">Commandes par statut</CardTitle>
          <CardDescription>Sur l&apos;ensemble des commandes chargées</CardDescription>
        </CardHeader>
        <div className="px-2 pb-2 sm:px-4">
          <StatusChart data={statuses} />
        </div>
      </Card>
    </div>
  );
}
