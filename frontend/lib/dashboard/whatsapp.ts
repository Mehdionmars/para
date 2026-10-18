import { toWhatsAppNumber } from "@/lib/contact";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/dashboard/orders-types";

/**
 * WhatsApp click-to-chat for the dashboard: a wa.me link that opens a chat
 * with the customer, the message already written. The operator reads it and
 * presses Envoyer from the shop's own WhatsApp — nothing is sent by the
 * server, nothing needs a Business API account.
 */

/** A Moroccan number as wa.me wants it: digits only, country code first.
 * "06 19 96 90 07" → "212619969007". Null when there is no usable number. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  return toWhatsAppNumber(phone) || null;
}

/** The wa.me link, or null when the phone cannot be dialled. */
export function whatsappLink(phone: string | null | undefined, message?: string): string | null {
  const number = whatsappNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

const SIGNATURE = "\n\n— Para d'Hiver, Aïn Sebaâ";

function firstName(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first ? ` ${first.charAt(0).toUpperCase()}${first.slice(1)}` : "";
}

/** The message that fits where the order stands. */
export function orderMessage(order: { customerName?: string | null; orderNumber: string; status: OrderStatus; total?: number }): string {
  const hi = `Bonjour${firstName(order.customerName)},`;
  const n = order.orderNumber;
  const body: Partial<Record<OrderStatus, string>> = {
    cancelled: `votre commande ${n} a été annulée. Si ce n'est pas vous, répondez à ce message et nous regardons ensemble.`,
    confirmed: `votre commande ${n} est confirmée. Nous la préparons et vous prévenons dès son expédition.`,
    delivered: `votre commande ${n} vous a été livrée. Merci de votre confiance ! Une question sur vos produits ? Nous sommes là.`,
    pending: `nous avons bien reçu votre commande ${n}${order.total != null ? ` (${order.total.toLocaleString("fr-FR")} MAD)` : ""}. Pouvez-vous nous confirmer l'adresse de livraison ?`,
    preparing: `votre commande ${n} est en préparation. Elle part très bientôt.`,
    refunded: `le remboursement de votre commande ${n} a été effectué.`,
    returned: `nous avons bien reçu le retour de votre commande ${n}. Le remboursement suit sous quelques jours.`,
    shipped: `votre commande ${n} est en route ! Le livreur vous contactera pour la remise.`,
  };
  return `${hi} ${body[order.status] ?? `à propos de votre commande ${n} (${ORDER_STATUS_LABELS[order.status]}).`}${SIGNATURE}`;
}

/** The message for an appointment, by where it stands. */
export function bookingMessage(booking: { customerName?: string | null; serviceTitle: string; date: string; time: string; status: string }): string {
  const hi = `Bonjour${firstName(booking.customerName)},`;
  const [y, m, d] = booking.date.split("-").map(Number);
  const when = `le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", weekday: "long" }).format(new Date(y, m - 1, d))} à ${booking.time}`;
  const body: Record<string, string> = {
    cancelled: `votre rendez-vous « ${booking.serviceTitle} » ${when} est annulé. Souhaitez-vous choisir un autre créneau ?`,
    confirmed: `votre rendez-vous « ${booking.serviceTitle} » est confirmé ${when}. À bientôt à l'institut !`,
    done: `merci pour votre visite ! N'hésitez pas à reprendre rendez-vous quand vous le souhaitez.`,
    pending: `nous avons bien reçu votre demande de rendez-vous « ${booking.serviceTitle} » ${when}. Pouvez-vous nous confirmer ce créneau ?`,
  };
  return `${hi} ${body[booking.status] ?? body.pending}${SIGNATURE}`;
}

/** A plain hello, for a customer page with no particular order in view. */
export function customerMessage(name: string | null | undefined): string {
  return `Bonjour${firstName(name)},${SIGNATURE}`;
}
