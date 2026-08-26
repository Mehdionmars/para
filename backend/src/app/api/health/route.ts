import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Liveness/readiness probe for the platform health check (Render).
 *
 * It answers for the one dependency whose absence makes the process useless
 * while it still accepts connections: Postgres. A container that boots, binds
 * the port and cannot reach its database looks healthy to a TCP check and
 * serves 500s to every visitor, so the check has to touch the pool.
 *
 * `SELECT 1` and nothing more — a probe runs on a short interval forever, and
 * anything heavier turns the health check itself into load.
 *
 * The failure body says only that the check failed. This endpoint is
 * unauthenticated by necessity (the platform calls it before any session
 * exists), so the driver's error text — which carries host names and, on a
 * connection failure, the connection string — must never reach it. It goes to
 * the server log instead, the same split lib/apiError.ts makes.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  try {
    await payload.db.pool.query('SELECT 1')
  } catch (err) {
    payload.logger.error({ err }, 'Health check: Postgres injoignable')
    return Response.json({ status: 'error', database: 'down' }, { status: 503 })
  }

  return Response.json({ status: 'ok', database: 'up' })
}
