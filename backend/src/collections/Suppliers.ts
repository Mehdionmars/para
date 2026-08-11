import type { CollectionConfig } from 'payload'

import { adminOrManager, canManageInventory, isStaff, staffOnlyInAdmin } from '../access/roles'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  access: {
    admin: staffOnlyInAdmin,
    create: canManageInventory,
    delete: adminOrManager,
    read: isStaff,
    update: canManageInventory,
  },
  admin: {
    defaultColumns: ['name', 'contactEmail', 'contactPhone'],
    description: 'Product suppliers — auto-created by the bulk importer when a "supplier" column names one that doesn\'t exist yet.',
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
      type: 'row',
      fields: [
        {
          name: 'contactEmail',
          type: 'email',
        },
        {
          name: 'contactPhone',
          type: 'text',
        },
      ],
    },
    {
      name: 'address',
      type: 'textarea',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
