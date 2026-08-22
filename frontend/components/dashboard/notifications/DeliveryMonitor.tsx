"use client";

import { Loader2, RotateCw } from "lucide-react";
import { useState, useTransition } from "react";
import { retryDelivery } from "@/app/dashboard/(app)/notifications/actions";
import { Badge } from "@/components/dashboard/ui/Badge";
import { Button } from "@/components/dashboard/ui/Button";
import { useToast } from "@/components/dashboard/ui/Toast";
import { Tooltip } from "@/components/dashboard/ui/Tooltip";
import {
  MAX_DELIVERY_ATTEMPTS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_TYPE_LABELS,
  RECIPIENT_LABELS,
  type NotificationRow,
} from "@/lib/dashboard/orders-types";

/**
 * Fixed timezone, not the runtime default.
 *
 * `toLocaleString()` uses the environment's zone: the container renders in
 * UTC and the browser in local time, so the server HTML and the hydrated
 * output disagreed and React reported a mismatch. Pinning the shop's own
 * zone makes it deterministic *and* correct for the operator reading it.
 */
const stamp = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Casablanca",
    year: "numeric",
  });

const STATUS_VARIANT: Record<string, "info" | "success" | "warning" | "danger"> = {
  failed: "danger",
  pending: "warning",
  read: "info",
  sent: "success",
};

/**
 * Delivery log for the external channels.
 *
 * `pending` here does not mean "in a queue" — there is no queue. It means the
 * message was composed and is owed to the recipient, but no provider is
 * configured to carry it. That distinction is why the reason column matters:
 * an operator seeing a row stuck at pending needs to know it is a missing
 * `EMAIL_API_KEY`, not a transient outage they should keep retrying.
 */
export function DeliveryMonitor({ deliveries }: { deliveries: NotificationRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const toast = useToast();

  if (deliveries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
        Aucun envoi externe enregistré.
      </p>
    );
  }

  function handleRetry(row: NotificationRow) {
    setBusyId(row.id);
    startTransition(async () => {
      const result = await retryDelivery(row.id);
      setBusyId(null);

      if (result.ok) {
        toast.success("Notification renvoyée", `Tentative ${result.attempts}/${MAX_DELIVERY_ATTEMPTS}.`);
        return;
      }
      toast.error("Renvoi impossible", result.error);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Table on desktop, cards on mobile — nine columns on a phone would
          force horizontal scrolling to reach the retry button. */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-medium text-gray-500">
            <th scope="col" className="px-4 py-2.5">Destinataire</th>
            <th scope="col" className="px-3 py-2.5">Événement</th>
            <th scope="col" className="px-3 py-2.5">Canal</th>
            <th scope="col" className="px-3 py-2.5">Statut</th>
            <th scope="col" className="px-3 py-2.5">Tentatives</th>
            <th scope="col" className="px-3 py-2.5">Créée</th>
            <th scope="col" className="px-3 py-2.5">Envoyée</th>
            <th scope="col" className="px-4 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => {
            const attempts = Number(d.attempts) || 0;
            const capped = attempts >= MAX_DELIVERY_ATTEMPTS;
            const done = d.status === "sent" || d.status === "read";

            return (
              <tr key={d.id} className="border-b border-gray-50 last:border-0">
                <td className="max-w-[220px] px-4 py-2.5">
                  {/* recipientRef is authoritative; customerEmail is the
                      legacy fallback for rows written before it existed. */}
                  <p className="truncate text-gray-700" title={d.recipientRef || d.customerEmail || ""}>
                    {d.recipientRef || d.customerEmail || "—"}
                  </p>
                  {d.recipientType && (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {RECIPIENT_LABELS[d.recipientType] || d.recipientType}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{NOTIFICATION_TYPE_LABELS[d.type] || d.type}</td>
                <td className="px-3 py-2.5 text-gray-600">{NOTIFICATION_CHANNEL_LABELS[d.channel] || d.channel}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={STATUS_VARIANT[d.status] ?? "info"}>
                    {NOTIFICATION_STATUS_LABELS[d.status] || d.status}
                  </Badge>
                  {d.error && <p className="mt-1 max-w-[260px] text-xs text-amber-700">{d.error}</p>}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-gray-600">
                  {attempts}/{MAX_DELIVERY_ATTEMPTS}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500">
                  {stamp(d.createdAt)}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500">
                  {d.sentAt ? stamp(d.sentAt) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {done ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <Tooltip label={capped ? `Limite de ${MAX_DELIVERY_ATTEMPTS} tentatives atteinte` : "Réessayer l'envoi"}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={capped || (isPending && busyId === d.id)}
                        onClick={() => handleRetry(d)}
                        aria-label={`Réessayer l'envoi de la notification ${d.id}`}
                      >
                        {isPending && busyId === d.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Réessayer
                      </Button>
                    </Tooltip>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-gray-50 md:hidden">
        {deliveries.map((d) => {
          const attempts = Number(d.attempts) || 0;
          const capped = attempts >= MAX_DELIVERY_ATTEMPTS;
          const done = d.status === "sent" || d.status === "read";

          return (
            <li key={d.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {NOTIFICATION_TYPE_LABELS[d.type] || d.type}
                </span>
                <Badge variant={STATUS_VARIANT[d.status] ?? "info"}>
                  {NOTIFICATION_STATUS_LABELS[d.status] || d.status}
                </Badge>
                <Badge variant="default">{NOTIFICATION_CHANNEL_LABELS[d.channel] || d.channel}</Badge>
              </div>
              <p className="truncate text-xs text-gray-600">
                {d.recipientRef || d.customerEmail || "—"}
                {d.recipientType && (
                  <span className="text-gray-400"> · {RECIPIENT_LABELS[d.recipientType] || d.recipientType}</span>
                )}
              </p>
              {d.error && <p className="text-xs text-amber-700">{d.error}</p>}
              <p className="text-xs text-gray-400">
                {stamp(d.createdAt)} · {attempts}/{MAX_DELIVERY_ATTEMPTS} tentative(s)
              </p>
              {!done && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={capped || (isPending && busyId === d.id)}
                  onClick={() => handleRetry(d)}
                  className="mt-1 self-start"
                  aria-label={`Réessayer l'envoi de la notification ${d.id}`}
                >
                  {isPending && busyId === d.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Réessayer
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
