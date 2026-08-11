import type { CollectionConfig } from 'payload'

import { canManageInventory, isStaff, staffOnlyInAdmin } from '../access/roles'

/**
 * One row per received batch, separate from `products.stock` (the simple
 * running total the storefront reads). A product can have several open
 * batches at once with different expiry dates/suppliers — this is what the
 * bulk importer writes to when a row carries batch/expiry/supplier info.
 */
export const Inventory: CollectionConfig = {
  slug: 'inventory',
  access: {
    admin: staffOnlyInAdmin,
    create: canManageInventory,
    delete: canManageInventory,
    read: isStaff,
    update: canManageInventory,
  },
  admin: {
    defaultColumns: ['product', 'batchNumber', 'quantity', 'expiryDate', 'supplier'],
    description: 'Batch-level stock records (batch number, expiry, supplier). products.stock stays the single running total.',
    useAsTitle: 'batchNumber',
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      // Not `required: true` on purpose: that would make deleting a Product
      // crash every inventory record that references it (NOT NULL FK vs. a
      // delete that needs to SET NULL). Form-level guidance still expects
      // one to be picked; this only controls the DB column's nullability.
      admin: { description: 'Required in practice — left DB-nullable so deleting a product never crashes this record.' },
      relationTo: 'products',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'batchNumber',
          type: 'text',
        },
        {
          name: 'expiryDate',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
    },
    {
      name: 'quantity',
      type: 'number',
      min: 0,
      required: true,
    },
    {
      name: 'receivedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
      defaultValue: () => new Date().toISOString(),
    },
  ],
}
