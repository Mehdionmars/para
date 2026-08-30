import { APIError } from 'payload'
import type { CollectionConfig, FieldAccess, PayloadRequest, Where } from 'payload'

import { adminOrManager, canEditContent, hasRole, isStaff, staffOnlyInAdmin } from '../access/roles'
import { slugField } from '../lib/slugField'

export const CATEGORY_OPTIONS = [
  'Visage',
  'Corps',
  'Cheveux',
  'Solaire',
  'Baby & Mom',
  'Maquillage',
  'Bucco-Dentaire',
  'Compléments alimentaires',
  'Hygiène',
] as const

export const VARIANT_OPTION_TYPES = [
  { label: 'Contenance', value: 'contenance' },
  { label: 'Format', value: 'format' },
  { label: 'Taille', value: 'taille' },
  { label: 'Couleur', value: 'couleur' },
  { label: 'Parfum', value: 'parfum' },
  { label: 'Pack', value: 'pack' },
  { label: 'Autre', value: 'autre' },
] as const

/**
 * One preset per badge type: default wording, default colours and the
 * default sort priority (lower shows first).
 *
 * Single source of truth — the storefront mirrors this table rather than
 * keeping its own copy, so adding a type here is the only edit needed to
 * make it available end to end. Existing enum values are never renamed
 * (`nouveau`, `bestseller`, `exclusivite`… predate this) because that would
 * invalidate rows already stored in Postgres.
 *
 * Priority 1 is deliberately left free: it belongs to the automatic discount
 * badge, which is computed from oldPrice/price and always outranks a
 * manually configured one.
 */
export const BADGE_TYPE_PRESETS = {
  nouveau: { label: 'Nouveauté', bgColor: '#6D28D9', textColor: '#FFFFFF', priority: 2 },
  bestseller: { label: 'Best-seller', bgColor: '#111827', textColor: '#FFFFFF', priority: 3 },
  // #00758A rather than the brand teal #008AA5: white on the brighter teal
  // measures 4.06:1 at the size these pills render, under the AA floor.
  // Kept in step with frontend/lib/productBadges.core.mjs.
  exclusivite: { label: 'Exclu web', bgColor: '#00758A', textColor: '#FFFFFF', priority: 4 },
  routine: { label: 'Routine', bgColor: '#F7EEE5', textColor: '#373020', priority: 5 },
  coupdecoeur: { label: 'Coup de cœur', bgColor: '#F7EEE5', textColor: '#6D28D9', priority: 6 },
  offrespeciale: { label: 'Offre spéciale', bgColor: '#6D28D9', textColor: '#FFFFFF', priority: 7 },
  solde: { label: 'Solde', bgColor: '#DC2626', textColor: '#FFFFFF', priority: 7 },
  promo: { label: 'Promo', bgColor: '#DC2626', textColor: '#FFFFFF', priority: 7 },
  top: { label: 'Top', bgColor: '#111827', textColor: '#FFFFFF', priority: 8 },
  editionlimitee: { label: 'Édition limitée', bgColor: '#373020', textColor: '#FFFFFF', priority: 8 },
  custom: { label: '', bgColor: '', textColor: '', priority: 8 },
} as const satisfies Record<string, { label: string; bgColor: string; textColor: string; priority: number }>

export type BadgeType = keyof typeof BADGE_TYPE_PRESETS

export const BADGE_TYPES = (Object.keys(BADGE_TYPE_PRESETS) as BadgeType[]).map((value) => ({
  label: BADGE_TYPE_PRESETS[value].label || 'Personnalisé',
  value,
}))

// Shown when a badge's own `text` is left empty — lets an editor swap a
// type's default wording without that being a second, disconnected field.
export const BADGE_TYPE_DEFAULT_LABEL: Record<string, string> = Object.fromEntries(
  (Object.keys(BADGE_TYPE_PRESETS) as BadgeType[]).map((k) => [k, BADGE_TYPE_PRESETS[k].label]),
)

// stockManager can submit an update (collection-level), but field-level
// access below still confines what actually changes: everything except the
// stock quantity fields stays locked to content editors.
const contentFieldUpdate: FieldAccess = ({ req }) => canEditContent({ req })
const stockFieldUpdate: FieldAccess = ({ req }) => canEditContent({ req }) || hasRole(req, 'stockManager')
const contentFieldAccess = { update: contentFieldUpdate }
const stockFieldAccess = { update: stockFieldUpdate }

/** Back-office-only numbers. `read: () => true` on the collection is what
 * makes the storefront work without a session, but it also handed every
 * visitor the internal barcode and the reserved-stock figure, neither of
 * which any storefront view renders. `stock` itself stays public — the
 * catalogue prints "Rupture de stock" from it. */
const staffReadFieldAccess = { read: ({ req }: { req: PayloadRequest }) => isStaff({ req }) }

/** What an anonymous caller is allowed to see. Mirrors the storefront's own
 * `VISIBLE` filter (frontend/lib/storefront/catalogue.ts), so every query it
 * already makes returns exactly the same rows. */
