import type { CollectionConfig } from 'payload'

import { adminOrManager, isStaff, staffOnlyInAdmin } from '../access/roles'
import { BOOKING_SLOTS, BOOKING_STATUS_OPTIONS } from '../lib/bookings'

/**
 * A service appointment.
 *
 * Customers do not write here through the REST API: they go through
 * POST /api/booking-requests, which checks the slot against the calendar in
 * lib/bookings.ts and creates the row as `pending`. Staff read and update
 * through the dashboard, and can add a booking taken over the phone.
 *
 * Two bookings cannot hold the same slot of the same service: a partial
 * unique index on (service, date, time) over pending and confirmed rows does
 * that in the database (migration 20261016_100000_bookings), so it holds
 * under concurrent requests. Cancelling a booking frees its slot.
 */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { plural: 'Rendez-vous', singular: 'Rendez-vous' },
  access: {
    admin: staffOnlyInAdmin,
    create: isStaff,
    delete: adminOrManager,
    read: isStaff,
    update: isStaff,
  },
  admin: {
    defaultColumns: ['date', 'time', 'serviceTitle', 'customerName', 'status'],
    useAsTitle: 'customerName',
  },
  defaultSort: '-date',
  fields: [
    {
      type: 'row',
      fields: [
        {
          // Not required: deleting a service keeps its bookings, which then
          // read from serviceTitle.
          name: 'service',
          type: 'relationship',
          relationTo: 'services',
          admin: { width: '50%' },
        },
        {
          // A snapshot: the booking still reads correctly after the service
          // is renamed or deleted.
          name: 'serviceTitle',
          type: 'text',
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'text',
          required: true,
          admin: { description: 'Jour à Casablanca, AAAA-MM-JJ.', width: '50%' },
          validate: (value: string | null | undefined) =>
            typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? true : 'Format attendu : AAAA-MM-JJ.',
        },
        {
          name: 'time',
          type: 'text',
          required: true,
          admin: { description: `Un des créneaux : ${BOOKING_SLOTS.join(', ')}.`, width: '50%' },
          validate: (value: string | null | undefined) =>
            typeof value === 'string' && (BOOKING_SLOTS as readonly string[]).includes(value)
              ? true
              : `Créneau attendu : ${BOOKING_SLOTS.join(', ')}.`,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: BOOKING_STATUS_OPTIONS.map((value) => ({
        label: { cancelled: 'Annulé', confirmed: 'Confirmé', done: 'Terminé', pending: 'En attente' }[value],
        value,
      })),
      index: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', type: 'text', required: true, admin: { width: '33%' } },
        { name: 'customerPhone', type: 'text', required: true, admin: { width: '33%' } },
        { name: 'customerEmail', type: 'email', admin: { width: '34%' } },
      ],
    },
    { name: 'note', type: 'textarea', admin: { description: 'Précision laissée par le client.' } },
    { name: 'staffNote', type: 'textarea', admin: { description: 'Note interne, jamais montrée au client.' } },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Keep the snapshot in step with the service it points at.
        const serviceId = typeof data.service === 'object' && data.service ? data.service.id : data.service
        if (serviceId && !data.serviceTitle) {
          const service = await req.payload
            .findByID({ collection: 'services', depth: 0, id: serviceId, req })
            .catch(() => null)
          if (service) data.serviceTitle = service.title
        }
        return data
      },
    ],
  },
  timestamps: true,
}
