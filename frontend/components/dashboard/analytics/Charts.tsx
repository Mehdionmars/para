"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import type { RevenuePoint, StatusPoint } from "@/lib/dashboard/analytics-types";
import { money } from "@/lib/dashboard/format";

/**
 * The analytics charts, on the shared token theme.
 *
 * They used to carry their own literals — `VIOLET = "#7c3aed"`, a `#f1f1f4`
 * grid, `#9ca3af` ticks, `#374151` category labels — which is why this file
 * changed when the dashboard gained a dark mode: on a near-black card those
 * ticks were all but invisible and the light grid lines glowed. The values
 * now come from chartTheme, which reads them from CSS variables, so both
 * themes are correct without this file knowing which is active.
 *
 * The revenue formatter also went through `money` rather than its own inline
 * `toLocaleString(...) + " MAD"`, which rounded differently from every other
 * currency figure in the admin.
 */

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (!data.some((d) => d.revenue > 0)) {
    return <ChartEmpty label="Le graphique s'activera dès la première commande." height={260} />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="date" {...AXIS_PROPS} interval={4} />
          <YAxis
            {...AXIS_PROPS}
            width={44}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            content={<ChartTooltip format={money} />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenu"
            stroke={SERIES[0]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusChart({ data }: { data: StatusPoint[] }) {
  if (data.length === 0) {
    return <ChartEmpty label="Aucune commande pour le moment." />;
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} />
          <YAxis type="category" dataKey="label" {...CATEGORY_AXIS_PROPS} width={104} />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          />
          <Bar dataKey="count" name="Commandes" radius={[0, 4, 4, 0]} barSize={16}>
            {/* Matching the overview's status chart, so the same status is the
                same colour on both screens. */}
            {data.map((slice, index) => (
              <Cell key={slice.label} fill={SERIES[index % SERIES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
