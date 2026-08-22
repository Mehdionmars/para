"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { markRead } from "@/app/dashboard/(app)/notifications/actions";
import { Badge } from "@/components/dashboard/ui/Badge";
import { useToast } from "@/components/dashboard/ui/Toast";
import { NotificationIcon, RelativeTime } from "@/components/notifications/notification-icon";
import {
  NOTIFICATION_TYPE_LABELS,
  notificationHref,
  type NotificationRow,
} from "@/lib/dashboard/orders-types";

function entityLabel(n: NotificationRow): string | null {
  if (typeof n.product === "object" && n.product) return n.product.name || `Produit #${n.product.id}`;
  if (typeof n.product === "number") return `Produit #${n.product}`;
  if (typeof n.order === "object" && n.order) return n.order.orderNumber || `Commande #${n.order.id}`;
  if (typeof n.order === "number") return `Commande #${n.order}`;
  return null;
}

/**
 * The in-app inbox.
 *
 * The whole row is the link — clicking a stock alert opens the product,
 * clicking an order event opens the order. Marking read happens on the way
 * there rather than as a separate deliberate action, because in practice
 * reading and acting are the same gesture.
 */
export function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const [readLocally, setReadLocally] = useState<Set<number>>(new Set());

  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((n) => {
        const isUnread = !n.readAt && !readLocally.has(n.id);
        const href = notificationHref(n);
        const entity = entityLabel(n);

        const body = (
          <>
            <NotificationIcon type={n.type} size={18} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm ${isUnread ? "font-semibold text-gray-900" : "text-gray-800"}`}>
                  {n.title || NOTIFICATION_TYPE_LABELS[n.type] || n.type}
                </p>
                <Badge variant="default">{NOTIFICATION_TYPE_LABELS[n.type] || n.type}</Badge>
              </div>

              {n.message && <p className="mt-1 text-sm text-gray-600">{n.message}</p>}

              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                <RelativeTime iso={n.createdAt} />
                {entity && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-violet-700">
                      {entity}
                      {href && <ExternalLink className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  </>
                )}
              </p>
            </div>

            {isUnread && (
              <span aria-label="Non lue" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
            )}
          </>
        );

        const className = `flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
          isUnread ? "border-violet-200 bg-violet-50/50" : "border-gray-100 bg-white"
        } hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300`;

        function handleRead() {
          if (!isUnread) return;
          setReadLocally((prev) => new Set(prev).add(n.id));
          startTransition(async () => {
            const result = await markRead(n.id);
            if (!result.ok) {
              // Put it back rather than leaving the operator believing it was
              // handled.
              setReadLocally((prev) => {
                const next = new Set(prev);
                next.delete(n.id);
                return next;
              });
              toast.error("Impossible de marquer comme lue");
            }
          });
        }

        return (
          <li key={n.id}>
            {href ? (
              <Link href={href} onClick={handleRead} className={className}>
                {body}
              </Link>
            ) : (
              <button type="button" onClick={handleRead} disabled={isPending || !isUnread} className={className}>
                {body}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
