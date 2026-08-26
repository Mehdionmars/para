import type { Payload } from 'payload'

/**
 * The client/server split on errors.
 *
 * Several routes answered a 500 with `err instanceof Error ? err.message`,
 * which sends whatever the failure happened to be straight to the browser.
 * From Postgres that is a genuinely useful map of the schema for anyone
 * probing:
 *
 *   duplicate key value violates unique constraint "products_sku_idx"
 *   null value in column "brand_id" of relation "products" violates ...
 *   relation "coupon_redemptions" does not exist
 *
 * Table names, column names, constraint names, and which of them a given
 * input reached. None of it helps the shopper, all of it helps an attacker,
 * and a connection-string error in the message would leak credentials
 * outright.
 *
 * So: one generic sentence to the client, the whole error object to the
 * server log. That is the direction the brief asks for, and it is the
 * opposite of what these routes did.
 *
 * This is only for *unexpected* failures. Deliberate, meaningful 4xx
 * messages — "il ne reste que 2 unités", "ce code promo a expiré" — are
 * written by hand at the point they occur and must keep saying exactly what
 * they say. Flattening those would make the shop unusable.
 */

/** Deliberately says nothing about what broke. */
export const GENERIC_ERROR = 'Une erreur est survenue. Réessayez dans un instant.'

export function serverError({
  context,
  err,
  payload,
  status = 500,
}: {
  /** What was being attempted, for the log line — e.g. "Checkout: validation du panier". */
  context: string
  err: unknown
  payload: Payload
  status?: number
}): Response {
  // The full object, not `err.message`: the stack, the Postgres `code`,
  // `detail`, `constraint` and `table` fields are exactly what makes an
  // incident diagnosable, and they are all on the error rather than in its
  // message.
  payload.logger.error({ err }, context)
  return Response.json({ error: GENERIC_ERROR }, { status })
}
