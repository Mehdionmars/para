import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'

/**
 * Delivery pricing, per city, editable without a deploy.
 *
 * Replaces the hardcoded `SHIPPING_COST = 30` that lived in the checkout
 * route: a courier price change is a business decision, not a code change.
 *
 * Resolution at checkout: the rule whose city matches the shipping address
 * wins; otherwise the rule flagged `isDefault` applies. Free-shipping is
 * per-rule (`freeFrom`), because "free above 399" is not necessarily true in
 * every city.
 */
export const ShippingRules: CollectionConfig = {
  slug: 'shipping-rules',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    // Publicly readable on purpose: the storefront shows delivery cost before
    // checkout, and there is nothing confidential in a published tariff.
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['city', 'region', 'price', 'freeFrom', 'isDefault', 'enabled'],
    description:
      'Frais de livraison par ville. Le checkout recalcule toujours les frais depuis ces règles — le montant envoyé par le navigateur est ignoré.',
    useAsTitle: 'city',
  },
  defaultSort: 'city',
  fields: [
    {
      name: 'city',
      type: 'text',
      admin: { description: 'Ex. "Casablanca". La correspondance ignore la casse et les accents.' },
      index: true,
      label: 'Ville',
      required: true,
    },
    { name: 'region', type: 'text', admin: { description: 'Optionnel — informatif.' }, label: 'Région' },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', label: 'Frais de livraison (MAD)', min: 0, required: true },
        {
          name: 'freeFrom',
          type: 'number',
          admin: { description: 'Sous-total (après remise) à partir duquel la livraison est offerte. Vide = jamais offerte.' },
          label: 'Offerte à partir de (MAD)',
          min: 0,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isDefault',
          type: 'checkbox',
          admin: { description: 'Tarif appliqué à toute ville sans règle propre. Une seule règle peut l\'être.' },
          defaultValue: false,
          label: 'Tarif par défaut',
        },
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Active' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc, operation }) => {
        // Exactly one default, enforced here rather than by convention: two
        // defaults would make the fallback tariff depend on row order, i.e.
        // silently non-deterministic.
        if (!data?.isDefault) return data

        const others = await req.payload.find({
          collection: 'shipping-rules',
          limit: 100,
          where: { isDefault: { equals: true } },
        })
        for (const rule of others.docs) {
          if (operation === 'update' && originalDoc?.id === rule.id) continue
          await req.payload.update({
            collection: 'shipping-rules',
            id: rule.id,
            data: { isDefault: false },
          })
        }
        return data
      },
    ],
  },
}
