import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { userHasRole } from '../../../../../access/roles'
import { MAX_ATTEMPTS, retryNotificationDelivery } from '../../../../../lib/notifications/retry'
import { withApiLog } from '../../../../../lib/withApiLog'

export const maxDuration = 20

/** Human-readable refusals. The provider's own error is surfaced too, but
 * only to staff — it never reaches a customer. */
const REASONS: Record<string, { message: string; status: number }> = {
  'already-sent': { message: 'Cette notification a déjà été délivrée.', status: 409 },
  'internal-channel': { message: 'Une notification interne n’a pas de livraison à relancer.', status: 400 },
  'max-attempts': { message: `Limite de ${MAX_ATTEMPTS} tentatives atteinte.`, status: 429 },
  'no-recipient': { message: 'Aucun destinataire enregistré pour cette notification.', status: 400 },
  'not-found': { message: 'Notification introuvable.', status: 404 },
}

/**
 * Re-attempts one delivery. Admin/manager only: it contacts a real recipient.
 *
 * Nothing is created — same notification id, same dedupe key. See
 * lib/notifications/retry.ts.
 */
async function handlePOST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!userHasRole(user, 'admin', 'manager')) {
    return Response.json({ error: 'Non autorisé.' }, { status: 403 })
  }

  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Identifiant invalide.' }, { status: 400 })
  }

  const result = await retryNotificationDelivery({ id, payload })

  if (result.ok) return Response.json({ attempts: result.attempts, ok: true, status: 'sent' })

  if (result.reason === 'delivery-failed') {
    // 200, not an error status: the retry *ran*: the dashboard needs the new
    // attempt count and the reason, not a transport failure.
    return Response.json({
      attempts: result.attempts,
      error: result.error,
      ok: false,
      status: result.status,
    })
  }

  const refusal = REASONS[result.reason]
  return Response.json(
    { attempts: 'attempts' in result ? result.attempts : undefined, error: refusal.message, ok: false },
    { status: refusal.status },
  )
}

export const POST = withApiLog('/api/notifications/[id]/retry', handlePOST)
