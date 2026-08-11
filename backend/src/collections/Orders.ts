import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditOrders, isStaff, staffOnlyInAdmin } from '../access/roles'

export const ORDER_STATUS_OPTIONS = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

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
        { name: 'shipping', type: 'number', defaultValue: 0, min: 0 },
        { name: 'total', type: 'number', min: 0, required: true },
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
