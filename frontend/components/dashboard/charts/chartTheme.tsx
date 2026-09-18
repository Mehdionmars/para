"use client";

import type { TooltipContentProps } from "recharts";

/**
 * Shared chart styling, on design tokens.
 *
 * Every chart in the admin used to carry its own literals — `VIOLET =
 * "#7c3aed"`, a `#f1f1f4` grid, `#9ca3af` ticks, `#374151` labels. Four
 * problems with that, and the last is the one that forced this file:
 *
 *  - the violet was not the brand violet (violet-600 is #7C3AED only by
 *    coincidence of rounding; the tokens are oklch and the storefront's is
 *    #6D28D9);
 *  - a second chart wanting a second series had nowhere to get a colour from;
 *  - the grey ticks were a different grey from every label around them;
 *  - none of it responds to the theme, so in dark mode the axis labels went
 *    to near-invisible #9ca3af on a near-black card while the grid lines
 *    stayed light grey and glowed.
 *
 * SVG presentation attributes accept `var()`, so handing recharts a token
 * reference works directly and the chart repaints when `.dark` flips — no
 * JavaScript reading of computed styles, no re-render.
 */

/** Series colours, in the order a chart should reach for them. */
export const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** Faint horizontal rules. `--border` is the same line the cards use. */
export const GRID_PROPS = {
  stroke: "var(--border)",
  strokeDasharray: "3 3",
} as const;

/**
 * Axis ticks at muted-foreground, which is what every other secondary label
 * in the dashboard uses, so the chart's furniture matches the page's.
 */
export const AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
} as const;

/** Category labels sit at full foreground — they are content, not furniture. */
export const CATEGORY_AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "var(--foreground)", fontSize: 12 },
} as const;

/**
 * The tooltip, as a component rather than recharts' `contentStyle`.
 *
 * `contentStyle` can only reach the outer box: the label and each series row
 * inside it keep recharts' own inline colours and 12px sans, which is why the
 * old tooltips looked like a different product. A custom renderer gets the
 * card, border, radius, shadow and type from the same tokens as everything
 * else — and can format values, which is the actual reason the revenue
 * tooltip needed one.
 *
 * The props are Partial because recharts injects them. Passing `content={
 * <ChartTooltip format={money} />}` constructs the element in our code, so
 * TypeScript demands every prop up front — `payload`, `active`, `coordinate`,
 * `accessibilityLayer`, `activeIndex` — none of which the call site has or
 * should invent. recharts clones the element with the real values at render
 * time; Partial is what states that honestly rather than casting it away.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  format,
}: Partial<TooltipContentProps<number, string>> & {
  /** Formats each value — money, a count, a percentage. */
  format?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      {label !== undefined && label !== "" && (
        <p className="mb-1 font-medium text-popover-foreground">{String(label)}</p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-[2px]"
            // The swatch takes the series' own colour so a multi-series
            // tooltip stays readable without a legend.
            style={{ background: entry.color }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-popover-foreground">
            {format ? format(Number(entry.value)) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Shared empty state, so a chart with no data is not a blank rectangle. */
export function ChartEmpty({ label, height = 220 }: { label: string; height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {label}
    </div>
  );
}
