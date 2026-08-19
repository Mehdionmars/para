import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { STAFF_ROLES, userHasRole } from '../../../../../access/roles'
import { withApiLog } from '../../../../../lib/withApiLog'

export const maxDuration = 15

/**
 * Marks an internal notification as read.
 *
 * Staff-only, because the notification bell lives in the staff dashboard —
 * there is no customer account system to authenticate a shopper against yet.
 * When one exists, this is the single place that has to learn about it.
 *
 * The update is guarded (`read_at IS NULL`) so a double click sets the
 * timestamp once rather than sliding it forward on every request.
 */
async function handlePOST(request: Request, context: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers: request.headers })
  if (!userHasRole(user, ...STAFF_ROLES)) {
    return Response.json({ error: 'Non autorisé.' }, { status: 403 })
  }

  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Identifiant invalide.' }, { status: 400 })
  }

  const client = await payload.db.pool.connect()
  try {
    const updated = await client.query(
      `UPDATE notifications
          SET status = 'read', read_at = now(), updated_at = now()
        WHERE id = $1 AND read_at IS NULL
        RETURNING id, read_at`,
      [id],
    )

    if (updated.rowCount === 0) {
      // Either it doesn't exist or it was already read. Both are a no-op for
      // the caller, so distinguishing them would only leak whether an id is
      // in use.
      return Response.json({ alreadyRead: true, ok: true })
    }

    return Response.json({ ok: true, readAt: updated.rows[0].read_at })
  } catch (err) {
    payload.logger.error({ err }, `Notification ${id} non marquée comme lue`)
    return Response.json({ error: 'Impossible de marquer comme lue.' }, { status: 500 })
  } finally {
    client.release()
  }
}

export const POST = withApiLog('/api/notifications/[id]/read', handlePOST)
