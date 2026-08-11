import type { CollectionConfig } from 'payload'

import { adminOrManager, isAdmin, ROLES, staffOnlyInAdmin } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: staffOnlyInAdmin,
    // Admin/manager can list everyone (manager is read-only, enforced by
    // `update`/`delete` below); anyone else can only ever see their own doc.
    read: ({ req }) => {
      if (adminOrManager({ req })) return true
      return req.user ? { id: { equals: req.user.id } } : false
    },
    // No public self-registration yet — the "customer" role isn't wired to
    // any storefront account system, so only an admin can create Users docs.
    create: isAdmin,
    delete: isAdmin,
    update: ({ req }) => {
      if (isAdmin({ req })) return true
      // Everyone else may update only their own doc (e.g. their password) —
      // the `roles` field below still blocks them from touching their own role.
      return req.user ? { id: { equals: req.user.id } } : false
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'roles',
      type: 'select',
      access: {
        // Only an admin can grant/change roles — never the user themself.
        update: ({ req }) => isAdmin({ req }),
      },
      admin: {
        description: 'Controls access to /admin and the /dashboard app. "customer" has no staff access.',
      },
      defaultValue: ['customer'],
      hasMany: true,
      options: [...ROLES],
    },
  ],
  versions: false,
}
