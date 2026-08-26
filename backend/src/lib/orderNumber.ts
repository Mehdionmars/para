import type { PoolClient } from 'pg'
import type { Payload } from 'payload'

/**
 * Order numbers, from a Postgres sequence.
 *
 * The previous generator was `PDH-YYMMDD-` plus four random base36
 * characters, on a column with a UNIQUE index. That is 1 679 616 values per
 * day, which sounds ample and is not: by the birthday bound, two orders in a
 * day collide with roughly even odds somewhere around 1 500 orders — a
 * perfectly ordinary sales day for a growing shop. And the collision is not a
 * near-miss the code retries. It is an INSERT rejected by the unique index,
 * *after* the checkout transaction has already committed the stock
 * decrement: the shopper gets a 500, the units are gone, and the order does
 * not exist.
 *
 * A sequence cannot collide, needs no retry loop, and sorts chronologically —
 * which the back office already assumed was true of these numbers.
 *
 * The date prefix is kept: it is what staff read off the number, and it is on
 * every invoice printed so far.
 */

function datePrefix(now = new Date()): string {
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/** Base36, upper case, left-padded to four so the format matches every
 * number already issued. It grows past four characters rather than wrapping —
 * a longer number is fine, a reused one is not. */
function encode(value: number | string): string {
  return Number(value).toString(36).toUpperCase().padStart(4, '0')
}

/**
 * Issues the next number on an existing client — used inside the checkout's
 * transaction, so the number is drawn on the same connection as the order.
 *
 * `nextval` is explicitly non-transactional in Postgres: a rolled-back
 * checkout still consumes its value. That is the correct trade. Gaps in the
 * sequence are cosmetic; a reused number is a duplicate invoice.
 */
export async function nextOrderNumber(client: PoolClient): Promise<string> {
  const res = await client.query(`SELECT nextval('order_number_seq') AS n`)
  return `PDH-${datePrefix()}-${encode(res.rows[0].n)}`
}

/**
 * Same thing for callers that have a Payload instance rather than a client —
 * the collection's `defaultValue`, which fires for orders created in the
 * admin UI rather than through the checkout.
 */
export async function nextOrderNumberFromPayload(payload: Payload): Promise<string> {
  const client = await payload.db.pool.connect()
  try {
    return await nextOrderNumber(client)
  } finally {
    client.release()
  }
}
