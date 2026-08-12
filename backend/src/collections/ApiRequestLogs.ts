import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '../access/roles'

/**
 * Written only by `apiMonitoringPlugin` (collection/global hooks) and
 * `withApiLog` (the 4 custom route handlers) via the local API, which
 * defaults to overriding access — so REST/GraphQL write access can stay
 * fully closed here without breaking logging.
 */
export const ApiRequestLogs: CollectionConfig = {
  slug: 'api-request-logs',
  access: {
    create: () => false,
    delete: isAdmin,
    read: isStaff,
    update: () => false,
  },
  admin: {
    defaultColumns: ['path', 'method', 'operation', 'statusCode', 'durationMs', 'createdAt'],
    description: 'Journal des requêtes API — écrit automatiquement, lecture seule.',
    useAsTitle: 'path',
  },
  fields: [
    { name: 'method', type: 'text' },
    { name: 'path', type: 'text', required: true },
    { name: 'collectionSlug', type: 'text' },
    { name: 'operation', type: 'text' },
    { name: 'statusCode', type: 'number' },
    { name: 'durationMs', type: 'number' },
    { name: 'userEmail', type: 'text' },
    { name: 'ip', type: 'text' },
  ],
  timestamps: true,
}
