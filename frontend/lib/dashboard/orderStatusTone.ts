import type { OrderStatus } from "@/lib/dashboard/orders-types";

/**
 * One hue per order status, in the two forms the dashboard needs.
 *
 * This replaces ORDER_STATUS_DOT, which held the same decision as fixed
 * Tailwind utilities. Two things forced the move:
 *
 *  - those utilities have no dark variant, so bg-amber-500 stayed a
 *    light-theme amber on a neutral-900 card;
 *  - recharts needs a colour *value*, not a class, so the status chart could
 *    not read that record at all and fell back to colouring bars by array
 *    index — which made "Livrée" emerald in the calendar and the fourth
 *    series colour in the chart beside it.
 *
 * Both forms resolve to the same `--status-*` token, so the calendar dot, the
 * filter chip and the chart bar for a given status are the same colour in
 * both themes, and a hue is changed in exactly one place.
 *
 * `cssVar` is a `var()` reference rather than a resolved value on purpose:
 * handed to an SVG `fill`, it re-resolves when `.dark` flips, with no
 * JavaScript reading computed styles and no re-render.
 */
export type StatusTone = {
  /** Tailwind class for a filled swatch — dots, chips. */
  dotClass: string;
  /** For SVG fill/stroke, where a class cannot be used. */
  cssVar: string;
};

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  // Waiting on someone: warm, unresolved.
  pending: { dotClass: "bg-status-pending", cssVar: "var(--status-pending)" },
  confirmed: { dotClass: "bg-status-confirmed", cssVar: "var(--status-confirmed)" },
  preparing: { dotClass: "bg-status-preparing", cssVar: "var(--status-preparing)" },
  shipped: { dotClass: "bg-status-shipped", cssVar: "var(--status-shipped)" },
  // The one good terminal state.
  delivered: { dotClass: "bg-status-delivered", cssVar: "var(--status-delivered)" },
  // The three ways an order ends without revenue, kept adjacent in hue so
  // they read as one family at a glance.
  cancelled: { dotClass: "bg-status-cancelled", cssVar: "var(--status-cancelled)" },
  returned: { dotClass: "bg-status-returned", cssVar: "var(--status-returned)" },
  refunded: { dotClass: "bg-status-refunded", cssVar: "var(--status-refunded)" },
};
