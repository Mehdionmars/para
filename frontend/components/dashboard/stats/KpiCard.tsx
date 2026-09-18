"use client";

import {
  CalendarClock,
  CalendarX,
  Package,
  Percent,
  Repeat,
  ShoppingCart,
  TicketPercent,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Icons resolved here, by name, rather than passed down from the page.
 *
 * A Lucide icon is a function component, and functions do not survive the
 * server/client boundary — handing `icon: TrendingUp` to this block from a
 * Server Component throws "Functions cannot be passed directly to Client
 * Components". Pages therefore send a string, and this module, which is
 * already on the client, turns it back into a component.
 */
const ICONS = {
  aov: Wallet,
  cancelled: Percent,
  coupon: TicketPercent,
  expired: CalendarX,
  lowStock: TriangleAlert,
  newCustomers: UserPlus,
  orders: ShoppingCart,
  package: Package,
  revenue: TrendingUp,
  scheduled: CalendarClock,
  usage: Repeat,
} satisfies Record<string, LucideIcon>;

export type KpiIcon = keyof typeof ICONS;

export type Kpi = {
  label: string;
  /** Pre-formatted for display — the page owns currency and locale. */
  value: string;
  icon: KpiIcon;
  /** Small print under the figure. */
  caption?: string;
  /**
   * Week-over-week change, or null when there is nothing honest to say.
   * Null renders no badge at all rather than a zero or a dash: inventing a
   * trend to fill the slot puts a fabricated percentage beside a real
   * revenue figure, which is worse than a card with one fewer element.
   */
  deltaPct?: number | null;
  /**
   * For figures where up is bad — a cancellation rate climbing 40% is not
   * good news, and colouring it green because the arrow points up is the
   * single most common way a KPI row misleads the person reading it.
   */
  invertDelta?: boolean;
  /** Daily series for the sparkline. Omitted where a trend line is meaningless. */
  spark?: number[];
  /**
   * Where the figure can be acted on. A card with one lifts under the cursor
   * and opens the list behind the number; a card without one does not move,
   * because a surface that answers a click is the only one that should
   * suggest it can be clicked.
   */
  href?: string;
};

/**
 * Change, as a coloured pill.
 *
 * Clamped for display at three digits. A genuine +1 819% — one seeded burst
 * against a quiet week — is arithmetically true and completely unreadable in
 * a pill this size; ">+999%" says the same thing without pretending the exact
 * figure is the point.
 */
function TrendBadge({ deltaPct, invert }: { deltaPct: number; invert?: boolean }) {
  const rounded = Math.round(deltaPct);
  const rising = rounded >= 0;
  const good = invert ? !rising : rising;

  const sign = rising ? "+" : "-";
  const magnitude = Math.abs(rounded);
  const text = magnitude > 999 ? `>${sign}999%` : `${sign}${magnitude}%`;

  // The arrow tracks direction and the colour tracks meaning, so the two can
  // disagree — a down arrow on a green pill is exactly right for a
  // cancellation rate that fell.
  const Arrow = rising ? TrendingUp : TrendingDown;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 tabular-nums",
        // *-strong for the label, plain --success/--warning for the tint and
        // rule. The badge text measured 2.32:1 on its own 10% tint while the
        // same hue is correct for the sparkline it sits above; the roles are
        // genuinely different, so they are different tokens.
        good
          ? "border-success/30 bg-success/10 text-success-strong"
          : "border-warning/30 bg-warning/10 text-warning-strong",
      )}
    >
      <Arrow aria-hidden="true" />
      {text}
    </Badge>
  );
}

/**
 * A 7-point trend line, drawn without axes, grid, tooltip or labels.
 *
 * It is decoration with a job: the shape says "climbing" or "flat" at a
 * glance, and the figure beside it says how much. Anything more — ticks, a
 * hover readout — turns a KPI card into a chart, and the analytics page is
 * where charts belong. aria-hidden for the same reason: every value it
 * encodes is already stated in text above it.
 */
function Sparkline({ data, good }: { data: number[]; good: boolean }) {
  // Two points make a line but not a trend, and a flat series of zeros draws
  // a bar along the floor that reads as data when it is the absence of it.
  if (data.length < 3 || data.every((v) => v === 0)) return null;

  const points = data.map((value, index) => ({ index, value }));
  const stroke = good ? "var(--success)" : "var(--warning)";
  const gradientId = `spark-${good ? "up" : "down"}`;

  return (
    <div className="h-9 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ bottom: 0, left: 0, right: 0, top: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            // The dots would be 7 filled circles on a 36px-tall line.
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = ICONS[kpi.icon];
  const hasDelta = kpi.deltaPct !== null && kpi.deltaPct !== undefined;
  const rising = (kpi.deltaPct ?? 0) >= 0;
  const good = kpi.invertDelta ? !rising : rising;

  const card = (
    <Card
      // Tighter than the primitive's own `gap-6 py-6`: that spacing is built
      // for a card with prose in it, and at seven cards it left the KPI block
      // taller than the chart underneath it.
      //
      // No entrance animation. These cards used to fade up in sequence, 60ms
      // apart — which meant ~400ms before the last figure was readable, every
      // single load, on the one screen whose entire job is to state seven
      // numbers. A dashboard loads into a task; the only motion left here is
      // the hover lift, which reports that the card is a surface rather than
      // narrating its own arrival.
      className={cn(
        "gap-2 py-4 transition-shadow duration-200",
        kpi.href && "h-full group-hover/kpi:shadow-md group-focus-visible/kpi:shadow-md",
      )}
    >
      <CardHeader className="gap-1.5 px-4 sm:px-6">
        <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
          <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
          <span className="truncate">{kpi.label}</span>
        </CardDescription>

        {/* tabular-nums so a column of figures aligns digit-for-digit and the
            value does not jitter sideways as it updates. */}
        {/* Steps down on phones: "12 345 MAD" at text-2xl overflows a
            ~170px card, and a KPI that wraps onto two lines stops being
            readable at a glance. */}
        <CardTitle className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
          {kpi.value}
        </CardTitle>

        {/* CardAction's default is the header grid's top-right cell, which
            works at desktop and does not at 390px: two-up there gives a card
            ~170px, and once the header's padding and a ~62px badge are taken
            out, the figure has ~60px left — "12 345 MAD" does not fit and
            wraps. Below `sm` the badge moves to its own row under the figure
            (an implicit third row, which auto-rows-min sizes), and the
            default top-right placement is restored from `sm` up. */}
        {hasDelta && (
          <CardAction className="col-start-1 row-start-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end">
            <TrendBadge deltaPct={kpi.deltaPct as number} invert={kpi.invertDelta} />
          </CardAction>
        )}
      </CardHeader>

      {(kpi.caption || kpi.spark) && (
        <CardFooter className="flex-col items-stretch gap-2 px-4 sm:px-6">
          {kpi.spark && <Sparkline data={kpi.spark} good={good} />}
          {kpi.caption && (
            <span className="text-xs text-muted-foreground">{kpi.caption}</span>
          )}
        </CardFooter>
      )}
    </Card>
  );

  if (!kpi.href) return card;

  return (
    <Link
      href={kpi.href}
      className="group/kpi block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {card}
    </Link>
  );
}
