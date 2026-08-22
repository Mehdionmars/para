import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTicket } from "@/components/dashboard/orders/OrderTicket";
import { requireRole } from "@/lib/dashboard/guard";
import { getOrder } from "@/lib/dashboard/orders";
import { canEditOrders } from "@/lib/dashboard/roles";
import "./ticket.css";

export const metadata: Metadata = {
  title: "Ticket de commande — Para d'Hiver",
  robots: { index: false, follow: false },
};

/**
 * Printable ticket for one order.
 *
 * Same role guard as the order detail page — a ticket carries the
 * customer's name, phone and address, so it must not be reachable by anyone
 * who can't already open the order itself.
 *
 * `?autoprint=1` (how the order page links here) opens the browser's print
 * dialog on load; visiting the URL directly just shows the ticket.
 */
export default async function OrderPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  await requireRole(canEditOrders);
  const { id } = await params;
  const { autoprint } = await searchParams;

  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="ticket-page">
      <OrderTicket order={order} autoPrint={autoprint === "1"} />
    </div>
  );
}
