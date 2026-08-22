"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint, StatusPoint } from "@/lib/dashboard/analytics-types";

const VIOLET = "#7c3aed";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasData = data.some((d) => d.revenue > 0);
  if (!hasData) {
    return <EmptyState label="Le graphique s'activera dès la première commande." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f4" />
        <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`, "Revenu"]}
          contentStyle={{ border: "1px solid #f1f1f4", borderRadius: 10, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="revenue" stroke={VIOLET} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusChart({ data }: { data: StatusPoint[] }) {
  if (data.length === 0) {
    return <EmptyState label="Aucune commande pour le moment." />;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
        <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={{ fill: "#374151", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
        <Tooltip contentStyle={{ border: "1px solid #f1f1f4", borderRadius: 10, fontSize: 12 }} />
        <Bar dataKey="count" fill={VIOLET} radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">{label}</div>;
}
