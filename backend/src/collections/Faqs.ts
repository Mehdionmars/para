import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

/**
 * The questions /faq answers.
 *
 * A collection rather than an array on a global, for one reason: these
 * answers change on their own schedule. "Quels sont les frais de livraison"
 * is rewritten when a tariff moves, "puis-je retourner un produit" when the
 * policy is settled — and an array inside a global means Payload validates
 * the whole global on every write, so one invalid field blocks every other
 * save (PRODUCT.md, "Capabilities and Constraints"). One row per question
 * keeps those edits independent.
 *
 * Nothing is seeded here. The delivery answers in particular must not be
 * written by hand: /livraison reads the real tariffs from `shipping-rules`,
 * and a FAQ entry repeating them as prose would be a second, silently
 * diverging copy the day a price changes. Link to the page instead.
 */
export const FAQ_CATEGORIES = [
  { label: 'Commande', value: 'commande' },
  { label: 'Livraison', value: 'livraison' },
  { label: 'Paiement', value: 'paiement' },
  { label: 'Retours', value: 'retours' },
  { label: 'Produits et conseils', value: 'produits' },
] as const

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['question', 'category', 'order', 'published'],
    description: 'Questions fréquentes affichées sur /faq, groupées par catégorie.',
    useAsTitle: 'question',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['faqs'])
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['faqs'])
      },
    ],
  },
  fields: [
    { name: 'question', type: 'text', label: 'Question', required: true },
    {
      name: 'answer',
      type: 'richText',
      admin: { description: 'Une réponse courte vaut mieux qu\'un paragraphe. Les liens internes sont autorisés.' },
      label: 'Réponse',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          admin: { description: 'Sert de titre de groupe sur la page.' },
          defaultValue: 'commande',
          index: true,
          label: 'Catégorie',
          options: [...FAQ_CATEGORIES],
          required: true,
        },
        {
          name: 'order',
          type: 'number',
          admin: { description: 'Ordre d\'affichage dans sa catégorie. Les plus petits d\'abord.' },
          defaultValue: 0,
          label: 'Ordre',
        },
        {
          name: 'published',
          type: 'checkbox',
          defaultValue: true,
          label: 'Publiée',
        },
      ],
    },
  ],
}
