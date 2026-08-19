import type { OrderStatus } from '../orderStatus'

export const NOTIFICATION_EVENTS = [
  'ORDER_CREATED',
  'ORDER_CONFIRMED',
  'ORDER_PREPARING',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'ORDER_RETURNED',
  'ORDER_REFUNDED',
] as const

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]

export const NOTIFICATION_CHANNELS = ['email', 'whatsapp', 'push', 'internal'] as const
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

export const NOTIFICATION_STATUSES = ['pending', 'sent', 'failed', 'read'] as const
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]

/** Which event a status change announces. Statuses with no customer-facing
 * meaning simply map to nothing and produce no notification. */
export const STATUS_EVENT: Partial<Record<OrderStatus, NotificationEvent>> = {
  cancelled: 'ORDER_CANCELLED',
  confirmed: 'ORDER_CONFIRMED',
  delivered: 'ORDER_DELIVERED',
  preparing: 'ORDER_PREPARING',
  refunded: 'ORDER_REFUNDED',
  returned: 'ORDER_RETURNED',
  shipped: 'ORDER_SHIPPED',
}

/** The data every template and provider receives. Amounts are snapshots from
 * the order row — no pricing is ever recomputed here. */
export type NotificationContext = {
  orderId: number
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  total: number
  itemCount: number
  status: OrderStatus
  event: NotificationEvent
}

export type DeliveryResult =
  | { ok: true; skipped?: false }
  /** The channel has no provider configured. Nothing was sent and nothing is
   * pretended: the notification is recorded as `pending`, not `sent`. */
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; error: string }

export type NotificationProvider = {
  readonly channel: NotificationChannel
  /** False when the provider has no credentials. Callers must not report a
   * delivery in that case. */
  isConfigured(): boolean
  /** Why it is unconfigured, listing the env vars that would enable it. */
  disabledReason(): string
}

export type EmailPayload = {
  to: string
  subject: string
  template: string
  data: Record<string, unknown>
  text: string
}

export type WhatsAppPayload = {
  phone: string
  template: string
  variables: Record<string, string>
}

export type PushPayload = {
  subscription: { auth: string; endpoint: string; p256dh: string }
  title: string
  body: string
  url?: string
}

export type EmailNotificationProvider = NotificationProvider & {
  readonly channel: 'email'
  send(payload: EmailPayload): Promise<DeliveryResult>
}

export type WhatsAppNotificationProvider = NotificationProvider & {
  readonly channel: 'whatsapp'
  send(payload: WhatsAppPayload): Promise<DeliveryResult>
}

export type PushNotificationProvider = NotificationProvider & {
  readonly channel: 'push'
  send(payload: PushPayload): Promise<DeliveryResult>
}
