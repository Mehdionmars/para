import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { slugField } from '../lib/slugField'

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
    defaultColumns: ['title', 'price', 'duration', 'expert'],
    useAsTitle: 'title',
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
