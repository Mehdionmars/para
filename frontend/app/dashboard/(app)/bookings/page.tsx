import { BookingsBoard } from "@/components/dashboard/bookings/BookingsBoard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { casablancaToday, listBookings } from "@/lib/dashboard/bookings";
import { requireRole } from "@/lib/dashboard/guard";
import { isStaffUser } from "@/lib/dashboard/roles";

/** Service appointments booked from the storefront's /services pages. */
export default async function BookingsPage() {
  await requireRole(isStaffUser);
  const today = casablancaToday();
  const bookings = await listBookings(today);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rendez-vous"
        description="Les demandes de rendez-vous faites sur le site. Une demande arrive « En attente » : appelez le client, puis confirmez-la ou annulez-la. Annuler libère le créneau."
      />
      <BookingsBoard bookings={bookings} today={today} />
    </div>
  );
}