const PUBLICLY_VISIBLE: Where = {
  and: [{ isPublished: { equals: true } }, { discontinued: { not_equals: true } }],
}

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
    // Public, but only for what is actually on sale. Staff (and the Local
    // API, which overrides access) still see everything — that is what the
    // dashboard's draft/archived filters read.
    //
    // Without the Where clause, `GET /api/products` published the entire
    // unreleased catalogue: products still being priced, seasonal ranges not
    // yet launched, and every row an import had just created as a draft. The
    // storefront already filtered on exactly these two fields, so nothing it
    // fetches changes.
    read: ({ req }) => {
      if (isStaff({ req })) return true
      return PUBLICLY_VISIBLE
    },
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

        // `price` can't be a Payload-level `required` on the row, because it
        // must be absent in same-price mode — so the "per-variant needs a
        // price" half of the rule is enforced here. Without it a product
        // could be switched to per-variant and ship variants with no price
        // at all, which the storefront would render as an empty amount.
        const pricingMode = data?.variantPricingMode ?? originalDoc?.variantPricingMode
        if (pricingMode === 'per-variant') {
          const missing = variants
            .map((v, i) => ({ i, price: (v as { price?: number | null }).price }))
            .filter(({ price }) => price === undefined || price === null)
          if (missing.length > 0) {
            throw new APIError(
              `Mode « prix par variante » : prix manquant sur ${missing.length} variante(s) (ligne ${missing.map((m) => m.i + 1).join(', ')}).`,
              400,
            )
          }
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
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Afficher ce badge' },
        {
          name: 'type',
          type: 'select',
          admin: { description: 'Définit le libellé, les couleurs et la priorité par défaut — chacun restant modifiable ci-dessous.' },
          defaultValue: 'nouveau',
          options: [...BADGE_TYPES],
        },
        {
          name: 'text',
          type: 'text',
          admin: {
            description: 'Vide = libellé par défaut du type (ex. "Nouveauté"). Obligatoire pour "Personnalisé".',
          },
          label: 'Texte',
        },
        {
          name: 'priority',
          type: 'number',
          admin: {
            description: 'Ordre d\'affichage, du plus petit au plus grand. Vide = priorité par défaut du type. La réduction automatique (-30%) reste toujours en tête.',
          },
          label: 'Priorité',
          min: 1,
          max: 99,
        },
        { name: 'bgColor', type: 'text', admin: { description: 'Hex, ex. #6D28D9. Vide = couleur par défaut du type.' }, label: 'Couleur de fond' },
        { name: 'textColor', type: 'text', admin: { description: 'Hex, ex. #FFFFFF. Vide = couleur par défaut du type.' }, label: 'Couleur du texte' },
      ],
    },
    {
      name: 'isLowStock',
      type: 'checkbox',
      admin: {
        description: 'Calculé automatiquement : stock > 0 et stock ≤ seuil. Alimente le filtre « Stock faible ».',
        position: 'sidebar',
        readOnly: true,
      },
      // Maintained by the products_low_stock_trg trigger (migration
      // 20260820_170000) so the value is always derived from stock and
      // lowStockThreshold, whoever wrote the row. Writes are refused at field
      // level: letting a client set it would let a full product be flagged
      // low-stock, and the dashboard filter reads exactly this column.
      access: { create: () => false, update: () => false },
      label: 'Stock faible',
    },
    {
      // `ui` = render-only, no column and no stored value. Shows the badge
      // stack exactly as the storefront will order and colour it, including
      // the automatic discount pill (which has no field of its own) and the
      // 3-badge cap — both invisible in the array UI above.
      name: 'badgesPreview',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/BadgesPreviewField#BadgesPreviewField',
        },
      },
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
              access: { ...contentFieldAccess, ...staffReadFieldAccess },
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
              access: { ...stockFieldAccess, ...staffReadFieldAccess },
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
          // A contenance is not automatically a price difference. Uriage Eau
          // Thermale sells 40/50/75 ml at one price; a shampoo sells 200 ml
          // and 400 ml at two. Without this switch an editor is forced to
          // retype the same price on every row and any later price change has
          // to be applied N times — which is exactly how a variant silently
          // drifts from the product's real price.
          name: 'variantPricingMode',
          type: 'select',
          access: contentFieldAccess,
          admin: {
            condition: (data) => !!data?.hasVariants,
            description:
              'Prix unique : toutes les variantes utilisent le prix du produit ci-dessus. Prix par variante : chaque ligne a le sien. Le stock, le SKU et le code-barres restent toujours propres à chaque variante.',
          },
          defaultValue: 'same-price',
          label: 'Tarification des variantes',
          options: [
            { label: 'Prix unique (le prix du produit)', value: 'same-price' },
            { label: 'Prix par variante', value: 'per-variant' },
          ],
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
                {
                  // Optional, and only surfaced in "per-variant" mode: in
                  // "same-price" the product's own price is authoritative and
                  // a value here would be a second, divergent source of truth.
                  name: 'price',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.variantPricingMode === 'per-variant',
                    description: 'Prix propre à cette variante.',
                  },
                  min: 0,
                },
                {
                  name: 'oldPrice',
                  type: 'number',
                  admin: { condition: (data) => data?.variantPricingMode === 'per-variant' },
                  min: 0,
                },
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
