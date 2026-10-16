import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/dashboard/bookings-types";
import { payloadFetch } from "@/lib/dashboard/payload";

/** Today in Casablanca, "YYYY-MM-DD" — the same calendar the backend books
 * against (backend/src/lib/bookings.ts), whatever zone this server runs in. */
export function casablancaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: "Africa/Casablanca", year: "numeric" }).format(new Date());
}

/**
 * Bookings from `since` (a "YYYY-MM-DD" day) onward, plus every pending one
 * whatever its date, so a request nobody answered never falls off the page.
 */
export async function listBookings(since: string): Promise<Booking[]> {
  // Payload reads `where` from bracketed query params.
  const params = new URLSearchParams({
    depth: "0",
    limit: "500",
    sort: "date",
    "where[or][0][date][greater_than_equal]": since,
    "where[or][1][status][equals]": "pending",
  });

  const res = await payloadFetch(`/api/bookings?${params.toString()}`);
  if (!res.ok) throw new Error("Impossible de charger les rendez-vous.");
  const data = await res.json();

  type Raw = Partial<Booking> & { id: number };
  return ((data.docs || []) as Raw[])
    .map((b) => ({
      createdAt: b.createdAt || "",
      customerEmail: b.customerEmail || "",
      customerName: b.customerName || "",
      customerPhone: b.customerPhone || "",
      date: b.date || "",
      id: b.id,
      note: b.note || "",
      serviceTitle: b.serviceTitle || "Service supprimé",
      staffNote: b.staffNote || "",
      status: (BOOKING_STATUSES as readonly string[]).includes(b.status || "") ? (b.status as BookingStatus) : "pending",
      time: b.time || "",
    }))
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
}
