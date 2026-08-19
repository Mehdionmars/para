import type { CollectionConfig } from 'payload'

import { adminOrManager, isStaff, staffOnlyInAdmin } from '../access/roles'

/**
 * One row per coupon actually applied to an order.
 *
 * This is what makes `perCustomerLimit` enforceable: the counter on the
 * coupon itself only knows the global total, so a per-customer rule needs to
 * know *who* redeemed it. It doubles as the usage history an operator can
 * audit when a customer disputes a discount.
 *
 * Written by the checkout endpoint only — never by the storefront.
 */
export const CouponRedemptions: CollectionConfig = {
  slug: 'coupon-redemptions',
  access: {
    admin: staffOnlyInAdmin,
    // Created server-side by the checkout route, which runs without an admin
    // session; the route is the only caller.
    create: () => true,
    delete: adminOrManager,
    read: isStaff,
    // Immutable by design: a redemption is a historical fact. Correcting a
    // mistake means refunding the order, not rewriting the ledger.
    update: () => false,
  },
  admin: {
    defaultColumns: ['coupon', 'customerEmail', 'discountAmount', 'order', 'createdAt'],
    description: 'Historique des coupons utilisés. En lecture seule.',
    useAsTitle: 'customerEmail',
  },
  fields: [
    { name: 'coupon', type: 'relationship', index: true, label: 'Coupon', relationTo: 'coupons', required: true },
    { name: 'order', type: 'relationship', label: 'Commande', relationTo: 'orders' },
    {
      name: 'customerEmail',
      type: 'text',
      admin: { description: 'Normalisé en minuscules — la limite par client se compte dessus.' },
      index: true,
      label: 'Email client',
      required: true,
    },
    { name: 'code', type: 'text', admin: { description: 'Code tel qu\'appliqué, conservé même si le coupon est renommé ou supprimé.' }, label: 'Code' },
    { name: 'discountAmount', type: 'number', label: 'Remise accordée (MAD)', min: 0, required: true },
    { name: 'orderSubtotal', type: 'number', label: 'Sous-total au moment de l\'achat (MAD)', min: 0 },
  ],
}
