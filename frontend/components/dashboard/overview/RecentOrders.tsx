import { ArrowRight, ChevronRight, PackageOpen, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { money, shortDate } from "@/lib/dashboard/format";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from "@/lib/dashboard/orders-types";
import type { RecentOrder } from "./OverviewTabs";

/**
 * The latest orders on the dashboard home.
 *
 * A table from `sm` up — reference, customer, date, amount, status — and a
 * two-line list below it, where six columns would have to shrink until none
 * of them is readable. Both rows open the order. The table scrolls inside its
 * own frame if it ever has to, never the page.
 *
 * `null` means the orders could not be loaded and says so, rather than
 * drawing an empty list that reads as "no orders yet".
 */
export function RecentOrders({ orders }: { orders: RecentOrder[] | null }) {
  return (
    <section aria-labelledby="recent-orders-title" className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card shadow-xs">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <h2 id="recent-orders-title" className="text-base font-semibold text-foreground">
          Dernières commandes
        </h2>
        <Link
          href="/dashboard/orders"
          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="sm:hidden">Tout voir</span>
          <span className="hidden sm:inline">Toutes les commandes</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </header>

      {orders === null ? (
        <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
          <TriangleAlert className="size-4 flex-none text-warning" aria-hidden="true" />
          Les commandes n&apos;ont pas pu être chargées.
        </p>
      ) : orders.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
          <PackageOpen className="size-4 flex-none" aria-hidden="true" />
          Aucune commande pour le moment. Elles apparaîtront ici dès la première vente sur le site.
        </p>
      ) : (
        <>
          {/* Phones: one tappable row per order. */}
          <ul className="divide-y divide-border sm:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/orders/${o.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  {/* Reference and amount on the first line, never truncated;
                      who, when and the status on the second. */}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">#{o.orderNumber}</span>
                      <span className="flex-none font-semibold tabular-nums text-foreground">{money(o.total)}</span>
                    </p>
                    <p className="mt-1 flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-xs text-muted-foreground">
                        {o.customerName} · {shortDate(o.createdAt)}
                      </span>
                      <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </p>
                  </div>
                  <ChevronRight className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 font-medium">Référence</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Client</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Date</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Montant</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Statut</th>
                  <th scope="col" className="w-12 px-3 py-2.5">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="max-w-[14rem] truncate px-3 py-2.5 text-foreground" title={o.customerName}>
                      {o.customerName}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{shortDate(o.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap tabular-nums text-foreground">{money(o.total)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        aria-label={`Ouvrir la commande ${o.orderNumber}`}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
