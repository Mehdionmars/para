import {
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE_STEPS,
  type OrderStatus,
} from "@/lib/dashboard/orders-types";

const TERMINAL_COPY: Partial<Record<OrderStatus, string>> = {
  cancelled: "Annulée",
  refunded: "Remboursée",
  returned: "Retournée",
};

function shortTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "short" }).format(d);
}

/**
 * Horizontal progress strip for the order workspace.
 *
 * The vertical timeline used on the customer tracking page is right there —
 * a visitor reads it once, slowly. An operator scanning dozens of orders
 * needs the same information in one line, so this collapses it to a row of
 * connected dots with the timestamp under each reached step. It costs ~72px
 * of height instead of ~320px.
 *
 * A cancelled, returned or refunded order stops the strip and shows the
 * ending: continuing to draw "Livrée" ahead of it would be a lie.
 */
export function OrderTimelineCompact({
  status,
  entries = [],
}: {
  status: OrderStatus;
  entries?: { status: OrderStatus; at?: string | null }[];
}) {
  const timeOf = new Map<OrderStatus, string>();
  for (const e of entries) {
    if (e.at && !timeOf.has(e.status)) timeOf.set(e.status, e.at);
  }

  const ended = TERMINAL_COPY[status];
  const reachedIndex = ORDER_TIMELINE_STEPS.indexOf(status);
  const lastProgress = ended
    ? ORDER_TIMELINE_STEPS.reduce((max, step, i) => (timeOf.has(step) ? i : max), 0)
    : reachedIndex;

  return (
    // Steps keep a fixed width and never shrink; the row scrolls instead.
    // Letting them flex meant the label centred and spilled past its own box
    // — the first one rendered as "tente" instead of "En attente".
    <ol className="flex items-start overflow-x-auto pb-1" aria-label="Progression de la commande">
      {ORDER_TIMELINE_STEPS.map((step, i) => {
        const done = i <= lastProgress;
        const current = !ended && i === reachedIndex;
        const isLast = i === ORDER_TIMELINE_STEPS.length - 1;

        return (
          <li key={step} className="flex flex-none items-start">
            <div className="flex w-[88px] flex-none flex-col items-center px-1 text-center">
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  current
                    ? "border-violet-600 bg-violet-600 text-white"
                    : done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-200 bg-white text-transparent"
                }`}
              >
                {done && !current ? "✓" : "●"}
              </span>
              <span
                className={`mt-1.5 text-[11px] leading-tight ${
                  current ? "font-semibold text-violet-700" : done ? "text-gray-800" : "text-gray-400"
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
              {/* nowrap: "19 août, 15:10" broke onto three lines once the
                  column narrowed, which read as three separate values. */}
              <span className="mt-0.5 whitespace-nowrap text-[10px] tabular-nums text-gray-400">
                {shortTime(timeOf.get(step))}
              </span>
            </div>

            {!isLast && (
              <span
                aria-hidden="true"
                className={`mt-2.5 h-0.5 w-6 flex-none ${i < lastProgress ? "bg-emerald-500" : "bg-gray-200"}`}
              />
            )}
          </li>
        );
      })}

      {ended && (
        <li className="flex w-[88px] flex-none flex-col items-center px-1 text-center">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-400 bg-red-400 text-[10px] font-bold text-white"
          >
            !
          </span>
          <span className="mt-1.5 text-[11px] font-semibold leading-tight text-red-600">{ended}</span>
          <span className="mt-0.5 whitespace-nowrap text-[10px] tabular-nums text-gray-400">
            {shortTime(timeOf.get(status))}
          </span>
        </li>
      )}
    </ol>
  );
}
