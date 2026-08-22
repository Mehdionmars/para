import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { DeliveryMonitor } from "@/components/dashboard/notifications/DeliveryMonitor";
import { MarkAllReadButton } from "@/components/dashboard/notifications/MarkAllReadButton";
import { NotificationsList } from "@/components/dashboard/notifications/NotificationsList";
import { requireRole } from "@/lib/dashboard/guard";
import { listDeliveries, listNotificationsPage, notificationStats } from "@/lib/dashboard/orders";
import { isStaffUser } from "@/lib/dashboard/roles";

export const dynamic = "force-dynamic";

const GROUPS = [
  { label: "Toutes", value: "all" },
  { label: "Non lues", value: "unread" },
  { label: "Stock", value: "stock" },
  { label: "Commandes", value: "orders" },
  { label: "Système", value: "system" },
] as const;

type Group = (typeof GROUPS)[number]["value"];

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
      <p className={`text-lg font-semibold tabular-nums ${tone || "text-gray-900"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-gray-500">{label}</p>
    </div>
  );
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; page?: string }>;
}) {
  await requireRole(isStaffUser);
  const params = await searchParams;

  const group = (GROUPS.some((g) => g.value === params.group) ? params.group : "all") as Group;
  const page = Math.max(1, Number(params.page) || 1);

  const [stats, list, deliveries] = await Promise.all([
    notificationStats(),
    listNotificationsPage({ group, page }),
    listDeliveries(),
  ]);

  const href = (g: Group, p = 1) => `/dashboard/notifications?group=${g}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Bell className="h-5 w-5" aria-hidden="true" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Une ligne par événement × canal. Un canal sans provider reste « en attente » — rien n&apos;est
            envoyé et rien n&apos;est prétendu envoyé.
          </p>
        </div>
        {stats.unread > 0 && <MarkAllReadButton count={stats.unread} />}
      </header>

      {/* Compact stat row rather than a card per figure — seven cards would
          push the list itself below the fold. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <Stat label="Total" value={stats.total} />
        <Stat label="Non lues" value={stats.unread} tone={stats.unread > 0 ? "text-violet-700" : ""} />
        <Stat label="Stock faible" value={stats.lowStock} tone={stats.lowStock > 0 ? "text-amber-600" : ""} />
        <Stat label="Ruptures" value={stats.outOfStock} tone={stats.outOfStock > 0 ? "text-red-600" : ""} />
        <Stat label="Retours en stock" value={stats.backInStock} tone={stats.backInStock > 0 ? "text-emerald-600" : ""} />
        <Stat label="Commandes" value={stats.orders} />
        <Stat label="Envois en erreur" value={stats.failed} tone={stats.failed > 0 ? "text-red-600" : ""} />
      </div>

      <nav aria-label="Filtrer les notifications" className="flex flex-wrap gap-1.5">
        {GROUPS.map((g) => {
          const active = g.value === group;
          return (
            <Link
              key={g.value}
              href={href(g.value)}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-700 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {g.label}
              {g.value === "unread" && stats.unread > 0 && (
                <span className={`ml-1.5 text-xs ${active ? "text-violet-100" : "text-violet-700"}`}>
                  {stats.unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <section>
        {list.docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <Bell className="mx-auto h-6 w-6 text-gray-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {group === "unread" ? "Tout est lu" : "Aucune notification"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {group === "all"
                ? "Les événements de commande et de stock apparaîtront ici."
                : "Aucune notification dans ce filtre."}
            </p>
            {group !== "all" && (
              <Link
                href={href("all")}
                className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline"
              >
                Voir toutes les notifications
              </Link>
            )}
          </div>
        ) : (
          <>
            <NotificationsList notifications={list.docs} />

            {list.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Page {list.page} sur {list.totalPages} · {list.totalDocs} notification
                  {list.totalDocs > 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={href(group, page - 1)}
                    aria-label="Page précédente"
                    aria-disabled={page <= 1}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white ${
                      page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={href(group, page + 1)}
                    aria-label="Page suivante"
                    aria-disabled={page >= list.totalPages}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white ${
                      page >= list.totalPages ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Journal de livraison</h2>
        <DeliveryMonitor deliveries={deliveries} />
      </section>
    </div>
  );
}
