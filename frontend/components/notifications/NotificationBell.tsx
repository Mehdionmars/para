"use client";

import { Bell, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { fetchBellData, markAllRead, markRead } from "@/app/dashboard/(app)/notifications/actions";
import { Popover } from "@/components/dashboard/ui/Popover";
import { NotificationIcon, RelativeTime } from "@/components/notifications/notification-icon";
import { notificationHref, type NotificationRow } from "@/lib/dashboard/orders-types";

/**
 * Unread counter + a short preview of the in-app inbox.
 *
 * Data is fetched when the popover opens rather than polled: the dashboard is
 * a working tool, not a live feed, and a background timer on every page would
 * cost a request per operator per interval for a number that changes a few
 * times a day. Opening the bell is the moment the answer is actually wanted.
 */
export function NotificationBell() {
  const router = useRouter();
  const [data, setData] = useState<{ unread: number; recent: NotificationRow[] } | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  // Locally marked ids, so a row stops looking unread immediately instead of
  // waiting on the refetch.
  const [readLocally, setReadLocally] = useState<Set<number>>(new Set());
  const loadedOnce = useRef(false);

  async function load() {
    setState("loading");
    try {
      setData(await fetchBellData());
      setState("idle");
    } catch {
      setState("error");
    }
  }

  // First open only; reopening reuses what is already there until an action
  // changes it.
  function handleOpen() {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    void load();
  }

  const unread = Math.max(0, (data?.unread ?? 0) - readLocally.size);

  return (
    <Popover
      label="Notifications"
      panelClassName="w-[min(360px,calc(100vw-2rem))] p-0"
      trigger={({ toggle, ...aria }) => (
        <button
          type="button"
          onClick={() => {
            handleOpen();
            toggle();
          }}
          aria-label={unread > 0 ? `Notifications, ${unread} non lues` : "Notifications"}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          {...aria}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-700 px-1 text-[10px] font-semibold text-white"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await markAllRead();
                    if (result.ok) {
                      setReadLocally(new Set((data?.recent ?? []).map((n) => n.id)));
                      loadedOnce.current = false;
                      await load();
                    }
                  })
                }
                className="text-xs font-medium text-violet-700 hover:underline disabled:opacity-50"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {state === "loading" && (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Chargement…
            </div>
          )}

          {state === "error" && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-red-600">Impossible de charger les notifications.</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-2 text-xs font-medium text-violet-700 hover:underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {state === "idle" && data && data.recent.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">Aucune notification.</p>
          )}

          {state === "idle" && data && data.recent.length > 0 && (
            <ul className="max-h-[min(60vh,380px)] overflow-y-auto">
              {data.recent.map((n) => {
                const href = notificationHref(n);
                const isUnread = !n.readAt && !readLocally.has(n.id);

                return (
                  <li key={n.id} className={`border-b border-gray-50 last:border-0 ${isUnread ? "bg-violet-50/40" : ""}`}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnread) {
                          setReadLocally((prev) => new Set(prev).add(n.id));
                          startTransition(async () => {
                            await markRead(n.id);
                          });
                        }
                        close();
                        if (href) router.push(href);
                      }}
                      className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50"
                    >
                      <NotificationIcon type={n.type} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${isUnread ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {n.title || n.type}
                        </span>
                        {n.message && <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">{n.message}</span>}
                        <RelativeTime iso={n.createdAt} className="mt-0.5 block text-[11px] text-gray-400" />
                      </span>
                      {isUnread && <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href="/dashboard/notifications"
              onClick={close}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-violet-700 hover:underline"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </Popover>
  );
}
