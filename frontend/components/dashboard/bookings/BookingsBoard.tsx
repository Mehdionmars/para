"use client";

import { Check, CheckCheck, Loader2, Mail, MessageCircle, Phone, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBookingStaffNote, updateBookingStatus } from "@/app/dashboard/(app)/bookings/actions";
import { useToast } from "@/components/dashboard/ui/Toast";
import { Button } from "@/components/ui/button";
import { type Booking, BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/dashboard/bookings-types";
import { bookingMessage, whatsappLink } from "@/lib/dashboard/whatsapp";

const FILTERS = [
  { key: "upcoming", label: "À venir" },
  { key: "pending", label: "En attente" },
  { key: "all", label: "Tous" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const STATUS_STYLES: Record<BookingStatus, string> = {
  cancelled: "bg-muted text-muted-foreground",
  confirmed: "bg-success/10 text-success-strong",
  done: "bg-primary/10 text-primary",
  pending: "bg-warning/10 text-warning-strong",
};

/** "2026-10-17" → "samedi 17 octobre", read as a calendar day. */
function dayLabel(date: string, today: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const label = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", weekday: "long" }).format(new Date(y, m - 1, d));
  if (date === today) return `Aujourd'hui — ${label}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function BookingRow({ booking, onStatus, busy }: { booking: Booking; onStatus: (s: BookingStatus) => void; busy: boolean }) {
  const toast = useToast();
  const [note, setNote] = useState(booking.staffNote);
  const [savingNote, setSavingNote] = useState(false);
  const closed = booking.status === "cancelled" || booking.status === "done";
  const whatsapp = whatsappLink(booking.customerPhone, bookingMessage(booking));

  async function saveNote() {
    if (note === booking.staffNote) return;
    setSavingNote(true);
    const res = await updateBookingStaffNote(booking.id, note);
    setSavingNote(false);
    if (!res.ok) toast.error("Note non enregistrée", res.error);
  }

  return (
    <li className={`flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start ${closed ? "opacity-60" : ""}`}>
      <div className="w-16 flex-none text-lg font-semibold tabular-nums text-foreground">{booking.time}</div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{booking.customerName}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[booking.status]}`}>{BOOKING_STATUS_LABELS[booking.status]}</span>
        </div>
        <div className="text-sm text-muted-foreground">{booking.serviceTitle}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-primary hover:underline">
            <Phone className="h-3.5 w-3.5" /> {booking.customerPhone}
          </a>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          {booking.customerEmail && (
            <a href={`mailto:${booking.customerEmail}`} className="inline-flex items-center gap-1 text-primary hover:underline">
              <Mail className="h-3.5 w-3.5" /> {booking.customerEmail}
            </a>
          )}
        </div>
        {booking.note && <p className="text-sm text-foreground">« {booking.note} »</p>}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder="Note interne (jamais montrée au client)"
          rows={1}
          className="mt-1 w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {savingNote && <span className="text-xs text-muted-foreground">Enregistrement…</span>}
      </div>

      <div className="flex flex-none flex-wrap gap-2 sm:flex-col sm:items-stretch">
        {busy && <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" />}
        {booking.status === "pending" && (
          <Button size="sm" onClick={() => onStatus("confirmed")} disabled={busy}>
            <Check className="h-4 w-4" /> Confirmer
          </Button>
        )}
        {booking.status === "confirmed" && (
          <Button size="sm" variant="outline" onClick={() => onStatus("done")} disabled={busy}>
            <CheckCheck className="h-4 w-4" /> Terminé
          </Button>
        )}
        {!closed && (
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onStatus("cancelled")} disabled={busy}>
            <X className="h-4 w-4" /> Annuler
          </Button>
        )}
        {closed && (
          <Button size="sm" variant="ghost" onClick={() => onStatus("pending")} disabled={busy}>
            <RotateCcw className="h-4 w-4" /> Rouvrir
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Bookings grouped by day, earliest first, with the one decision each needs
 * as a button. Pending requests stay on the page whatever their date, so an
 * unanswered one cannot slip into the past unseen.
 */
export function BookingsBoard({ bookings, today }: { bookings: Booking[]; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const visible = bookings.filter((b) => {
    if (filter === "pending") return b.status === "pending";
    if (filter === "upcoming") return b.status === "pending" || b.status === "confirmed";
    return true;
  });

  const byDay = new Map<string, Booking[]>();
  for (const b of visible) byDay.set(b.date, [...(byDay.get(b.date) ?? []), b]);

  async function changeStatus(booking: Booking, status: BookingStatus) {
    setBusyId(booking.id);
    const res = await updateBookingStatus(booking.id, status);
    setBusyId(null);
    if (!res.ok) {
      toast.error("Rendez-vous non modifié", res.error);
      return;
    }
    toast.success(`Rendez-vous ${BOOKING_STATUS_LABELS[status].toLowerCase()}`, `${booking.customerName} — ${booking.time}`);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === f.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f.label}
              {f.key === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-warning/15 px-1.5 text-xs text-warning-strong">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {byDay.size === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {filter === "pending" ? "Aucune demande en attente." : "Aucun rendez-vous à venir."}
        </div>
      ) : (
        [...byDay.entries()].map(([date, items]) => (
          <section key={date} className="flex flex-col gap-2">
            <h2 className={`text-sm font-semibold ${date < today ? "text-destructive" : "text-foreground"}`}>
              {dayLabel(date, today)}
              {date < today && " — passé, sans réponse"}
            </h2>
            <ul className="flex flex-col gap-2">
              {items.map((b) => (
                <BookingRow key={b.id} booking={b} busy={busyId === b.id} onStatus={(s) => changeStatus(b, s)} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
