import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { slugField } from '../lib/slugField'
import { revalidateStorefront } from '../lib/revalidateStorefront'

export const SERVICE_ICON_OPTIONS = ['Baby', 'Feather', 'Palette', 'ScanFace', 'Scissors', 'Droplet'] as const

export const Services: CollectionConfig = {
  slug: 'services',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['title', 'price', 'sortOrder', 'expert'],
    useAsTitle: 'title',
  },
  hooks: {
    // The storefront caches this behind the 'services' tag, and nothing was
    // purging it — The services teaser on the home page and /services both read this. An edit therefore
    // waited for the cache to expire on its own rather than appearing on the
    // next request, which is the whole reason the tag exists.
    //
    // afterDelete as well as afterChange: removing one is as visible as
    // editing one.
    afterChange: [
      async ({ req }) => {
  await revalidateStorefront(req.payload, ['services'])
      },
    ],
    afterDelete: [
      async ({ req }) => {
  await revalidateStorefront(req.payload, ['services'])
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField('title'),
    {
      name: 'subtitle',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          admin: { description: '0 shows as "Offert" (free) on the site.' },
          defaultValue: 0,
          min: 0,
        },
        {
          name: 'duration',
          type: 'text',
          admin: { description: 'e.g. "30 min"' },
        },
        {
          name: 'expert',
          type: 'text',
          admin: { description: 'e.g. "Pharmacien", "Esthéticienne"' },
        },
      ],
    },
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        description: 'Position on /services: lowest first. Services without one come last.',
        position: 'sidebar',
      },
    },
    {
      // The institute's real tariff: one line per prestation, as on the
      // printed price list. The card on /services shows the cheapest line as
      // "Dès …"; the service page lists them all.
      name: 'priceList',
      type: 'array',
      labels: { plural: 'Tarifs', singular: 'Tarif' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'price',
              type: 'number',
              min: 0,
              admin: { description: 'In MAD. Leave empty for "À demander".', width: '20%' },
            },
            {
              name: 'fromPrice',
              type: 'checkbox',
              defaultValue: false,
              label: 'À partir de',
              admin: { width: '15%' },
            },
          ],
        },
      ],
    },
    {
      name: 'bg',
      type: 'text',
      admin: { description: 'Hex background color for this service\'s cards, e.g. #EFE6F3' },
      defaultValue: '#EFE6F3',
    },
    {
      name: 'icon',
      type: 'select',
      options: [...SERVICE_ICON_OPTIONS],
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      // Not required at the DB level: would block deleting the Media doc.
      relationTo: 'media',
    },
    {
      name: 'benefits',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'sub',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
