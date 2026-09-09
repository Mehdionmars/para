import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff, staffOnlyInAdmin } from '../access/roles'

export const PAYMENT_EVENT_PROVIDERS = ['cmi', 'manual', 'other'] as const
export const PAYMENT_EVENT_STATUSES = ['received', 'processed', 'ignored', 'failed'] as const

export type PaymentEventProvider = (typeof PAYMENT_EVENT_PROVIDERS)[number]

/**
 * One row per webhook a payment provider has delivered.
 *
 * ## Why the table exists before the provider does
 *
 * Nothing posts here yet. Payment today is a `paymentMethod` / `paymentStatus`
 * pair written on the order at checkout — CMI is configured as an option in
 * the PaymentSettings global, but no callback endpoint receives anything from
 * it. This collection is the seam for when one does, and it is worth having
 * in place first because the failure it prevents is not recoverable after the
 * fact: a provider that delivers `evt_123` three times and is processed three
 * times has confirmed one payment, sent three emails, and moved stock twice
 * more than it should have. You cannot un-send those.
 *
 * Every provider retries. At-least-once delivery is the guarantee they all
 * offer, and it means duplicates are the normal case, not the incident.
 *
 * ## How the deduplication works
 *
 * `provider` + `providerEventId` carry a UNIQUE index (see the migration
 * 20260910_000000). The guard in lib/paymentEvents.ts inserts first and
 * treats a unique violation as "already delivered" — the same
 * claim-by-unique-index shape as lib/idempotency.ts, and for the same reason:
 * a `SELECT` then `INSERT` lets two simultaneous deliveries of one event both
 * find nothing and both proceed.
 *
 * ## What is deliberately not stored
 *
 * The provider's raw payload. Webhook bodies carry masked card metadata,
 * billing addresses, customer names and provider-side identifiers, and a
 * webhook log is exactly the table that gets dumped to a CSV to debug
 * something and then left in a bucket. `payloadHash` is enough to prove two
 * deliveries carried the same content; `eventType` and the order link are
 * enough to explain what happened. Anything more belongs in the provider's
 * own dashboard, which is already the system of record for it.
 */
export const PaymentEvents: CollectionConfig = {
  slug: 'payment-events',
  access: {
    admin: staffOnlyInAdmin,
    // Written only by the webhook guard, which runs with `overrideAccess`.
    // No human and no API client creates these.
    create: () => false,
    delete: isAdmin,
    read: isStaff,
    // Append-only, like stock-movements: the point of an audit row is that it
    // says what happened, and an editable one says what someone last decided
    // it should have said.
    update: () => false,
  },
  admin: {
    defaultColumns: ['providerEventId', 'provider', 'eventType', 'status', 'order', 'receivedAt'],
    description: 'Webhooks reçus des prestataires de paiement. Lecture seule.',
    group: 'Commandes',
    useAsTitle: 'providerEventId',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'cmi',
          options: PAYMENT_EVENT_PROVIDERS.map((value) => ({ label: value.toUpperCase(), value })),
          required: true,
        },
        {
          name: 'providerEventId',
          type: 'text',
          admin: {
            description:
              'Identifiant de l’événement chez le prestataire. Unique par prestataire — c’est ce qui empêche un webhook rejoué d’être traité deux fois.',
          },
          index: true,
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'eventType',
          type: 'text',
          admin: { description: 'Type déclaré par le prestataire (paiement confirmé, remboursement…).' },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'received',
          options: [
            { label: 'Reçu', value: 'received' },
            { label: 'Traité', value: 'processed' },
            { label: 'Ignoré', value: 'ignored' },
            { label: 'Échec', value: 'failed' },
          ],
          required: true,
        },
      ],
    },
    {
      name: 'order',
      type: 'relationship',
      // Nullable on purpose, same reasoning as stock-movements: an event that
      // arrives for an order that was deleted, or before the order could be
      // matched, is still evidence and must not be lost or block the delete.
      admin: { description: 'Commande rattachée, si l’événement a pu être rapproché.' },
      relationTo: 'orders',
    },
    {
      name: 'payloadHash',
      type: 'text',
      admin: {
        description:
          'SHA-256 du corps reçu. Permet de prouver que deux livraisons portaient le même contenu sans stocker le contenu.',
        readOnly: true,
      },
    },
    {
      name: 'failureReason',
      type: 'text',
      admin: { description: 'Renseigné uniquement pour un événement en échec.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'receivedAt',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          defaultValue: () => new Date().toISOString(),
          required: true,
        },
        {
          name: 'processedAt',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
  ],
}
