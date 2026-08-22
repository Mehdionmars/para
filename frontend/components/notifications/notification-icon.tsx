import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  PackageCheck,
  PackageX,
  RotateCcw,
  ShoppingCart,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * One icon and colour per notification type.
 *
 * Kept in its own module because both the bell and the notification centre
 * render it — the two used to be the obvious place for the mapping to drift,
 * with a stock alert showing a cart in one and a box in the other.
 */
const MAP: Record<string, { icon: LucideIcon; tone: string }> = {
  BACK_IN_STOCK: { icon: PackageCheck, tone: "text-emerald-600 bg-emerald-50" },
  LOW_STOCK: { icon: AlertTriangle, tone: "text-amber-600 bg-amber-50" },
  ORDER_CANCELLED: { icon: XCircle, tone: "text-red-600 bg-red-50" },
  ORDER_CONFIRMED: { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  ORDER_CREATED: { icon: ShoppingCart, tone: "text-violet-700 bg-violet-50" },
  ORDER_DELIVERED: { icon: PackageCheck, tone: "text-emerald-600 bg-emerald-50" },
  ORDER_PREPARING: { icon: RotateCcw, tone: "text-sky-600 bg-sky-50" },
  ORDER_REFUNDED: { icon: RotateCcw, tone: "text-red-600 bg-red-50" },
  ORDER_RETURNED: { icon: RotateCcw, tone: "text-amber-600 bg-amber-50" },
  ORDER_SHIPPED: { icon: Truck, tone: "text-sky-600 bg-sky-50" },
  OUT_OF_STOCK: { icon: PackageX, tone: "text-red-600 bg-red-50" },
};

const FALLBACK = { icon: Bell, tone: "text-gray-500 bg-gray-100" };

export function NotificationIcon({ type, size = 16 }: { type: string; size?: number }) {
  const { icon: Icon, tone } = MAP[type] ?? FALLBACK;
  const box = size === 16 ? "h-8 w-8" : "h-9 w-9";

  return (
    <span
      aria-hidden="true"
      className={`flex ${box} shrink-0 items-center justify-center rounded-lg ${tone}`}
    >
      <Icon style={{ height: size, width: size }} />
    </span>
  );
}

/**
 * Relative time, short form. Falls back to a date past a week — "il y a 23
 * jours" is less useful than the date itself.
 *
 * Depends on `Date.now()`, so the server render and the hydration render can
 * legitimately disagree by a minute. Callers must wrap the output in
 * <RelativeTime>, which marks that difference as expected instead of letting
 * React report a hydration mismatch.
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days <= 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/**
 * Renders a relative timestamp without tripping hydration.
 *
 * `suppressHydrationWarning` is the right tool here and not a workaround: the
 * text is *supposed* to differ between a server render and the moment the
 * browser hydrates, because time has passed. The machine-readable value in
 * `dateTime` stays exact either way.
 */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {relativeTime(iso)}
    </time>
  );
}
