import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

export const CollectionsPage: GlobalConfig = {
  slug: 'collections-page',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description: 'The editorial "collections" landing page (/collections).',
  },
  hooks: {
    // The storefront caches this behind the 'collections-page' tag, and nothing was
    // purging it — The whole point of this global is what /collections renders. An edit therefore
    // waited for the cache to expire on its own rather than appearing on the
    // next request, which is the whole reason the tag exists.
    //
    // afterDelete as well as afterChange: removing one is as visible as
    // editing one.
    afterChange: [
      async ({ req }) => {
  await revalidateStorefront(req.payload, ['collections-page'])
      },
    ],
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
