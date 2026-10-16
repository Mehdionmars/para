/** Booking types and labels, safe to import from client components (the
 * fetching half lives in bookings.ts, which is server-only). */

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "done"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  cancelled: "Annulé",
  confirmed: "Confirmé",
  done: "Terminé",
  pending: "En attente",
};

export type Booking = {
  id: number;
  serviceTitle: string;
  date: string;
  time: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note: string;
  staffNote: string;
  createdAt: string;
};
