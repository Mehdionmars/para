import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['name', 'parent', 'order', 'isActive'],
    description:
      'Navbar / mega-menu taxonomy. Level 0 (no parent) = navbar entries. Level 1 (parent = a level-0 category) = mega-menu columns. Level 2 (parent = a level-1 category) = items inside a column. Services is intentionally not modeled here — it stays a plain top-level nav link.',
    useAsTitle: 'name',
  },
  hooks: {
    // Purges the cached navigation, under the same tag the Navigation global
    // uses.
    //
    // This tree is no longer read only by the admin: the storefront builds a
    // mega menu from it for every nav entry whose columns nobody filled in
    // (see frontend/lib/storefront/categoryTree.ts). Without this hook a new
    // sub-category, a rename or a reordering waited up to an hour for the
    // cache to expire on its own — and the editor had no way to tell whether
    // the save had worked.
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['navigation'])
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['navigation'])
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
      name: 'slug',
      type: 'text',
      admin: {
        description:
          'Not unique on purpose: the same name (e.g. "Visage") can legitimately appear at different levels of the tree.',
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (value) return value
            return typeof data?.name === 'string' && data.name
              ? data.name
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(new RegExp('[̀-ͯ]', 'g'), '')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '')
              : value
          },
        ],
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      admin: { description: 'Leave empty for a top-level navbar entry.' },
      relationTo: 'categories',
    },
    {
      name: 'order',
      type: 'number',
      admin: { description: 'Lower numbers show first.' },
      defaultValue: 0,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'icon',
      type: 'text',
      admin: { description: 'Optional lucide-react icon name, e.g. "Sparkles". Rarely needed below level 0.' },
    },
  ],
}
