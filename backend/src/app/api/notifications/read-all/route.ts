import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { STAFF_ROLES, userHasRole } from '../../../../access/roles'
import { runSql, sql } from '../../../../lib/db/exec'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 15

/**
 * Marks every unread in-app notification as read.
 *
 * Scoped to the `internal` channel on purpose: "read" is a property of the
 * staff inbox. An email row's status describes *delivery*, and flipping it to
 * `read` would destroy the record of whether it was ever sent.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!userHasRole(user, ...STAFF_ROLES)) {
    return Response.json({ error: 'Non autorisé.' }, { status: 403 })
  }

  try {
    const updated = await runSql(
      { payload },
      sql`UPDATE notifications
             SET status = 'read', read_at = now(), updated_at = now()
           WHERE channel = 'internal' AND read_at IS NULL
           RETURNING id`,
    )
    return Response.json({ ok: true, updated: updated.length })
  } catch (err) {
    payload.logger.error({ err }, 'Marquage global comme lu échoué')
    return Response.json({ error: 'Impossible de tout marquer comme lu.' }, { status: 500 })
  }
}

export const POST = withApiLog('/api/notifications/read-all', handlePOST)
