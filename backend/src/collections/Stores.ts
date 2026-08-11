import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'

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
