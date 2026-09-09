import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

export const Stores: CollectionConfig = {
  slug: 'stores',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['name', 'address', 'phone'],
    description: 'Physical parapharmacie locations shown on the services page.',
    useAsTitle: 'name',
  },
  hooks: {
    // The storefront caches this behind the 'stores' tag, and nothing was
    // purging it — A store's address, hours and phone are what /contact exists to publish. An edit therefore
    // waited for the cache to expire on its own rather than appearing on the
    // next request, which is the whole reason the tag exists.
    //
    // afterDelete as well as afterChange: removing one is as visible as
    // editing one.
    afterChange: [
      async ({ req }) => {
  await revalidateStorefront(req.payload, ['stores'])
      },
    ],
    afterDelete: [
      async ({ req }) => {
  await revalidateStorefront(req.payload, ['stores'])
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'text',
    },
    {
      name: 'hours',
      type: 'array',
      admin: { description: 'One row per day or day range, e.g. "Lun – Sam" / "9h00 – 20h00".' },
      fields: [
        { name: 'days', type: 'text', required: true },
        { name: 'hours', type: 'text', required: true },
      ],
    },
    {
      name: 'mapUrl',
      type: 'text',
      admin: { description: 'Google Maps link for "Itinéraire". Leave empty to auto-build one from the address.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
