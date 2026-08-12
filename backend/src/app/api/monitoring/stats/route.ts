import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { userHasRole } from '../../../../access/roles'

const SAMPLE_SIZE = 500
const RECENT_SIZE = 50

type LogRow = {
  createdAt: string
  durationMs?: number | null
  method?: string | null
  operation?: string | null
  path: string
  statusCode?: number | null
}

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !userHasRole(user, 'admin', 'manager')) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { docs } = await payload.find({
    collection: 'api-request-logs',
    depth: 0,
    limit: SAMPLE_SIZE,
    sort: '-createdAt',
  })
  const rows = docs as unknown as LogRow[]

  const byEndpoint = new Map<string, { count: number; errors: number; totalDurationMs: number; withDuration: number }>()
  let totalDurationMs = 0
  let withDuration = 0
  let errors = 0

  for (const row of rows) {
    const key = `${row.method || '?'} ${row.path}`
    const entry = byEndpoint.get(key) ?? { count: 0, errors: 0, totalDurationMs: 0, withDuration: 0 }
    entry.count += 1
    if (typeof row.durationMs === 'number') {
      entry.totalDurationMs += row.durationMs
      entry.withDuration += 1
      totalDurationMs += row.durationMs
      withDuration += 1
    }
    if ((row.statusCode ?? 200) >= 400) {
      entry.errors += 1
      errors += 1
    }
    byEndpoint.set(key, entry)
  }

  const topEndpoints = [...byEndpoint.entries()]
    .map(([endpoint, e]) => ({
      avgDurationMs: e.withDuration > 0 ? Math.round(e.totalDurationMs / e.withDuration) : null,
      count: e.count,
      endpoint,
      errorRate: e.count > 0 ? e.errors / e.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  return Response.json({
    avgDurationMs: withDuration > 0 ? Math.round(totalDurationMs / withDuration) : null,
    errorRate: rows.length > 0 ? errors / rows.length : 0,
    recent: rows.slice(0, RECENT_SIZE),
    sampleSize: rows.length,
    topEndpoints,
    totalRequests: rows.length,
  })
}
