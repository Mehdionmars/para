import type { NotificationContext, NotificationEvent } from './types'

/**
 * Message bodies, one per event, shared by every channel.
 *
 * Keeping subject/title/body together means the in-app bell, the email and
 * the WhatsApp message always say the same thing about the same order — a
 * customer who reads two of them never sees a contradiction.
 *
 * `template` is the identifier a real provider maps to its own stored
 * template (Resend/SendGrid HTML, or a WhatsApp Business approved template).
 * The rendered `text` is the fallback body, used as-is by the internal
 * channel and by any provider that sends plain text.
 */

const money = (n: number) => `${new Intl.NumberFormat('fr-MA').format(Math.round(n))} MAD`

type Rendered = {
  /** Email template id + subject line. */
  emailTemplate: string
  subject: string
  /** WhatsApp approved-template id. */
  whatsappTemplate: string
  /** Short heading for the bell and the push notification. */
  title: string
  /** Full body, plain text. */
  text: string
}

export function renderNotification(ctx: NotificationContext): Rendered {
  const items = `${ctx.itemCount} article${ctx.itemCount > 1 ? 's' : ''}`

  const byEvent: Record<NotificationEvent, Rendered> = {
    ORDER_CANCELLED: {
      emailTemplate: 'order-cancelled',
      subject: `Commande ${ctx.orderNumber} annulée`,
      text: `Bonjour ${ctx.customerName}, votre commande ${ctx.orderNumber} a été annulée. Les articles ont été remis en stock. Si vous n'êtes pas à l'origine de cette annulation, contactez-nous.`,
      title: `Commande ${ctx.orderNumber} annulée`,
      whatsappTemplate: 'order_cancelled',
    },
    ORDER_CONFIRMED: {
      emailTemplate: 'order-confirmed',
      subject: `Commande ${ctx.orderNumber} confirmée`,
      text: `Bonjour ${ctx.customerName}, votre commande ${ctx.orderNumber} est confirmée (${items}, ${money(ctx.total)}). Nous la préparons très bientôt.`,
      title: `Commande ${ctx.orderNumber} confirmée`,
      whatsappTemplate: 'order_confirmed',
    },
    ORDER_CREATED: {
      emailTemplate: 'order-confirmed',
      subject: `Nous avons bien reçu votre commande ${ctx.orderNumber}`,
      text: `Bonjour ${ctx.customerName}, merci ! Nous avons bien reçu votre commande ${ctx.orderNumber} (${items}, ${money(ctx.total)}). Vous recevrez un message dès sa confirmation.`,
      title: `Commande ${ctx.orderNumber} reçue`,
      whatsappTemplate: 'order_confirmed',
    },
    ORDER_DELIVERED: {
      emailTemplate: 'order-delivered',
      subject: `Commande ${ctx.orderNumber} livrée`,
      text: `Bonjour ${ctx.customerName}, votre commande ${ctx.orderNumber} a été livrée. Merci de votre confiance — n'hésitez pas à nous dire ce que vous en pensez.`,
      title: `Commande ${ctx.orderNumber} livrée`,
      whatsappTemplate: 'order_delivered',
    },
    ORDER_PREPARING: {
      emailTemplate: 'order-preparing',
      subject: `Commande ${ctx.orderNumber} en préparation`,
      text: `Bonjour ${ctx.customerName}, votre commande ${ctx.orderNumber} est en cours de préparation dans notre parapharmacie.`,
      title: `Commande ${ctx.orderNumber} en préparation`,
      whatsappTemplate: 'order_preparing',
    },
    ORDER_REFUNDED: {
      emailTemplate: 'order-refunded',
      subject: `Commande ${ctx.orderNumber} remboursée`,
      text: `Bonjour ${ctx.customerName}, le remboursement de votre commande ${ctx.orderNumber} (${money(ctx.total)}) a été traité.`,
      title: `Commande ${ctx.orderNumber} remboursée`,
      whatsappTemplate: 'order_refunded',
    },
    ORDER_RETURNED: {
      emailTemplate: 'order-returned',
      subject: `Retour de la commande ${ctx.orderNumber} enregistré`,
      text: `Bonjour ${ctx.customerName}, nous avons enregistré le retour de votre commande ${ctx.orderNumber}. Le remboursement suit sous peu.`,
      title: `Retour ${ctx.orderNumber} enregistré`,
      whatsappTemplate: 'order_returned',
    },
    ORDER_SHIPPED: {
      emailTemplate: 'order-shipped',
      subject: `Commande ${ctx.orderNumber} expédiée`,
      text: `Bonjour ${ctx.customerName}, votre commande ${ctx.orderNumber} vient d'être expédiée. Elle arrive bientôt !`,
      title: `Commande ${ctx.orderNumber} expédiée`,
      whatsappTemplate: 'order_shipped',
    },
  }

  return byEvent[ctx.event]
}

/** Variables handed to an external template engine, as strings. */
export function templateVariables(ctx: NotificationContext): Record<string, string> {
  return {
    customerName: ctx.customerName,
    itemCount: String(ctx.itemCount),
    orderNumber: ctx.orderNumber,
    status: ctx.status,
    total: money(ctx.total),
  }
}
