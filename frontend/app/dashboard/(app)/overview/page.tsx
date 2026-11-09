import { TriangleAlert } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrdersCalendar } from "@/components/dashboard/overview/OrdersCalendar";
import { OverviewBoard } from "@/components/dashboard/overview/OverviewBoard";
import { RevenueChartCard, StatusChartCard } from "@/components/dashboard/overview/OverviewCharts";
import { OverviewTabs, type RecentProduct } from "@/components/dashboard/overview/OverviewTabs";
import { TodoPanel } from "@/components/dashboard/overview/TodoPanel";
import { UpcomingBookings } from "@/components/dashboard/overview/UpcomingBookings";
import { KpiCard } from "@/components/dashboard/stats/KpiCard";
import { loadStoreActivity, summarizeActivity } from "@/lib/dashboard/activity";
import { listRecentCoupons, type Coupon } from "@/lib/dashboard/coupons";
import { payloadFetch } from "@/lib/dashboard/payload";
import type { Product } from "@/lib/dashboard/products-types";
import { mediaSrc } from "@/lib/mediaSrc";

async function getRecentProducts(): Promise<RecentProduct[]> {
  // depth=1 so the image relation resolves to a URL. Only six rows, so the
  // cost of populating them is trivial.
  const res = await payloadFetch("/api/products?limit=6&depth=1&sort=-createdAt");
  if (!res.ok) throw new Error("Impossible de charger les produits.");
  const { docs } = (await res.json()) as { docs: Product[] };

  return docs.map((p) => ({
    id: p.id,
    name: p.name,
    // Through mediaSrc, not raw: Payload reports its own uploads as
    // /api/media/file/<name>, a path on the CMS that next/image would resolve
    // against the dashboard and 404. mediaSrc rewrites it onto the
    // /api/cms-media proxy so media stays same-origin.
    imageUrl: typeof p.image === "object" && p.image?.url ? mediaSrc(p.image.url) || null : null,
    price: p.price,
    stock: p.stock,
    isPublished: p.isPublished,
    createdAt: p.createdAt,
  }));
}

/**
 * The full board: the figures the home page leads with, plus the calendar,
 * the upcoming appointments and the latest products and coupons, as widgets
 * the operator can rearrange.
 *
 * Every figure comes from summarizeActivity (lib/dashboard/activity), the
 * same function the home page reads, so the two never disagree.
 */
export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        title="Vue d'ensemble"
        description="Para d'Hiver — les sept derniers jours, comparés aux sept précédents."
      />
      {/* The heading answers at once; the board streams in behind a skeleton
          of its own shape instead of holding the whole page back. */}
      <Suspense fallback={<BoardSkeleton />}>
        <Board />
      </Suspense>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement de la vue d'ensemble">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[124px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <Skeleton className="h-[360px] rounded-xl xl:col-span-2" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    </div>
  );
}

async function Board() {
  // One collection being unreachable costs that panel and nothing else. A
  // rejected list is passed on as null so the panel says it could not load,
  // rather than rendering empty and reading as "nothing here yet".
  const [activity, recentProducts, coupons] = await Promise.all([
    loadStoreActivity(),
    getRecentProducts().catch(() => null),
    listRecentCoupons(6).catch((): Coupon[] | null => null),
  ]);
  const summary = summarizeActivity(activity);

  return (
    <>
      {activity.orders === null && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning-strong">
          <TriangleAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
          Les commandes n&apos;ont pas pu être chargées : le chiffre d&apos;affaires et le calendrier sont indisponibles.
        </p>
      )}

      {/* Every panel is a widget of one board, which the operator can
          rearrange with the pencil. Sizes tile the three-column grid exactly:
          4 × 1 + 4 × 4 + 2 × 2 = 24 cells, eight cell rows, four bands. */}
      <OverviewBoard
        widgets={[
          ...summary.headline.map((kpi, i) => ({
            id: `kpi-${i}`,
            label: kpi.label,
            node: <KpiCard kpi={kpi} />,
            size: "sm" as const,
          })),
          {
            id: "bookings",
            label: "Rendez-vous",
            node: <UpcomingBookings bookings={activity.bookings} today={activity.today} />,
            size: "lg",
          },
          { id: "todo", label: "À traiter", node: <TodoPanel todos={summary.todos} snapshot={summary.snapshot} />, size: "tall" },
          { id: "revenue", label: "Chiffre d'affaires", node: <RevenueChartCard data={summary.revenueSeries} />, size: "lg" },
          { id: "statuses", label: "Commandes par statut", node: <StatusChartCard data={summary.statusSeries} />, size: "tall" },
          { id: "calendar", label: "Calendrier des commandes", node: <OrdersCalendar orders={activity.orders ?? []} />, size: "lg" },
          {
            id: "recent",
            label: "Dernières activités",
            node: <OverviewTabs products={recentProducts} orders={summary.recentOrders} coupons={coupons} />,
            size: "lg",
          },
        ]}
      />
    </>
  );
}
