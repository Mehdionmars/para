"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/ui/Badge";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/dashboard/orders-types";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}

const STATUS_VARIANT: Record<OrderStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  cancelled: "danger",
  confirmed: "success",
  delivered: "success",
  pending: "default",
  preparing: "info",
  refunded: "warning",
  returned: "warning",
  shipped: "info",
};

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q);
    });
  }, [orders, query, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="N° de commande, client…"
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-violet-300"
        >
          <option value="all">Tous les statuts</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{rows.length} commande(s)</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Commande", "Client", "Total", "Statut", "Paiement", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-violet-700 hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-900">{o.customerName}</div>
                  <div className="text-xs text-gray-500">{o.customerEmail}</div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{money(o.total)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={o.paymentStatus === "paid" ? "success" : "default"}>
                    {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  Aucune commande ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
