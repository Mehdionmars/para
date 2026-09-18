"use client";

import { KpiCard, type Kpi } from "@/components/dashboard/stats/KpiCard";
import { cn } from "@/lib/utils";

export type { Kpi, KpiIcon } from "@/components/dashboard/stats/KpiCard";

/**
 * A row of KPI cards.
 *
 * This used to render `components/shadcn-space/blocks/statistics-02` — a
 * marketing block, vendored in and pressed into service. It showed: its own
 * demo figures as a fallback when `items` was absent, a variable named
 * `EcommerceActions`, a bare `outline` utility drawing the icon ring (which
 * paints the browser's default focus-ring colour, not a token), `lg:w-3/12`
 * width fractions instead of a grid, and all four cards welded into one
 * bordered strip whose internal dividers had to be re-derived per breakpoint
 * with `md:even:border-e-0 md:nth-[n+3]:border-b-0`.
 *
 * Separate cards in a real grid replace all of it: the wrapping is the
 * grid's problem, each card can carry a sparkline without the strip growing
 * a row, and a card that fails to load can be dropped without leaving a hole
 * in a shared border.
 */
export function StatsRow({
  stats,
  columns = 4,
  className,
}: {
  stats: Kpi[];
  /** Cards per row at `lg` and above. Below that the grid decides. */
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  if (stats.length === 0) return null;

  return (
    <div
      className={cn(
        // Two columns at every width, including the smallest. `sm:` starts at
        // 640px, so gating the second column on it left seven cards in a
        // single column on a phone — roughly 1 400px of scrolling before the
        // charts start. Two-up at 390px gives each card ~170px, which the
        // figures fit once they step down a size (see KpiCard).
        "grid grid-cols-2 gap-3",
        columns === 2 && "lg:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}
