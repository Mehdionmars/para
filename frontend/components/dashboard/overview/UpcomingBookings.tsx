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
 * The appointments agenda of the overview: the next appointments in order,
 * under a one-line summary. The counts are inline figures rather than three
 * tiles of their own — at zero, tiles made the emptiest part of the page its
 * loudest. Every row opens /dashboard/bookings, where they are acted on.
 *
 * `bookings` is null when they could not be loaded, which is said rather
 * than drawn as an empty agenda.
 */
export function UpcomingBookings({ bookings, today }: { bookings: Booking[] | null; today: string }) {
  const live = (bookings ?? []).filter((b) => b.status === "pending" || b.status === "confirmed");
  const weekEnd = addDays(today, 7);
  const todayCount = live.filter((b) => b.date === today).length;
  const pendingCount = live.filter((b) => b.status === "pending").length;
  const weekCount = live.filter((b) => b.date >= today && b.date < weekEnd).length;
  const next = live.filter((b) => b.date >= today).slice(0, 6);

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card shadow-xs">
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            Rendez-vous
          </h2>
          {bookings !== null && (
            <p className="mt-1 text-sm text-muted-foreground">
              <strong className="font-semibold tabular-nums text-foreground">{todayCount}</strong>{" "}
              aujourd&apos;hui
              {" · "}
              <strong className={`font-semibold tabular-nums ${pendingCount > 0 ? "text-warning-strong" : "text-foreground"}`}>{pendingCount}</strong>{" "}
              à confirmer
              {" · "}
              <strong className="font-semibold tabular-nums text-foreground">{weekCount}</strong>{" "}
              sur 7 jours
            </p>
          )}
        </div>
        <Link href="/dashboard/bookings" className="flex flex-none items-center gap-1 text-sm font-medium text-primary hover:underline">
          Tout voir <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </header>

      {bookings === null ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">Les rendez-vous n&apos;ont pas pu être chargés.</p>
      ) : next.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-5 py-8 text-center">
          <p className="text-sm font-medium text-foreground">Aucun rendez-vous à venir</p>
          <p className="max-w-xs text-sm text-muted-foreground">Les demandes faites sur la page Services du site apparaîtront ici.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border px-2 py-1">
          {next.map((b) => (
            <li key={b.id}>
              <Link href="/dashboard/bookings" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent/60">
                <span className="w-20 flex-none text-muted-foreground sm:w-24">{shortDay(b.date, today)}</span>
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
    </section>
  );
}
