import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 15

/**
 * Removes a push subscription.
 *
 * Knowing the endpoint is the authorisation: it is an opaque, unguessable
 * URL issued by the browser's push service to that browser alone. Requiring
 * a session instead would leave subscriptions undeletable, since none of the
 * browsers holding them are signed in.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  let endpoint: string | undefined
  try {
    endpoint = ((await request.json()) as { endpoint?: string }).endpoint?.trim()
  } catch {
    return Response.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!endpoint) return Response.json({ error: 'Endpoint requis.' }, { status: 400 })

  const client = await payload.db.pool.connect()
  try {
    const deleted = await client.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint])
    return Response.json({ ok: true, removed: deleted.rowCount ?? 0 })
  } catch (err) {
    payload.logger.error({ err }, 'Désabonnement push échoué')
    return Response.json({ error: 'Impossible de supprimer l’abonnement.' }, { status: 500 })
  } finally {
    client.release()
  }
}

export const POST = withApiLog('/api/push/unsubscribe', handlePOST)
