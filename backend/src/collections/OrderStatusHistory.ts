import type { CollectionConfig } from 'payload'

import { isStaff, staffOnlyInAdmin } from '../access/roles'
import { ORDER_STATUS_OPTIONS } from '../lib/orderStatus'

/**
 * Append-only audit trail of every status change.
 *
 * Written exclusively by the Orders afterChange hook. `create` is closed to
 * the API and `update`/`delete` are closed to everyone including admins:
 * an audit log an operator can rewrite answers no question worth asking.
 * Rows are inserted through the hook's own database connection, which does
 * not pass through this access control.
 */
export const OrderStatusHistory: CollectionConfig = {
  slug: 'order-status-history',
  access: {
    admin: staffOnlyInAdmin,
    create: () => false,
    delete: () => false,
    read: isStaff,
    update: () => false,
  },
  admin: {
    defaultColumns: ['order', 'fromStatus', 'toStatus', 'changedByEmail', 'createdAt'],
    description: "Journal des changements de statut. Lecture seule, y compris pour les administrateurs.",
    group: 'Commandes',
    useAsTitle: 'toStatus',
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      index: true,
      relationTo: 'orders',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'fromStatus',
          type: 'select',
          // Null on the very first entry, which records the status the order
          // was created with rather than a transition.
          label: 'Statut précédent',
          options: [...ORDER_STATUS_OPTIONS],
        },
        {
          name: 'toStatus',
          type: 'select',
          label: 'Nouveau statut',
          options: [...ORDER_STATUS_OPTIONS],
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'changedBy',
          type: 'relationship',
          admin: { description: 'Vide si le changement vient du checkout public.' },
          label: 'Modifié par',
          relationTo: 'users',
        },
        {
          name: 'changedByEmail',
          type: 'text',
          // Snapshotted so a deleted staff account doesn't erase who acted.
          admin: { description: "Email au moment du changement (conservé même si le compte est supprimé)." },
          label: 'Email',
        },
      ],
    },
    {
      name: 'reason',
      type: 'textarea',
      label: 'Motif',
    },
  ],
  timestamps: true,
}
