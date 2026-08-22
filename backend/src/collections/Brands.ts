import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { slugField } from '../lib/slugField'

export const Brands: CollectionConfig = {
  slug: 'brands',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['name', 'logo', 'slug'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'logo',
      type: 'upload',
      admin: {
        description:
          "Logo officiel de la marque, de préférence en PNG ou SVG sur fond transparent. Sans logo, le storefront affiche un monogramme composé à partir du nom — la marque reste présentable, elle n'est simplement pas signée.",
      },
      label: 'Logo',
      relationTo: 'media',
    },
    slugField('name'),
  ],
}
