import {
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE_STEPS,
  type OrderStatus,
} from "@/lib/dashboard/orders-types";

export type TimelineEntry = { status: OrderStatus; at?: string | null };

const TERMINAL_COPY: Partial<Record<OrderStatus, string>> = {
  cancelled: "Commande annulée",
  refunded: "Commande remboursée",
  returned: "Commande retournée",
};

function formatWhen(at?: string | null): string {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(d);
}

/**
 * Customer-facing progress of an order.
 *
 * Steps are derived from the recorded history, not from the current status
 * alone: an order can only reach `shipped` by passing through the earlier
 * states, and the history is what carries the timestamps. A step with no
 * history entry still renders as reached when the order is past it, so an
 * order created before this feature existed doesn't look stuck.
 *
 * A cancelled, returned or refunded order stops the happy path and shows the
 * ending instead — pretending "livrée" is still coming would be a lie.
 */
export function OrderTimeline({
  status,
  entries = [],
}: {
  status: OrderStatus;
  entries?: TimelineEntry[];
}) {
  const timeOf = new Map<OrderStatus, string>();
  for (const e of entries) {
    // First occurrence wins: if an order somehow revisits a state, the
    // moment it was first reached is the honest one to show.
    if (e.at && !timeOf.has(e.status)) timeOf.set(e.status, e.at);
  }

  const ended = TERMINAL_COPY[status];
  const reachedIndex = ORDER_TIMELINE_STEPS.indexOf(status);
  // For a terminal status, everything the order actually went through stays
  // marked done — derived from history, since `status` no longer sits on the
  // happy path.
  const lastProgress = ended
    ? ORDER_TIMELINE_STEPS.reduce((max, step, i) => (timeOf.has(step) ? i : max), 0)
    : reachedIndex;

  return (
    <ol className="flex flex-col gap-0" role="list">
      {ORDER_TIMELINE_STEPS.map((step, i) => {
        const done = i <= lastProgress;
        const current = !ended && i === reachedIndex;
        const when = formatWhen(timeOf.get(step));
        const isLast = i === ORDER_TIMELINE_STEPS.length - 1;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                  current
                    ? "border-violet-600 bg-violet-600 text-white"
                    : done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-200 bg-white text-transparent",
                ].join(" ")}
              >
                {done && !current ? "✓" : current ? "●" : "○"}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`w-0.5 flex-1 ${i < lastProgress ? "bg-emerald-500" : "bg-gray-200"}`}
                  style={{ minHeight: 22 }}
                />
              )}
            </div>

            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm leading-6 ${
                  current ? "font-semibold text-violet-700" : done ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
              </p>
              {when && <p className="text-xs text-gray-500">{when}</p>}
            </div>
          </li>
        );
      })}

      {ended && (
        <li className="flex gap-3">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-red-400 bg-red-400 text-[11px] font-bold text-white"
          >
            !
          </span>
          <div>
            <p className="text-sm font-semibold leading-6 text-red-600">{ended}</p>
            {formatWhen(timeOf.get(status)) && (
              <p className="text-xs text-gray-500">{formatWhen(timeOf.get(status))}</p>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}
