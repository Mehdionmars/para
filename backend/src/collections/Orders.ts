import { APIError, type CollectionConfig } from 'payload'

import { adminOrManager, canEditOrders, isStaff, staffOnlyInAdmin } from '../access/roles'
import { runSql, sql } from '../lib/db/exec'
import { notifyOrderEvent } from '../lib/notifications/service'
import { STATUS_EVENT } from '../lib/notifications/types'
import {
  canTransition,
  isOrderStatus,
  isStockReleasing,
  ORDER_STATUS_OPTIONS,
  STOCK_RELEASING_STATUSES,
  transitionError,
  type OrderStatus,
} from '../lib/orderStatus'

// Re-exported so existing importers keep working; the definitions now live in
// lib/orderStatus.ts alongside the transition table they belong with.
export { ORDER_STATUS_OPTIONS, STOCK_RELEASING_STATUSES }

export const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'] as const

const generateOrderNumber = () => {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PDH-${y}${m}${d}-${rand}`
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    admin: staffOnlyInAdmin,
    // Orders are created by the public checkout (no admin session) but only
    // readable/editable from the dashboard/admin — never listable by anyone else.
    create: () => true,
    delete: adminOrManager,
    // All staff can read (editor/stockManager are read-only — enforced by
    // `update` below granting only admin/manager/sales).
    read: isStaff,
    update: canEditOrders,
  },
  admin: {
    defaultColumns: ['orderNumber', 'customerName', 'total', 'status', 'paymentStatus', 'createdAt'],
    useAsTitle: 'orderNumber',
  },
  hooks: {
    beforeChange: [
      /**
       * The transition guard.
       *
       * Enforced here rather than in the dashboard action so it holds for
       * every writer — the dashboard, Payload's admin UI, and any direct
       * REST call. `originalDoc` is the row as stored, so this compares
       * against reality rather than against whatever the client claimed the
       * previous status was.
       */
      ({ data, operation, originalDoc }) => {
        if (operation !== 'update') return data

        const from = originalDoc?.status
        const to = data?.status
        // Not touching the status at all (editing notes, address, payment).
        if (to === undefined || to === null) return data

        if (!canTransition(from, to)) {
          if (!isOrderStatus(to)) throw new APIError(`Statut inconnu : « ${String(to)} ».`, 400)
          throw new APIError(transitionError(from as OrderStatus, to), 400)
        }
        return data
      },
    ],
    afterChange: [
      /**
       * History + notification.
       *
       * Runs before the stock hook below so the audit entry exists even if
       * the stock restoration fails; the two are independent concerns and a
       * missing history row would be the harder failure to diagnose.
       */
      async ({ doc, operation, previousDoc, req }) => {
        const from = previousDoc?.status
        const to = doc?.status
        if (!isOrderStatus(to)) return
        // Only a real change is recorded. Re-saving an order to fix a typo in
        // the address must not litter the history with no-op entries.
        if (operation === 'update' && from === to) return
        if (operation === 'create' && to === 'pending') {
          // The creation entry is written by the checkout route, which knows
          // the reason; a bare "created as pending" here would duplicate it.
          return
        }

        const actor = req.user as { id?: number; email?: string } | null | undefined

        const fromStatus = isOrderStatus(from) ? from : null
        const reason = operation === 'create' ? 'Création de la commande' : null

        // runSql, not payload.db.pool: this hook runs inside the transaction
        // that is updating the order, which holds a lock on that row. A
        // statement on a separate connection inserting a row whose foreign
        // key points back at it would wait on a lock this very hook is
        // holding up. See lib/db/exec.ts.
        try {
          await runSql(
            req,
            sql`INSERT INTO order_status_history
                  (order_id, from_status, to_status, changed_by_id, changed_by_email, reason, updated_at, created_at)
                VALUES (${doc.id}, ${fromStatus}::"enum_orders_status", ${to}::"enum_orders_status",
                        ${actor?.id ?? null}, ${actor?.email ?? null}, ${reason}, now(), now())`,
          )
        } catch (err) {
          req.payload.logger.error({ err }, `Historique de statut non écrit pour ${doc?.orderNumber}`)
        }

        const event = STATUS_EVENT[to]
        if (!event) return

        // Notification failures never fail the status change: the order has
        // already moved, and refusing the save would leave the operator
        // unable to advance a commande because an SMTP host is down.
        await notifyOrderEvent({ event, order: doc, payload: req.payload, req }).catch((err) =>
          req.payload.logger.error({ err }, `Notification ${event} échouée pour ${doc?.orderNumber}`),
        )
      },
      /**
       * Stock restoration — unchanged from the mechanism already in
       * production. It stays a separate hook so the transition guard and the
       * history above can never alter its behaviour.
       */
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== 'update') return

        const wasReleasing = isStockReleasing(previousDoc?.status)
        const isReleasing = isStockReleasing(doc?.status)

        // Only the *transition* into a releasing status gives stock back.
        // Re-saving an already-cancelled order, or moving between cancelled
        // and refunded, must not credit the same units twice — that would
        // silently inflate stock every time an operator touches the record.
        if (wasReleasing || !isReleasing) return

        const items = (doc?.items ?? []) as { product?: number | { id: number } | null; quantity?: number; name?: string }[]
        if (items.length === 0) return

        const pool = req.payload.db.pool
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          for (const item of items) {
            const productId = typeof item.product === 'object' && item.product ? item.product.id : item.product
            const quantity = Number(item.quantity)
            if (!productId || !Number.isInteger(quantity) || quantity <= 0) continue

            const restored = await client.query(
              'UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2 RETURNING stock',
              [quantity, productId],
            )
            // A product deleted since the order was placed has nothing to
            // credit — the order keeps its snapshot either way.
            if (restored.rowCount === 0) continue

            const newStock = Number(restored.rows[0].stock)
            await client.query(
              `INSERT INTO stock_movements
                 (product_id, previous_stock, new_stock, delta, source, reason, updated_at, created_at)
               VALUES ($1, $2, $3, $4, 'order', $5, now(), now())`,
              [productId, newStock - quantity, newStock, quantity, `Retour stock — commande ${doc.orderNumber} (${doc.status})`],
            )
          }
          await client.query('COMMIT')
        } catch (err) {
          await client.query('ROLLBACK').catch(() => {})
          req.payload.logger.error({ err }, `Restauration de stock échouée pour la commande ${doc?.orderNumber}`)
        } finally {
          client.release()
        }
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      admin: { position: 'sidebar' },
      defaultValue: generateOrderNumber,
      unique: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', type: 'text', required: true },
        { name: 'customerEmail', type: 'email', required: true },
        { name: 'customerPhone', type: 'text' },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'textarea',
    },
    {
      name: 'items',
      type: 'array',
      admin: { description: 'Snapshotted at order time — editing a product later never changes past orders.' },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'name', type: 'text', required: true },
        { name: 'price', type: 'number', min: 0, required: true },
        { name: 'quantity', type: 'number', min: 1, required: true },
      ],
      required: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', min: 0, required: true },
        {
          name: 'discount',
          type: 'number',
          admin: { description: 'Remise appliquée, calculée côté serveur au moment de la commande.', readOnly: true },
          defaultValue: 0,
          label: 'Remise (MAD)',
          min: 0,
        },
        { name: 'shipping', type: 'number', defaultValue: 0, min: 0 },
        { name: 'total', type: 'number', min: 0, required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'couponCode',
          type: 'text',
          // Snapshotted rather than only related: a coupon renamed or deleted
          // later must not erase what this customer actually used.
          admin: { description: 'Code tel qu\'appliqué.', readOnly: true },
          label: 'Code promo',
        },
        {
          name: 'coupon',
          type: 'relationship',
          admin: { readOnly: true },
          label: 'Coupon',
          relationTo: 'coupons',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'pending',
          options: [...ORDER_STATUS_OPTIONS],
          required: true,
        },
        {
          name: 'paymentStatus',
          type: 'select',
          defaultValue: 'pending',
          options: [...PAYMENT_STATUS_OPTIONS],
          required: true,
        },
        {
          name: 'paymentMethod',
          type: 'text',
          admin: { description: 'e.g. "CMI" or "À la livraison"' },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
