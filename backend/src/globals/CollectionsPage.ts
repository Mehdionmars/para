import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'

export const CollectionsPage: GlobalConfig = {
  slug: 'collections-page',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description: 'The editorial "collections" landing page (/collections).',
  },
  fields: [
    {
      name: 'cards',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'count', type: 'text', admin: { description: 'e.g. "24 produits"' } },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
  ],
}
