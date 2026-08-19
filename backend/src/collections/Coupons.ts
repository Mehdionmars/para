import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'

export const COUPON_TYPES = [
  { label: 'Pourcentage (%)', value: 'percentage' },
  { label: 'Montant fixe (MAD)', value: 'fixed' },
] as const

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    // Never publicly readable: the list of live codes, their limits and their
    // eligibility rules are commercial information, and a public read would
    // also hand out every unpublished promo. Validation happens through
    // /api/coupons/validate, which returns only a discount for one cart.
    read: staffOnlyInAdmin,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['code', 'type', 'value', 'usageCount', 'endDate', 'active'],
    description:
      'Codes promotionnels. Toute la validation (dates, limites, éligibilité, plafond) est faite côté serveur au moment du checkout — le montant envoyé par le navigateur n\'est jamais utilisé.',
    useAsTitle: 'code',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      admin: { description: 'Saisi par le client. Normalisé en MAJUSCULES, sans espaces.' },
      // Comparison at checkout is done on the normalised value, so the index
      // and the lookup agree regardless of how the shopper typed it.
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toUpperCase().replace(/\s+/g, '') : value)],
      },
      index: true,
      label: 'Code',
      required: true,
      unique: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'percentage',
          label: 'Type de remise',
          options: [...COUPON_TYPES],
          required: true,
        },
        {
          name: 'value',
          type: 'number',
          admin: { description: '10 = -10% (pourcentage) ou -10 MAD (montant fixe).' },
          label: 'Valeur',
          min: 0,
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'minimumAmount',
          type: 'number',
          admin: { description: 'Sous-total minimum du panier. Vide = aucun minimum.' },
          label: 'Montant minimum (MAD)',
          min: 0,
        },
        {
          name: 'maximumDiscount',
          type: 'number',
          admin: {
            condition: (data) => data?.type === 'percentage',
            description: 'Plafonne la remise. Ex. 20% plafonné à 100 MAD : un panier de 1000 MAD est remisé de 100, pas de 200.',
          },
          label: 'Remise maximale (MAD)',
          min: 0,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startDate', type: 'date', admin: { description: 'Vide = actif immédiatement.' }, label: 'Début' },
        { name: 'endDate', type: 'date', admin: { description: 'Vide = pas d\'expiration.' }, label: 'Fin' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'usageLimit',
          type: 'number',
          admin: { description: 'Nombre total d\'utilisations, tous clients confondus. Vide = illimité.' },
          label: 'Limite globale',
          min: 1,
        },
        {
          name: 'perCustomerLimit',
          type: 'number',
          admin: { description: 'Utilisations par adresse email. Vide = illimité.' },
          defaultValue: 1,
          label: 'Limite par client',
          min: 1,
        },
        {
          name: 'usageCount',
          type: 'number',
          admin: {
            description: 'Incrémenté automatiquement à chaque commande validée. Lecture seule.',
            readOnly: true,
          },
          defaultValue: 0,
          label: 'Utilisations',
          min: 0,
        },
      ],
    },
    {
      name: 'eligibility',
      type: 'group',
      admin: {
        description:
          'Laisser les trois vides = le coupon s\'applique à tout le panier. Sinon la remise ne porte que sur les lignes correspondantes (union des trois critères).',
      },
      fields: [
        { name: 'products', type: 'relationship', hasMany: true, label: 'Produits éligibles', relationTo: 'products' },
        { name: 'categories', type: 'relationship', hasMany: true, label: 'Catégories éligibles', relationTo: 'categories' },
        { name: 'brands', type: 'relationship', hasMany: true, label: 'Marques éligibles', relationTo: 'brands' },
      ],
      label: 'Éligibilité',
    },
    {
      name: 'active',
      type: 'checkbox',
      admin: { description: 'Décocher désactive le code immédiatement, sans toucher aux dates.' },
      defaultValue: true,
      label: 'Actif',
    },
  ],
}
