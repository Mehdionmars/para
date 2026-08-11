import type { CollectionConfig, FieldAccess } from 'payload'

import { adminOrManager, canEditContent, hasRole, staffOnlyInAdmin } from '../access/roles'
import { slugField } from '../lib/slugField'

export const CATEGORY_OPTIONS = ['Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom'] as const

// stockManager can submit an update (collection-level), but field-level
// access below still confines what actually changes: everything except the
// stock quantity fields stays locked to content editors.
const contentFieldUpdate: FieldAccess = ({ req }) => canEditContent({ req })
const stockFieldUpdate: FieldAccess = ({ req }) => canEditContent({ req }) || hasRole(req, 'stockManager')
const contentFieldAccess = { update: contentFieldUpdate }
const stockFieldAccess = { update: stockFieldUpdate }

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    // Content editors and stockManager can both submit updates; field-level
    // `access.update` below is what actually limits stockManager to stock only.
    update: ({ req }) => canEditContent({ req }) || hasRole(req, 'stockManager'),
  },
  admin: {
    defaultColumns: ['name', 'brand', 'category', 'price', 'stock', 'isPublished', 'discontinued'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      access: contentFieldAccess,
      required: true,
    },
    slugField('name'),
    {
      name: 'brand',
      type: 'relationship',
      access: contentFieldAccess,
      // Not a DB-level `required: true` on purpose: that would make deleting
      // a Brand crash every product that references it. The admin form
      // (ProductForm's Zod schema) already enforces "brand required" at
      // save time — this only controls the nullable-vs-not-null column.
      relationTo: 'brands',
    },
    {
      name: 'category',
      type: 'select',
      access: contentFieldAccess,
      options: [...CATEGORY_OPTIONS],
      required: true,
    },
    {
      name: 'size',
      type: 'text',
      access: contentFieldAccess,
      admin: { description: 'e.g. "400 ml", "50 ml"' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          access: contentFieldAccess,
          min: 0,
          required: true,
        },
        {
          name: 'oldPrice',
          type: 'number',
          access: contentFieldAccess,
          admin: { description: 'Leave empty when there is no barred price.' },
          min: 0,
        },
      ],
    },
    {
      name: 'badge',
      type: 'text',
      access: contentFieldAccess,
      admin: { description: 'Small label on the product card, e.g. "-20%", "Nouveau". Leave empty for none.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rating',
          type: 'number',
          access: contentFieldAccess,
          defaultValue: 5,
          max: 5,
          min: 1,
        },
        {
          name: 'reviews',
          type: 'number',
          access: contentFieldAccess,
          defaultValue: 0,
          min: 0,
        },
      ],
    },
    {
      name: 'tint',
      type: 'text',
      access: contentFieldAccess,
      admin: { description: 'Hex background color shown behind the product image, e.g. #E7EFF3' },
      defaultValue: '#F2F2F2',
    },
    {
      name: 'description',
      type: 'textarea',
      access: contentFieldAccess,
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      access: contentFieldAccess,
      admin: { description: 'Imported products may not have one yet — add it here once available.' },
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      access: contentFieldAccess,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Stock',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'sku',
              type: 'text',
              access: contentFieldAccess,
              unique: true,
            },
            {
              name: 'barcode',
              type: 'text',
              access: contentFieldAccess,
              admin: { description: 'EAN / barcode — business key used for POS lookup and Excel import.' },
              unique: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'stock',
              type: 'number',
              access: stockFieldAccess,
              defaultValue: 0,
              min: 0,
            },
            {
              name: 'reservedStock',
              type: 'number',
              access: stockFieldAccess,
              defaultValue: 0,
              min: 0,
            },
            {
              name: 'lowStockThreshold',
              type: 'number',
              access: stockFieldAccess,
              defaultValue: 5,
              min: 0,
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isPublished',
          type: 'checkbox',
          access: contentFieldAccess,
          defaultValue: true,
        },
        {
          name: 'featured',
          type: 'checkbox',
          access: contentFieldAccess,
          admin: { description: 'Highlighted in featured/curated rails.' },
          defaultValue: false,
        },
        {
          name: 'discontinued',
          type: 'checkbox',
          access: contentFieldAccess,
          admin: { description: 'No longer sold — excluded from homepage rails even if stock remains, distinct from Brouillon.' },
          defaultValue: false,
        },
      ],
    },
  ],
}
