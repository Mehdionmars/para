import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

export { sql }

/** The tagged-template type `sql` produces. Not re-exported by the adapter,
 * so it is derived from the function itself. */
type SQL = ReturnType<typeof sql>

/**
 * Runs raw SQL on the *caller's* transaction when there is one.
 *
 * This matters inside collection hooks. Payload runs `afterChange` within the
 * transaction that performed the write, and that transaction holds a row lock
 * on the document. A statement issued on a fresh pool connection — which is
 * what `payload.db.pool.connect()` gives you — is a different session, so any
 * insert whose foreign key points at the locked row waits for a lock the
 * hook itself is blocking: the request hangs until the statement times out.
 *
 * That is exactly what happened with `order_status_history.order_id` and
 * `notifications.order_id`. Joining the existing transaction removes the
 * conflict entirely, and has the better semantics anyway — the history entry
 * and the status change now commit or roll back together.
 *
 * Outside a transaction (custom REST routes, scripts) it falls back to the
 * adapter's default connection.
 */
type Executor = { execute: (query: SQL) => Promise<{ rows: Record<string, unknown>[] }> }

type DrizzleAdapter = {
  drizzle: Executor
  sessions?: Record<string, { db: Executor }>
}

export async function runSql(
  target: { payload: Payload; req?: PayloadRequest } | PayloadRequest,
  query: SQL,
): Promise<Record<string, unknown>[]> {
  const req = 'payload' in target && 'transactionID' in target ? (target as PayloadRequest) : undefined
  const payload = 'payload' in target ? (target.payload as Payload) : (target as unknown as Payload)

  const adapter = payload.db as unknown as DrizzleAdapter
  const transactionID = req?.transactionID
  const session = transactionID ? adapter.sessions?.[String(transactionID)] : undefined

  const result = await (session?.db ?? adapter.drizzle).execute(query)
  return result.rows ?? []
}
