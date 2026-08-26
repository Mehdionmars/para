import type { CollectionConfig } from 'payload'

import { adminOrManager, isStaff, staffOnlyInAdmin } from '../access/roles'

/**
 * Web Push subscriptions (RFC 8291), one row per browser.
 *
 * The collection exists so subscriptions can start being collected now; the
 * sending half is deliberately not built (see pushProvider in
 * lib/notifications/providers.ts) because it would mean adding `web-push`
 * before a single subscriber exists.
 *
 * `create` is closed to REST/GraphQL: /api/push/subscribe writes the row with
 * a raw `INSERT ... ON CONFLICT (endpoint) DO UPDATE`, so it never goes
 * through collection access at all. Leaving it open only ever offered a way
 * to fill the table with rows the push sender would later try to contact.
 *
 * The keys stored here (`p256dh`, `auth`) are the browser's own public
 * encryption material, not credentials of ours; they are useless without the
 * server's VAPID private key, which never leaves the environment.
 */
export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  access: {
    admin: staffOnlyInAdmin,
    create: () => false,
    delete: adminOrManager,
    read: isStaff,
    update: () => false,
  },
  admin: {
    defaultColumns: ['customerEmail', 'userAgent', 'lastUsedAt', 'createdAt'],
    description: 'Abonnements Web Push. Collectés dès maintenant, envoi non encore actif.',
    group: 'Commandes',
    useAsTitle: 'endpoint',
  },
  fields: [
    {
      name: 'customerEmail',
      type: 'text',
      admin: { description: "Vide pour un visiteur non identifié." },
      index: true,
      label: 'Client (email)',
    },
    {
      name: 'endpoint',
      type: 'text',
      index: true,
      label: 'Endpoint',
      required: true,
      unique: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'p256dh', type: 'text', label: 'Clé p256dh', required: true },
        { name: 'auth', type: 'text', label: 'Clé auth', required: true },
      ],
    },
    {
      name: 'userAgent',
      type: 'text',
      label: 'Navigateur',
    },
    {
      name: 'lastUsedAt',
      type: 'date',
      label: 'Dernière utilisation',
    },
  ],
  timestamps: true,
}
