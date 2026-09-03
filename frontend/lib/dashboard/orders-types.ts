export const ORDER_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];

/**
 * Mirror of backend/src/lib/orderStatus.ts.
 *
 * Used only to avoid offering the operator a choice the server will reject.
 * The enforcement lives in the Orders beforeChange hook — if these two ever
 * drift, the server wins and the UI simply shows one option too many or too
 * few, never an illegal transition that goes through.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  cancelled: [],
  confirmed: ["preparing", "cancelled"],
  delivered: ["returned"],
  pending: ["confirmed", "cancelled"],
  preparing: ["shipped", "cancelled"],
  refunded: [],
  returned: ["refunded"],
  shipped: ["delivered"],
};

export const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS_OPTIONS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  cancelled: "Annulée",
  confirmed: "Confirmée",
  delivered: "Livrée",
  pending: "En attente",
  preparing: "En préparation",
  refunded: "Remboursée",
  returned: "Retournée",
  shipped: "Expédiée",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  failed: "Échouée",
  paid: "Payée",
  pending: "En attente",
  refunded: "Remboursée",
};

export type PaymentMethod = "cash_on_delivery" | "bank_transfer";

/**
 * Stored codes to French, in one place.
 *
 * The legacy keys are kept deliberately. Orders placed before the payment
 * methods were made configurable stored the display string "À la livraison"
 * directly, and the dashboard's earlier map was keyed "cod"/"cmi" — which
 * matched none of them. A migration rewrote the column, but a label map that
 * silently returns undefined is exactly the failure that hid the problem for
 * 323 orders, so anything unrecognised falls back to the raw value rather
 * than to a blank.
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  bank_transfer: "Virement bancaire",
  cod: "Paiement à la livraison",
  cmi: "Carte bancaire (CMI)",
};

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return "Mode de paiement non précisé";
  return PAYMENT_METHOD_LABELS[value.toLowerCase()] || value;
}

/** The happy path, in order, for the customer-facing timeline. Terminal
 * states (cancelled/returned/refunded) are shown separately because they end
 * the journey rather than advancing it. */
export const ORDER_TIMELINE_STEPS: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_BADGE: Record<OrderStatus, "info" | "success" | "warning" | "danger"> = {
  cancelled: "danger",
  confirmed: "info",
  delivered: "success",
  pending: "warning",
  preparing: "info",
  refunded: "danger",
  returned: "warning",
  shipped: "info",
};

/**
 * One colour per status, for the overview calendar.
 *
 * ORDER_STATUS_BADGE beside it cannot do this job: it maps onto the five
 * Badge variants, so confirmed, preparing and shipped all come out "info" —
 * fine for a label that carries its own text, useless for a dot that has
 * nothing but its colour. Written as whole class names because that is what
 * Tailwind's scanner looks for; a built `bg-${x}-500` would never be emitted.
 */
export const ORDER_STATUS_DOT: Record<OrderStatus, string> = {
  cancelled: "bg-red-500",
  confirmed: "bg-sky-500",
  delivered: "bg-emerald-500",
  pending: "bg-amber-500",
  preparing: "bg-indigo-500",
  refunded: "bg-rose-500",
  returned: "bg-orange-500",
  shipped: "bg-violet-500",
};

export type OrderItem = {
  id: string;
  product?: number | { id: number; name: string } | null;
  name: string;
  price: number;
  quantity: number;
  // Snapshotted with the name and the price, and null on a product that has
  // no options or on any order placed before variants were recorded. Never
  // re-derived from the product: its variant rows can be renamed, repriced or
  // deleted after the sale, and the order has to keep saying what shipped.
  variantId?: string | null;
  variantLabel?: string | null;
  variantType?: string | null;
  sku?: string | null;
};

/** "Contenance : 100 ml", or just "100 ml" when the dimension is unknown.
 * Empty when the line carries no variant, so a caller can render nothing. */
export function orderItemVariantLabel(item: OrderItem): string {
  if (!item.variantLabel) return "";
  return item.variantType ? `${item.variantType} : ${item.variantLabel}` : item.variantLabel;
}

export type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  couponCode?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type OrderStatusHistoryEntry = {
  id: number;
  fromStatus?: OrderStatus | null;
  toStatus: OrderStatus;
  changedByEmail?: string | null;
  reason?: string | null;
  createdAt: string;
};

export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  internal: "Interne",
  push: "Push",
  whatsapp: "WhatsApp",
};

export const RECIPIENT_LABELS: Record<string, string> = {
  customer: "Client",
  staff: "Équipe",
  supplier: "Fournisseur",
};

export const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  failed: "Échouée",
  pending: "En attente",
  read: "Lue",
  sent: "Envoyée",
};

export type NotificationRow = {
  id: number;
  order?: number | { id: number; orderNumber?: string } | null;
  product?: number | { id: number; name?: string } | null;
  customerEmail?: string | null;
  /** Who this row is addressed to. `recipientRef` is null for staff, whose
   * in-app inbox is shared and has no individual addressee. */
  recipientType?: "staff" | "customer" | "supplier" | null;
  recipientRef?: string | null;
  type: string;
  channel: string;
  status: string;
  title?: string | null;
  message?: string | null;
  sentAt?: string | null;
  readAt?: string | null;
  error?: string | null;
  attempts?: number | null;
  lastAttemptAt?: string | null;
  dedupeKey?: string | null;
  createdAt: string;
};

/** Maximum delivery attempts, mirrored from backend/src/lib/notifications/retry.ts.
 * Used only to disable the button — the server enforces the cap. */
export const MAX_DELIVERY_ATTEMPTS = 3;

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  BACK_IN_STOCK: "Retour en stock",
  LOW_STOCK: "Stock faible",
  ORDER_CANCELLED: "Commande annulée",
  ORDER_CONFIRMED: "Commande confirmée",
  ORDER_CREATED: "Nouvelle commande",
  ORDER_DELIVERED: "Commande livrée",
  ORDER_PREPARING: "En préparation",
  ORDER_REFUNDED: "Commande remboursée",
  ORDER_RETURNED: "Commande retournée",
  ORDER_SHIPPED: "Commande expédiée",
  OUT_OF_STOCK: "Rupture de stock",
};

export const STOCK_TYPES = ["LOW_STOCK", "OUT_OF_STOCK", "BACK_IN_STOCK"] as const;
export const ORDER_TYPES = [
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "ORDER_RETURNED",
  "ORDER_REFUNDED",
] as const;

/** @deprecated use STOCK_TYPES */
export const STOCK_NOTIFICATION_TYPES = STOCK_TYPES;

/** Which tab a notification belongs to. */
export function notificationGroup(type: string): "stock" | "orders" | "system" {
  if ((STOCK_TYPES as readonly string[]).includes(type)) return "stock";
  if (type.startsWith("ORDER_")) return "orders";
  return "system";
}

/** Where clicking a notification should take the operator. Null when the
 * notification references nothing that still exists. */
export function notificationHref(n: NotificationRow): string | null {
  const productId = typeof n.product === "object" && n.product ? n.product.id : n.product;
  if (productId) return `/dashboard/products/${productId}`;
  const orderId = typeof n.order === "object" && n.order ? n.order.id : n.order;
  if (orderId) return `/dashboard/orders/${orderId}`;
  return null;
}
