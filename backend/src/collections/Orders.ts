import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { PAYMENT_METHOD_OPTIONS } from '../globals/PaymentSettings'

import { adminOrManager, canEditOrders, isStaff, staffOnlyInAdmin } from '../access/roles'
import { runSql, sql } from '../lib/db/exec'
import { notifyOrderEvent } from '../lib/notifications/service'
import { nextOrderNumberFromPayload } from '../lib/orderNumber'
import { notifyStockChange, type StockChange } from '../lib/notifications/stock'
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

/**
 * Draws from `order_number_seq` instead of four random characters — see
 * lib/orderNumber.ts for why the random suffix was a real collision risk
 * rather than a theoretical one.
 *
 * Only fires for orders created outside the checkout (the admin UI, a phone
 * sale); /api/checkout draws its own number inside its transaction.
 */
const generateOrderNumber = async ({ req }: { req: PayloadRequest }) =>
  nextOrderNumberFromPayload(req.payload)

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    admin: staffOnlyInAdmin,
    // Was `() => true`, which let *anyone* craft an order with any total, any
    // paymentStatus and any status, and without decrementing a single unit of
    // stock — /api/checkout was simply the polite way in.
    //
    // Now the same staff who may edit an order may create one, which is what
    // the back office needs for a phone or counter sale. The public checkout
    // is unaffected: it writes through `payload.create`, the Local API, whose
    // `overrideAccess` defaults to true.
    create: canEditOrders,
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

        const items = (doc?.items ?? []) as {
          product?: number | { id: number } | null
          quantity?: number
          name?: string
          variantId?: string | null
        }[]
        if (items.length === 0) return

        const restocked: StockChange[] = []
        const pool = req.payload.db.pool
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          for (const item of items) {
            const productId = typeof item.product === 'object' && item.product ? item.product.id : item.product
            const quantity = Number(item.quantity)
            if (!productId || !Number.isInteger(quantity) || quantity <= 0) continue

            // The checkout decrements *two* counters for a variant line — the
            // product's own stock and the variant row's — but this hook only
            // ever credited the first one back. Cancelling an order for a
            // variant therefore left `products_variants.stock` permanently
            // short by the quantity sold, and no amount of re-cancelling or
            // re-saving would recover it: the units simply disappeared from
            // the option that was actually returned to the shelf.
            //
            // `_parent_id` is checked as well as the row id so a stale
            // variantId from a since-edited product can never credit another
            // product's option.
            if (item.variantId) {
              await client.query(
                'UPDATE products_variants SET stock = stock + $1 WHERE id = $2 AND _parent_id = $3',
                [quantity, item.variantId, productId],
              )
            }

            const restored = await client.query(
              'UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2 RETURNING name, stock, low_stock_threshold',
              [quantity, productId],
            )
            // A product deleted since the order was placed has nothing to
            // credit — the order keeps its snapshot either way.
            if (restored.rowCount === 0) continue

            const newStock = Number(restored.rows[0].stock)
            // Returning units can take a product back above zero — that is a
            // BACK_IN_STOCK, and the shop wants to know it can sell again.
            restocked.push({
              lowStockThreshold: Number(restored.rows[0].low_stock_threshold) || 0,
              newStock,
              occurrenceId: `order-restore-${doc.id}`,
              previousStock: newStock - quantity,
              productId: Number(productId),
              productName: String(restored.rows[0].name),
            })
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

        // After the stock transaction closed, and never able to undo it.
        for (const change of restocked) {
          await notifyStockChange({ change, payload: req.payload }).catch(() => {})
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
        // Which variant was bought, snapshotted like the name and the price
        // and for the same reason: the product's variant rows can be renamed,
        // repriced or deleted after the sale, and the order has to keep
        // saying what was actually shipped. Null on a product with no
        // variants, and on every order placed before this existed.
        {
          name: 'variantId',
          type: 'text',
          admin: { description: "Identifiant de la ligne de variante au moment de la commande." },
          label: 'ID variante',
        },
        {
          name: 'variantLabel',
          type: 'text',
          admin: { description: 'Ex. « 100 ml ».' },
          label: 'Variante',
        },
        {
          name: 'variantType',
          type: 'text',
          admin: { description: 'La dimension de la variante — ex. « Contenance ».' },
          label: 'Type de variante',
        },
        { name: 'sku', type: 'text', label: 'SKU' },
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
          // A select, like paymentStatus beside it. As free text this held
          // the display string 'À la livraison' on every order, so the
          // dashboard's own label map never matched and the wording became
          // the data. Values are codes; PAYMENT_METHOD_LABELS renders them.
          name: 'paymentMethod',
          type: 'select',
          defaultValue: 'cash_on_delivery',
          options: [...PAYMENT_METHOD_OPTIONS],
          admin: { description: 'Renseigné par le checkout. Modifiable ici si la commande est prise par téléphone.' },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
