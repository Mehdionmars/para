import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  folders: true,
  upload: true,
}
