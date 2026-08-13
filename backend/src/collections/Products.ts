import { APIError } from 'payload'
import type { CollectionConfig, FieldAccess, PayloadRequest, Where } from 'payload'

import { adminOrManager, canEditContent, hasRole, staffOnlyInAdmin } from '../access/roles'
import { slugField } from '../lib/slugField'

export const CATEGORY_OPTIONS = ['Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom'] as const

export const VARIANT_OPTION_TYPES = [
  { label: 'Contenance', value: 'contenance' },
  { label: 'Format', value: 'format' },
  { label: 'Taille', value: 'taille' },
  { label: 'Couleur', value: 'couleur' },
  { label: 'Parfum', value: 'parfum' },
  { label: 'Pack', value: 'pack' },
  { label: 'Autre', value: 'autre' },
] as const

export const BADGE_TYPES = [
  { label: 'Top', value: 'top' },
  { label: 'Nouveau', value: 'nouveau' },
  { label: 'Best-seller', value: 'bestseller' },
  { label: 'Promo', value: 'promo' },
  { label: 'Exclusivité', value: 'exclusivite' },
  { label: 'Coup de cœur', value: 'coupdecoeur' },
  { label: 'Édition limitée', value: 'editionlimitee' },
  { label: 'Personnalisé', value: 'custom' },
] as const

// Shown when a badge's own `text` is left empty — lets an editor swap a
// type's default wording (e.g. type "top" showing "Coup de cœur" instead of
// "Top") without that being a second, disconnected free-text field.
export const BADGE_TYPE_DEFAULT_LABEL: Record<string, string> = {
  top: 'Top',
  nouveau: 'Nouveau',
  bestseller: 'Best-seller',
  promo: 'Promo',
  exclusivite: 'Exclusivité',
  coupdecoeur: 'Coup de cœur',
  editionlimitee: 'Édition limitée',
  custom: '',
}

// stockManager can submit an update (collection-level), but field-level
// access below still confines what actually changes: everything except the
// stock quantity fields stays locked to content editors.
const contentFieldUpdate: FieldAccess = ({ req }) => canEditContent({ req })
const stockFieldUpdate: FieldAccess = ({ req }) => canEditContent({ req }) || hasRole(req, 'stockManager')
const contentFieldAccess = { update: contentFieldUpdate }
const stockFieldAccess = { update: stockFieldUpdate }

type VariantRow = { sku?: string | null; barcode?: string | null }

/** Variant SKU/barcode must be unique the same way the top-level product
 * sku/barcode already are (see the `unique: true` fields below) — but
 * Payload doesn't support `unique` on fields nested inside an array, so
 * that constraint is enforced here instead: once within the same product's
 * variant rows, then against every other product (its top-level sku/barcode
 * and its own variants). */
async function assertVariantIdentifiersUnique({
  req,
  currentId,
  variants,
}: {
  req: PayloadRequest
  currentId: number | undefined
  variants: VariantRow[]
}) {
  const skus = new Set<string>()
  const barcodes = new Set<string>()
  for (const v of variants) {
    if (v.sku) {
      if (skus.has(v.sku)) throw new APIError(`SKU en double entre variantes : "${v.sku}".`, 400)
      skus.add(v.sku)
    }
    if (v.barcode) {
      if (barcodes.has(v.barcode)) throw new APIError(`Code-barres en double entre variantes : "${v.barcode}".`, 400)
      barcodes.add(v.barcode)
    }
  }

  async function assertGloballyUnique(field: 'sku' | 'barcode', value: string, label: string) {
    const identifierMatch: Where = { or: [{ [field]: { equals: value } }, { [`variants.${field}`]: { equals: value } }] }
    const where: Where = currentId ? { and: [{ id: { not_equals: currentId } }, identifierMatch] } : identifierMatch
    const clash = await req.payload.find({ collection: 'products', limit: 1, where })
    if (clash.docs.length) throw new APIError(`${label} déjà utilisé par un autre produit : "${value}".`, 400)
  }

  for (const sku of skus) await assertGloballyUnique('sku', sku, 'SKU')
  for (const barcode of barcodes) await assertGloballyUnique('barcode', barcode, 'Code-barres')
}

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
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        const variants = (data?.variants ?? originalDoc?.variants ?? []) as VariantRow[]
        if (variants.length > 0) {
          await assertVariantIdentifiersUnique({ req, currentId: originalDoc?.id, variants })
        }
        return data
      },
    ],
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
      name: 'badges',
      type: 'array',
      access: contentFieldAccess,
      admin: {
        description: 'Small pills shown on the product card, top-left — e.g. "Top", "Nouveau", "Promo". Stacked in order; 3 maximum to keep the card readable.',
      },
      maxRows: 3,
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        {
          name: 'type',
          type: 'select',
          defaultValue: 'top',
          options: [...BADGE_TYPES],
        },
        {
          name: 'text',
          type: 'text',
          admin: {
            description: 'Leave empty to use the default label for the selected type (e.g. "Nouveau"). Required for "Personnalisé".',
          },
        },
        { name: 'bgColor', type: 'text', admin: { description: 'Hex color, e.g. #5E4074. Leave empty to use the theme default.' } },
        { name: 'textColor', type: 'text', admin: { description: 'Hex color, e.g. #FFFFFF. Leave empty to use the theme default.' } },
      ],
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
      type: 'collapsible',
      label: 'Variantes',
      admin: {
        description:
          'Facultatif — un produit sans variante utilise ses propres prix/stock/SKU ci-dessus comme variante unique implicite. Toutes les variantes d\'un même produit partagent une seule dimension (ex. "Contenance"), pas plusieurs combinées.',
      },
      fields: [
        {
          name: 'hasVariants',
          type: 'checkbox',
          access: contentFieldAccess,
          admin: { description: 'Ce produit possède plusieurs variantes.' },
          defaultValue: false,
        },
        {
          name: 'variantOptionType',
          type: 'select',
          access: contentFieldAccess,
          admin: { condition: (data) => !!data?.hasVariants, description: 'La dimension qui distingue les variantes (ex. "Contenance" pour 50 ml / 100 ml / 200 ml).' },
          defaultValue: 'contenance',
          options: [...VARIANT_OPTION_TYPES],
        },
        {
          name: 'variants',
          type: 'array',
          access: contentFieldAccess,
          admin: { condition: (data) => !!data?.hasVariants, description: 'Une ligne par variante — chacune avec son propre prix, stock et SKU. Laisser l\'image vide pour utiliser l\'image principale du produit.' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'optionValue', type: 'text', admin: { description: 'Ex. "50 ml", "Rouge", "Pack de 2".' }, required: true },
                { name: 'sku', type: 'text' },
                { name: 'barcode', type: 'text' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'price', type: 'number', min: 0, required: true },
                { name: 'oldPrice', type: 'number', min: 0 },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'stock', type: 'number', access: stockFieldAccess, defaultValue: 0, min: 0 },
                { name: 'reservedStock', type: 'number', access: stockFieldAccess, defaultValue: 0, min: 0 },
                { name: 'lowStockThreshold', type: 'number', access: stockFieldAccess, defaultValue: 5, min: 0 },
              ],
            },
            { name: 'image', type: 'upload', relationTo: 'media' },
            { name: 'active', type: 'checkbox', defaultValue: true },
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
