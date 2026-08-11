import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { syncInstagramPosts } from '../../../lib/instagramSync'

export const maxDuration = 30

/**
 * Triggers a pull of the latest @paradhiver Instagram posts into the
 * `instagram-posts` collection. Meant to be called periodically by whatever
 * scheduler the deployment uses (cron, GitHub Actions, a host's built-in
 * cron) — e.g.:
 *
 *   curl -X POST https://your-backend/api/instagram-sync \
 *     -H "Authorization: Bearer $INSTAGRAM_SYNC_SECRET"
 *
 * Guarded by a shared secret rather than a Payload session so an
 * unauthenticated scheduler can call it; INSTAGRAM_ACCESS_TOKEN itself is
 * only ever read server-side inside lib/instagramSync.ts.
 */
export async function POST(request: Request) {
  const secret = process.env.INSTAGRAM_SYNC_SECRET
  if (!secret) {
    return Response.json({ error: 'INSTAGRAM_SYNC_SECRET is not configured on the server' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const result = await syncInstagramPosts(payload)

  return Response.json(result, { status: result.error ? 502 : 200 })
}
