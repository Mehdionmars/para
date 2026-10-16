import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { type Booking, BOOKING_STATUS_LABELS } from "@/lib/dashboard/bookings-types";

const DAY = 86_400_000;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Date(d.getTime() + days * DAY).toISOString().slice(0, 10);
}

/** "Aujourd'hui", "Demain", or "sam. 18 oct." — read as a calendar day. */
function shortDay(date: string, today: string): string {
  if (date === today) return "Aujourd'hui";
  if (date === addDays(today, 1)) return "Demain";
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", weekday: "short" }).format(new Date(y, m - 1, d));
}

/**
 * The appointments block of the overview: three counts that say what the
 * day holds and what is waiting, then the next few appointments in order.
 * Every row opens /dashboard/bookings, where they are acted on.
 *
 * `bookings` is null when they could not be loaded, which is said rather
 * than drawn as an empty agenda.
 */
export function UpcomingBookings({ bookings, today }: { bookings: Booking[] | null; today: string }) {
  const live = (bookings ?? []).filter((b) => b.status === "pending" || b.status === "confirmed");
  const weekEnd = addDays(today, 7);
  const counts = [
    { label: "Aujourd'hui", value: live.filter((b) => b.date === today).length },
    { label: "À confirmer", value: live.filter((b) => b.status === "pending").length, warn: true },
    { label: "7 prochains jours", value: live.filter((b) => b.date >= today && b.date < weekEnd).length },
  ];
  const next = live.filter((b) => b.date >= today).slice(0, 6);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          Rendez-vous
        </h2>
        <Link href="/dashboard/bookings" className="flex items-center gap-1 text-sm text-primary hover:underline">
          Tout voir <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {bookings === null ? (
        <p className="text-sm text-muted-foreground">Les rendez-vous n&apos;ont pas pu être chargés.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {counts.map((c) => (
              <div key={c.label} className="rounded-lg bg-muted/50 px-3 py-2.5">
                <div className={`text-xl font-semibold tabular-nums ${c.warn && c.value > 0 ? "text-warning-strong" : "text-foreground"}`}>{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>

          {next.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">Aucun rendez-vous à venir.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {next.map((b) => (
                <li key={b.id}>
                  <Link href="/dashboard/bookings" className="flex items-center gap-3 py-2.5 text-sm hover:bg-accent/50">
                    <span className="w-24 flex-none text-muted-foreground">{shortDay(b.date, today)}</span>
                    <span className="w-12 flex-none font-semibold tabular-nums text-foreground">{b.time}</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {b.customerName} <span className="text-muted-foreground">· {b.serviceTitle}</span>
                    </span>
                    <span
                      className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        b.status === "pending" ? "bg-warning/10 text-warning-strong" : "bg-success/10 text-success-strong"
                      }`}
                    >
                      {BOOKING_STATUS_LABELS[b.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
