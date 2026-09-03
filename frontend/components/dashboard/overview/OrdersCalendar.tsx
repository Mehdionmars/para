"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/ui/Badge";
import { cn } from "@/lib/dashboard/cn";
import { dayKey, longDate, money } from "@/lib/dashboard/format";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_DOT,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  type OrderStatus,
} from "@/lib/dashboard/orders-types";

export type CalendarOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Monday-first index, because the grid is French and getDay() starts Sunday. */
function weekdayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

/**
 * The month of commercial activity at a glance: one dot per order, coloured by
 * status, on the day it was placed.
 *
 * The status filter is what makes it more than decoration — narrowing to
 * "En attente" turns the grid into a worklist. Filtering hides dots rather
 * than re-flowing the grid, so the shape of a busy week stays where the eye
 * last saw it.
 *
 * Everything is derived from the orders already fetched for the page, so the
 * month arrows cost nothing. A month outside the loaded window shows an empty
 * grid rather than a spinner that never resolves; how far back that reaches is
 * the caller's decision.
 */
export function OrdersCalendar({ orders }: { orders: CalendarOrder[] }) {
  const today = new Date();
  // Opens on the month of the most recent order rather than on today. A shop
  // whose last order was in August should not be greeted, on 1 September, by
  // an empty grid that looks like a broken calendar; "Aujourd'hui" is right
  // there for going back. Orders arrive newest-first, so [0] is the latest.
  const [cursor, setCursor] = useState(() => {
    const latest = orders[0]?.createdAt;
    const base = latest ? new Date(latest) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const visible = useMemo(
    () => (status === "all" ? orders : orders.filter((o) => o.status === status)),
    [orders, status],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarOrder[]>();
    for (const o of visible) {
      const key = dayKey(new Date(o.createdAt));
      const list = map.get(key);
      if (list) list.push(o);
      else map.set(key, [o]);
    }
    return map;
  }, [visible]);

  // Only statuses that actually occur, so the filter never offers a row that
  // can only ever come back empty.
  const present = useMemo(() => {
    const seen = new Set(orders.map((o) => o.status));
    return ORDER_STATUS_OPTIONS.filter((s) => seen.has(s));
  }, [orders]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const leading = weekdayIndex(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((leading + daysInMonth) / 7) * 7;

  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const selectedOrders = selected ? (byDay.get(selected) ?? []) : [];
  // A seeded or genuinely busy day can hold hundreds of orders, and rendering
  // them all pushed the panels below off the screen entirely. The day list is
  // a peek, not the orders table — past this, that is where to go.
  const DAY_PREVIEW = 12;
  const dayOverflow = selectedOrders.length - DAY_PREVIEW;

  const monthTotal = useMemo(() => {
    let n = 0;
    for (let d = 1; d <= daysInMonth; d++) n += byDay.get(dayKey(new Date(year, month, d)))?.length ?? 0;
    return n;
  }, [byDay, daysInMonth, month, year]);

  function shiftMonth(by: number) {
    setCursor(new Date(year, month + by, 1));
    setSelected(null);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Calendrier des commandes</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {monthTotal} commande{monthTotal > 1 ? "s" : ""} sur ce mois
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-medium capitalize text-gray-900" aria-live="polite">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mois suivant"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(null);
            }}
            className="ml-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-5 py-3">
        <FilterChip active={status === "all"} onClick={() => setStatus("all")} label="Tous" />
        {present.map((s) => (
          <FilterChip
            key={s}
            active={status === s}
            onClick={() => setStatus(s)}
            label={ORDER_STATUS_LABELS[s]}
            dot={ORDER_STATUS_DOT[s]}
          />
        ))}
      </div>

      <div className="px-3 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400">
              {d}
            </div>
          ))}

          {Array.from({ length: cells }, (_, i) => {
            const dayNumber = i - leading + 1;
            if (dayNumber < 1 || dayNumber > daysInMonth) return <div key={i} />;

            const date = new Date(year, month, dayNumber);
            const key = dayKey(date);
            const dayOrders = byDay.get(key) ?? [];
            const isToday = key === dayKey(today);
            const isSelected = key === selected;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(isSelected ? null : key)}
                aria-pressed={isSelected}
                aria-label={`${longDate(date)} — ${dayOrders.length} commande(s)`}
                className={cn(
                  "flex min-h-[3.75rem] flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                  isSelected
                    ? "border-violet-300 bg-violet-50"
                    : "border-transparent hover:border-gray-200 hover:bg-gray-50",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    isToday ? "bg-violet-600 font-semibold text-white" : "text-gray-600",
                  )}
                >
                  {dayNumber}
                </span>

                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {dayOrders.slice(0, 4).map((o) => (
                    <span key={o.id} className={cn("h-1.5 w-1.5 rounded-full", ORDER_STATUS_DOT[o.status])} />
                  ))}
                  {dayOrders.length > 4 && (
                    <span className="text-[10px] font-medium leading-none text-gray-400">
                      +{dayOrders.length - 4}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="border-t border-gray-100 px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {longDate(new Date(year, month, Number(selected.split("-")[2])))}
          </h3>
          {selectedOrders.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Aucune commande ce jour-là.</p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y divide-gray-50">
              {selectedOrders.slice(0, DAY_PREVIEW).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm hover:text-violet-700"
                  >
                    <span className="font-medium text-gray-900">#{o.orderNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-gray-500">{o.customerName}</span>
                    <span className="font-medium text-gray-900">{money(o.total)}</span>
                    <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {dayOverflow > 0 && (
            <Link
              href="/dashboard/orders"
              className="mt-2 inline-block text-sm font-medium text-violet-700 hover:underline"
            >
              + {dayOverflow} autre{dayOverflow > 1 ? "s" : ""} — voir toutes les commandes
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
        active ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:bg-gray-50",
      )}
    >
      {dot && <span className={cn("h-2 w-2 rounded-full", dot)} />}
      {label}
    </button>
  );
}
