import type { CollectionConfig } from 'payload'

import { canManageInventory, isAdmin, isStaff, staffOnlyInAdmin } from '../access/roles'

export const STOCK_MOVEMENT_SOURCES = ['import', 'manual', 'order', 'adjustment', 'restock'] as const

/**
 * Append-only audit log — every change to a product's stock (from the bulk
 * importer or elsewhere) writes one row here. Never edited after the fact,
 * only created; deletable by an admin only, for correcting genuine mistakes.
 */
export const StockMovements: CollectionConfig = {
  slug: 'stock-movements',
  access: {
    admin: staffOnlyInAdmin,
    create: canManageInventory,
    delete: isAdmin,
    read: isStaff,
    update: () => false,
  },
  admin: {
    defaultColumns: ['product', 'delta', 'previousStock', 'newStock', 'source', 'createdAt'],
    description: 'Audit log of every stock change. Read-only once created.',
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      // Not `required: true`: this is a permanent audit log, and a deleted
      // product must not drag its stock-movement history down with it (or
      // block the delete outright via a NOT NULL FK) — the row just loses
      // its product link and stays as historical evidence.
      admin: { description: 'Required in practice — left DB-nullable so a later product deletion never crashes or erases this record.' },
      relationTo: 'products',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'previousStock',
          type: 'number',
          required: true,
        },
        {
          name: 'newStock',
          type: 'number',
          required: true,
        },
        {
          name: 'delta',
          type: 'number',
          admin: { description: 'newStock - previousStock, positive or negative.' },
          required: true,
        },
      ],
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [...STOCK_MOVEMENT_SOURCES],
      required: true,
    },
    {
      name: 'reason',
      type: 'text',
      admin: { description: 'e.g. "Import CSV — 2026-08-10", "Correction manuelle", or a restock note.' },
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
      name: 'reference',
      type: 'text',
      admin: { description: 'Optional purchase order / invoice reference for a restock.' },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      admin: { description: 'The staff member who performed this movement — empty for automated sources (import, order).' },
      relationTo: 'users',
    },
  ],
}
