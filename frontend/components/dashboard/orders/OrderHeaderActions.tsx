"use client";

import { AlertTriangle, ChevronDown, ExternalLink, Loader2, MoreVertical, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/dashboard/(app)/orders/actions";
import { Badge } from "@/components/dashboard/ui/Badge";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
} from "@/lib/dashboard/orders-types";

/**
 * The order workspace's action bar.
 *
 * These controls used to live inside the "Résumé" panel, which left that
 * panel doing two unrelated jobs — showing the money and driving the order —
 * and buried the primary action below the whole article list on a phone. The
 * summary is now money only, and everything actionable sits in the header
 * where it is reachable without scrolling at any width.
 *
 * The confirmation step is kept, not decoration: a status change fires
 * customer notifications and can put stock back on the shelf. Neither is
 * undoable from this page.
 */

/** Closes on Escape and on any pointer press outside. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  return ref;
}

const MENU_PANEL =
  "absolute right-0 top-full z-30 mt-1.5 min-w-[220px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg";
const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:opacity-60";

export function OrderHeaderActions({
  adminHref,
  id,
  orderNumber,
  printHref,
  readOnly = false,
  status,
}: {
  adminHref: string;
  id: number;
  orderNumber: string;
  printHref: string;
  readOnly?: boolean;
  status: OrderStatus;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const statusRef = useDismiss(statusOpen || pendingTarget !== null, () => {
    if (!isPending) {
      setStatusOpen(false);
      setPendingTarget(null);
    }
  });
  const moreRef = useDismiss(moreOpen, () => setMoreOpen(false));

  const allowed = ORDER_STATUS_TRANSITIONS[status];
  // Only these three put items back on the shelf, and only when the order
  // isn't already in one of them.
  const restoresStock =
    pendingTarget !== null &&
    ["cancelled", "refunded", "returned"].includes(pendingTarget) &&
    !["cancelled", "refunded", "returned"].includes(status);

  function apply(target: OrderStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateOrderStatus(id, target);
      if (!result.ok) setError(result.error);
      else setStatusOpen(false);
      setPendingTarget(null);
    });
  }

  return (
    // Full width below `sm`, so the actions take their own row and the order
    // number stops being truncated to "PDH-…". The number is the page's
    // identity; three buttons sharing a 390px line left it seven characters.
    <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
      {/* ------------------------------------------------------- status */}
      <div className="relative" ref={statusRef}>
        {readOnly ? (
          <Badge variant={ORDER_STATUS_BADGE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
        ) : (
          <button
            aria-expanded={statusOpen}
            aria-haspopup="menu"
            aria-label={`Statut : ${ORDER_STATUS_LABELS[status]}. Changer le statut`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white pl-2.5 pr-2 text-sm text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            onClick={() => {
              setMoreOpen(false);
              setPendingTarget(null);
              setStatusOpen((v) => !v);
            }}
            type="button"
          >
            <Badge variant={ORDER_STATUS_BADGE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        )}

        {statusOpen && !pendingTarget && (
          <div className={MENU_PANEL} role="menu">
            {allowed.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">
                Statut définitif — cette commande ne peut plus changer d&apos;état.
              </p>
            ) : (
              allowed.map((target) => (
                <button
                  className={MENU_ITEM}
                  key={target}
                  onClick={() => {
                    setError("");
                    setPendingTarget(target);
                  }}
                  role="menuitem"
                  type="button"
                >
                  Passer à <strong className="font-medium">{ORDER_STATUS_LABELS[target]}</strong>
                </button>
              ))
            )}
          </div>
        )}

        {pendingTarget && (
          <div className={`${MENU_PANEL} max-w-[min(320px,calc(100vw-2rem))] p-3`} role="dialog">
            <p className="text-sm text-gray-900">
              Passer <strong>{orderNumber}</strong> à <strong>{ORDER_STATUS_LABELS[pendingTarget]}</strong> ?
            </p>
            {restoresStock && (
              <p className="mt-1.5 text-xs text-amber-700">Le stock des articles sera remis en rayon.</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-700 px-3 text-xs font-medium text-white hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:opacity-60"
                disabled={isPending}
                onClick={() => apply(pendingTarget)}
                type="button"
              >
                {isPending && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />}
                Confirmer
              </button>
              <button
                className="h-8 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:opacity-60"
                disabled={isPending}
                onClick={() => setPendingTarget(null)}
                type="button"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- print */}
      <Link
        aria-label="Imprimer le ticket de commande"
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-violet-700 px-2.5 text-sm font-medium text-white hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:px-3"
        href={printHref}
        rel="noopener"
        target="_blank"
      >
        <Printer aria-hidden="true" className="h-4 w-4" />
        <span className="hidden sm:inline">Ticket</span>
      </Link>

      {/* ------------------------------------------------------ overflow */}
      <div className="relative" ref={moreRef}>
        <button
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-label="Autres actions"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          onClick={() => {
            setStatusOpen(false);
            setMoreOpen((v) => !v);
          }}
          type="button"
        >
          <MoreVertical aria-hidden="true" className="h-4 w-4" />
        </button>

        {moreOpen && (
          <div className={MENU_PANEL} role="menu">
            <a className={MENU_ITEM} href={printHref} rel="noopener" role="menuitem" target="_blank">
              <Printer aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
              Imprimer le ticket
            </a>
            <a className={MENU_ITEM} href={adminHref} rel="noopener" role="menuitem" target="_blank">
              <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
              Modifier dans l&apos;admin
            </a>
          </div>
        )}
      </div>

      {error && (
        <p className="flex w-full items-start gap-1.5 text-xs text-red-600" role="alert">
          <AlertTriangle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
