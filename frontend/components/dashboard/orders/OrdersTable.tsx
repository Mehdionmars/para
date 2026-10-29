"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/dashboard/orders-types";

/** Exact to the centime: an order total is an amount owed, not a trend. */
const money = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;
const dateFmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

/**
 * The orders list, filtered in place by text and status.
 *
 * Status badges read ORDER_STATUS_BADGE, the map the overview and the order
 * page use. This table had its own copy, in which "En attente" was the filled
 * primary badge and "Confirmée" green — so the same order changed colour
 * between the list and the page it opened.
 *
 * Below `md` the six columns become one tappable row per order; the table
 * itself scrolls inside its frame if it must, never the page.
 */
export function OrdersTable({ orders, initialStatus }: { orders: Order[]; initialStatus?: OrderStatus }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(initialStatus ?? "all");

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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="N° de commande, client, email…"
            aria-label="Rechercher une commande"
            className="h-10 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:h-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:h-9 sm:flex-none"
        >
          <option value="all">Tous les statuts</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {rows.length} commande{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="min-w-0 rounded-xl border border-border bg-card shadow-xs">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {orders.length === 0 ? "Aucune commande pour le moment." : "Aucune commande ne correspond à ces filtres."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {rows.map((o) => (
                <li key={o.id}>
                  <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
                        {o.orderNumber}
                        <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {o.customerName} · {dateFmt(o.createdAt)} · {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                      </p>
                    </div>
                    <span className="flex-none text-sm font-semibold tabular-nums text-foreground">{money(o.total)}</span>
                    <ChevronRight className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Commande", "Client", "Total", "Statut", "Paiement", "Date"].map((h) => (
                      <th key={h} scope="col" className={`px-4 py-3 text-xs font-medium text-muted-foreground ${h === "Total" ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-primary hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3">
                        <div className="truncate text-foreground">{o.customerName}</div>
                        <div className="truncate text-xs text-muted-foreground">{o.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums text-foreground">{money(o.total)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={o.paymentStatus === "paid" ? "success" : "outline"}>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{dateFmt(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
