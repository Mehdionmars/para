import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 15

type SubscribeBody = {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
  email?: string
}

/**
 * Registers a browser for Web Push.
 *
 * Public, like the checkout: a subscribing browser has no session. The
 * endpoint URL is the natural identity of a subscription, so re-subscribing
 * refreshes the existing row instead of accumulating duplicates — browsers
 * re-issue the same endpoint on every page load once permission is granted.
 *
 * Nothing is sent yet: pushProvider reports itself unconfigured until VAPID
 * keys and a signing implementation exist. Collecting subscriptions now means
 * there is an audience the day it is turned on.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  let body: SubscribeBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const endpoint = body.endpoint?.trim()
  const p256dh = body.keys?.p256dh?.trim()
  const auth = body.keys?.auth?.trim()

  if (!endpoint || !p256dh || !auth) {
    return Response.json({ error: 'Abonnement incomplet.' }, { status: 400 })
  }
  // Guards against an arbitrary URL being stored and later contacted by the
  // push sender once it exists.
  if (!/^https:\/\//i.test(endpoint)) {
    return Response.json({ error: 'Endpoint invalide.' }, { status: 400 })
  }

  const client = await payload.db.pool.connect()
  try {
    await client.query(
      `INSERT INTO push_subscriptions
         (endpoint, p256dh, auth, customer_email, user_agent, last_used_at, updated_at, created_at)
       VALUES ($1, $2, $3, $4, $5, now(), now(), now())
       ON CONFLICT (endpoint) DO UPDATE
         SET p256dh = EXCLUDED.p256dh,
             auth = EXCLUDED.auth,
             customer_email = COALESCE(EXCLUDED.customer_email, push_subscriptions.customer_email),
             last_used_at = now(),
             updated_at = now()`,
      [
        endpoint,
        p256dh,
        auth,
        body.email?.trim().toLowerCase() || null,
        request.headers.get('user-agent')?.slice(0, 300) || null,
      ],
    )
    return Response.json({ ok: true })
  } catch (err) {
    payload.logger.error({ err }, 'Abonnement push non enregistré')
    return Response.json({ error: "Impossible d'enregistrer l'abonnement." }, { status: 500 })
  } finally {
    client.release()
  }
}

export const POST = withApiLog('/api/push/subscribe', handlePOST)
