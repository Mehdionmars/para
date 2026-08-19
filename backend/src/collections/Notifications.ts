import type { CollectionConfig } from 'payload'

import { adminOrManager, isStaff, staffOnlyInAdmin } from '../access/roles'
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS, NOTIFICATION_STATUSES } from '../lib/notifications/types'

/**
 * One row per (order, event, channel) — the delivery ledger.
 *
 * Rows are created by NotificationService through raw SQL so the uniqueness
 * of that triple is settled by the database (see the ON CONFLICT claim in
 * lib/notifications/service.ts). `create` is closed here so nothing can
 * bypass that path and write an unclaimed duplicate.
 *
 * `update` is limited to admin/manager and, in practice, to marking a row
 * read; the delivery fields are readOnly in the admin UI because rewriting
 * "sent" on a message that never left would make the ledger useless.
 */
export const Notifications: CollectionConfig = {
  slug: 'notifications',
  access: {
    admin: staffOnlyInAdmin,
    create: () => false,
    delete: adminOrManager,
    read: isStaff,
    update: adminOrManager,
  },
  admin: {
    defaultColumns: ['title', 'type', 'channel', 'status', 'customerEmail', 'createdAt'],
    description: "Journal des notifications. Une ligne par commande × événement × canal.",
    group: 'Commandes',
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'order',
          type: 'relationship',
          index: true,
          label: 'Commande',
          relationTo: 'orders',
        },
        {
          name: 'customerEmail',
          type: 'text',
          // Email rather than a relationship: there is no customer collection
          // yet (accounts aren't built), and the order itself is keyed by
          // email. Swapping to a relationship later is additive.
          index: true,
          label: 'Client (email)',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          admin: { readOnly: true },
          index: true,
          label: 'Événement',
          options: [...NOTIFICATION_EVENTS],
          required: true,
        },
        {
          name: 'channel',
          type: 'select',
          admin: { readOnly: true },
          label: 'Canal',
          options: [...NOTIFICATION_CHANNELS],
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          admin: {
            description:
              "« pending » signifie composée mais non délivrée — typiquement aucun provider configuré pour ce canal.",
          },
          defaultValue: 'pending',
          index: true,
          label: 'Statut',
          options: [...NOTIFICATION_STATUSES],
          required: true,
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      admin: { readOnly: true },
      label: 'Titre',
    },
    {
      name: 'message',
      type: 'textarea',
      admin: { readOnly: true },
      label: 'Message',
    },
    {
      name: 'metadata',
      type: 'json',
      admin: { readOnly: true },
      label: 'Métadonnées',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sentAt',
          type: 'date',
          admin: { readOnly: true },
          label: 'Envoyée le',
        },
        {
          name: 'readAt',
          type: 'date',
          admin: { description: 'Renseignée quand la notification est marquée comme lue.' },
          label: 'Lue le',
        },
      ],
    },
    {
      name: 'error',
      type: 'textarea',
      admin: { readOnly: true },
      label: 'Erreur / raison',
    },
  ],
  timestamps: true,
}
