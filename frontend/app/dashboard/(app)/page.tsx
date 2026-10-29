import { Gauge, Plus, ShieldAlert, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RevenueChartCard, StatusChartCard } from "@/components/dashboard/overview/OverviewCharts";
import { RecentOrders } from "@/components/dashboard/overview/RecentOrders";
import { ShortcutGroups } from "@/components/dashboard/overview/ShortcutGroups";
import { TodoPanel } from "@/components/dashboard/overview/TodoPanel";
import { KpiCard } from "@/components/dashboard/stats/KpiCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { loadStoreActivity, summarizeActivity } from "@/lib/dashboard/activity";
import { getSessionUser } from "@/lib/dashboard/payload";
import { canEditProducts } from "@/lib/dashboard/roles";

/** "Jeudi 29 octobre", in Casablanca whatever zone the server runs in. */
function todayLabel(): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "Africa/Casablanca",
    weekday: "long",
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * The dashboard home: how the shop is doing, what is waiting, then every
 * destination.
 *
 * It was a launcher only — a search and a grid of icons — with the figures at
 * /dashboard/overview. The figures now lead, drawn from the same
 * summarizeActivity the overview uses, so the two pages never disagree. The
 * full board (calendar, upcoming bookings, latest products and coupons, the
 * rearrangeable widgets) stays at /dashboard/overview, one click away.
 *
 * The header, the search and the shortcuts render at once; the activity
 * streams in behind its own skeleton, so a slow orders query never delays the
 * way to the logo settings.
 */
export default async function DashboardHomePage({ searchParams }: PageProps<"/dashboard">) {
  // The layout has already turned away anyone without a staff role; this read
  // is for the roles the actions and shortcuts are filtered by.
  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  const roles = user?.roles ?? [];
  // requireRole sends a page refused to this role back here with this flag.
  const refused = params.error === "acces_refuse";

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Tableau de bord"
        description={`${todayLabel()} · l'activité des sept derniers jours`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/overview">
                <Gauge aria-hidden="true" />
                Vue d&apos;ensemble
              </Link>
            </Button>
            {canEditProducts({ roles }) && (
              <Button asChild>
                <Link href="/dashboard/products/new">
                  <Plus aria-hidden="true" />
                  Ajouter un produit
                </Link>
              </Button>
            )}
          </>
        }
      />

      {refused && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning-strong" role="alert">
          <ShieldAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
          Votre rôle ne donne pas accès à cette page. Demandez à un administrateur si vous en avez besoin.
        </p>
      )}

      <DashboardSearch roles={roles} variant="large" />

      <Suspense fallback={<ActivitySkeleton />}>
        <Activity />
      </Suspense>

      <ShortcutGroups roles={roles} />
    </div>
  );
}

async function Activity() {
  const activity = await loadStoreActivity();
  const summary = summarizeActivity(activity);

  return (
    <>
      {activity.orders === null && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning-strong">
          <TriangleAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
          Les commandes n&apos;ont pas pu être chargées : les chiffres de la semaine sont indisponibles. Rechargez la page
          dans un instant.
        </p>
      )}

      <section aria-label="Indicateurs de la semaine" className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
        {summary.headline.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RevenueChartCard data={summary.revenueSeries} />
        </div>
        {/* First on a phone: what needs doing outranks the shape of the month. */}
        <div className="order-first min-w-0 xl:order-none">
          <TodoPanel todos={summary.todos} snapshot={summary.snapshot} />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentOrders orders={summary.recentOrders} />
        </div>
        <div className="min-w-0">
          <StatusChartCard data={summary.statusSeries} />
        </div>
      </div>
    </>
  );
}

/** The activity's shape while it loads: the same grid, so nothing jumps. */
function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6" aria-busy="true" aria-label="Chargement de l'activité">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[124px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <Skeleton className="h-[340px] rounded-xl xl:col-span-2" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <Skeleton className="h-[320px] rounded-xl xl:col-span-2" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  );
}
