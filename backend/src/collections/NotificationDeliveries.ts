import type { CollectionConfig } from 'payload'

import { adminOrManager, isStaff, staffOnlyInAdmin } from '../access/roles'
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from '../lib/notifications/types'

/**
 * One attempt to deliver a notification through one channel.
 *
 * Split out of `notifications` because a single alert legitimately has a
 * different state per channel — email failed, in-app read, WhatsApp still
 * pending. Folding that into the notification meant duplicating its title and
 * body once per channel, and left the notification itself with no identity.
 *
 * Rows are created by the notification services through raw SQL so the
 * (notification, channel) uniqueness is settled by the database. `create` is
 * closed here to keep that the only path.
 */
export const NotificationDeliveries: CollectionConfig = {
  slug: 'notification-deliveries',
  access: {
    admin: staffOnlyInAdmin,
    create: () => false,
    delete: adminOrManager,
    read: isStaff,
    update: adminOrManager,
  },
  admin: {
    defaultColumns: ['notification', 'channel', 'status', 'attempts', 'sentAt'],
    description: 'Journal de livraison : une ligne par notification × canal.',
    group: 'Commandes',
    useAsTitle: 'channel',
  },
  fields: [
    {
      name: 'notification',
      type: 'relationship',
      admin: { readOnly: true },
      index: true,
      label: 'Notification',
      relationTo: 'notifications',
      required: true,
    },
    {
      type: 'row',
      fields: [
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
              '« pending » = composée mais non délivrée, typiquement aucun provider configuré pour ce canal.',
          },
          defaultValue: 'pending',
          index: true,
          label: 'Statut',
          options: [...NOTIFICATION_STATUSES],
          required: true,
        },
        {
          name: 'attempts',
          type: 'number',
          admin: { description: '3 tentatives maximum.', readOnly: true },
          defaultValue: 0,
          label: 'Tentatives',
          min: 0,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'lastAttemptAt', type: 'date', admin: { readOnly: true }, label: 'Dernière tentative' },
        { name: 'sentAt', type: 'date', admin: { readOnly: true }, label: 'Envoyée le' },
        {
          name: 'readAt',
          type: 'date',
          admin: { description: 'Ne concerne que le canal interne — un email n’est pas « lu ».' },
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
