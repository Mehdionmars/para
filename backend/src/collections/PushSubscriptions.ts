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
 * `create` is open because a subscribing browser has no session — the same
 * reasoning as the public checkout. The endpoint URL is unique, which is
 * what stops a browser re-subscribing from piling up duplicate rows.
 *
 * The keys stored here (`p256dh`, `auth`) are the browser's own public
 * encryption material, not credentials of ours; they are useless without the
 * server's VAPID private key, which never leaves the environment.
 */
export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  access: {
    admin: staffOnlyInAdmin,
    create: () => true,
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
