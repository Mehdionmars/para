import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'

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
