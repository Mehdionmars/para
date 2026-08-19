/**
 * The order lifecycle, as a state machine.
 *
 * This module is the single source of truth for what an order may become.
 * The Orders collection enforces it in a beforeChange hook, so it holds for
 * every writer — the dashboard, Payload's own admin UI, and any direct REST
 * call alike. The dashboard's status dropdown reads the same table (mirrored
 * in frontend/lib/dashboard/orders-types.ts) purely to avoid offering a
 * choice that the server would reject; it is a courtesy, never the check.
 */

export const ORDER_STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
] as const

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number]

/**
 * Allowed moves. An empty array is a terminal state.
 *
 * Cancellation is available up to `preparing` — once the parcel is with the
 * carrier the goods are gone, and the way back is delivered → returned →
 * refunded, which is what the physical process actually looks like.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  cancelled: [],
  confirmed: ['preparing', 'cancelled'],
  delivered: ['returned'],
  pending: ['confirmed', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  refunded: [],
  returned: ['refunded'],
  shipped: ['delivered'],
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  cancelled: 'Annulée',
  confirmed: 'Confirmée',
  delivered: 'Livrée',
  pending: 'En attente',
  preparing: 'En préparation',
  refunded: 'Remboursée',
  returned: 'Retournée',
  shipped: 'Expédiée',
}

/** Statuses that mean the goods are not going to the customer, so the units
 * held by this order belong back on the shelf. */
export const STOCK_RELEASING_STATUSES: readonly OrderStatus[] = ['cancelled', 'returned', 'refunded']

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUS_OPTIONS as readonly string[]).includes(value)
}

/** Whether this status means the reserved units belong back on the shelf. */
export function isStockReleasing(value: unknown): boolean {
  return typeof value === 'string' && (STOCK_RELEASING_STATUSES as readonly string[]).includes(value)
}

/**
 * Whether `from` may become `to`.
 *
 * Staying put returns true: saving an order to edit its notes or address
 * re-submits the current status, and that must not be read as an illegal
 * self-transition.
 */
export function canTransition(from: unknown, to: unknown): boolean {
  if (!isOrderStatus(to)) return false
  // No previous status at all (creation) — any status is a valid starting
  // point, because nothing has been promised to the customer yet.
  if (!isOrderStatus(from)) return true
  if (from === to) return true
  return ORDER_STATUS_TRANSITIONS[from].includes(to)
}

/** Human-readable refusal, for the API error the operator actually sees. */
export function transitionError(from: OrderStatus, to: OrderStatus): string {
  const allowed = ORDER_STATUS_TRANSITIONS[from]
  if (allowed.length === 0) {
    return `La commande est ${ORDER_STATUS_LABELS[from].toLowerCase()} : ce statut est définitif et ne peut plus changer.`
  }
  const list = allowed.map((s) => ORDER_STATUS_LABELS[s]).join(', ')
  return `Transition impossible : « ${ORDER_STATUS_LABELS[from]} » → « ${ORDER_STATUS_LABELS[to]} ». Seul(s) « ${list} » est/sont possible(s).`
}
