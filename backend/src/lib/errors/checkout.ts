import { GENERIC_ERROR } from '../apiError'

/**
 * Named failures for the transactional path, and the single place they become
 * HTTP.
 *
 * The checkout route already wrote its 4xx responses by hand, each at the
 * point the condition was detected, and those messages are good — "il ne
 * reste que 2 unité(s)" tells a shopper what to do. What it did not have was
 * a *type* for those conditions, so the idempotency layer, the stock path and
 * the webhook guard each had to agree by convention on which status code
 * meant what.
 *
 * These classes give the conditions names and one mapping to HTTP. They do
 * not replace the hand-written messages: `toResponse` carries whatever the
 * thrower passed, and only falls back to the generic sentence for the cases
 * where saying more would leak (see lib/apiError.ts).
 *
 * The rule that matters: nothing in `details` is ever an internal string. A
 * Postgres constraint name, a Redis command, a stack — none of it crosses
 * this boundary. What goes out is what the shopper can act on.
 */

export type CheckoutErrorCode =
  | 'idempotency_key_missing'
  | 'idempotency_key_invalid'
  | 'idempotency_key_conflict'
  | 'idempotency_in_progress'
  | 'insufficient_stock'
  | 'payment_processing'

export class CheckoutError extends Error {
  readonly code: CheckoutErrorCode
  readonly status: number
  readonly details: Record<string, unknown>

  constructor(code: CheckoutErrorCode, status: number, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = new.target.name
    this.code = code
    this.status = status
    this.details = details
  }

  toResponse(): Response {
    return Response.json({ error: this.message, code: this.code, ...this.details }, { status: this.status })
  }
}

/** No `Idempotency-Key` header on an endpoint that requires one. 400: the
 * client sent a malformed request, and retrying it unchanged will not help. */
export class IdempotencyKeyMissingError extends CheckoutError {
  constructor() {
    super(
      'idempotency_key_missing',
      400,
      'En-tête Idempotency-Key requis pour cette opération.',
    )
  }
}

/** Present but not a shape we accept — too short, too long, or characters
 * outside the allowed set. Also 400, and deliberately does not echo the key
 * back: it came from the client and reflecting it verbatim into a JSON body
 * is a free reflection sink. */
export class IdempotencyKeyInvalidError extends CheckoutError {
  constructor() {
    super(
      'idempotency_key_invalid',
      400,
      'Idempotency-Key invalide : 8 à 200 caractères, alphanumériques, « _ . : - » uniquement.',
    )
  }
}

/**
 * The same key, a different request body.
 *
 * 409 rather than the 422 this used to answer. 422 says "I understood you and
 * the content is wrong", which frames it as a validation problem with the
 * *cart*; it is not. The cart may be perfectly valid — the conflict is with a
 * request that already exists under this key, which is what 409 is for, and
 * what every idempotency implementation a client library might have seen
 * expects.
 */
export class IdempotencyKeyConflictError extends CheckoutError {
  constructor() {
    super(
      'idempotency_key_conflict',
      409,
      'Cette clé d’idempotence a déjà été utilisée pour une requête différente.',
    )
  }
}

/** A first attempt under this key is still running. 409, not 202: 202 would
 * tell the client its request was accepted, and it was not — nothing new was
 * started, and the client should wait and retry rather than assume an order
 * is on its way. */
export class IdempotencyRequestInProgressError extends CheckoutError {
  constructor() {
    super(
      'idempotency_in_progress',
      409,
      'Cette commande est déjà en cours de traitement. Patientez quelques instants.',
    )
  }
}

/** The guarded UPDATE matched no row: someone else took the last units
 * between the read and the write. 409 — it is a conflict over a resource, and
 * the same request may well succeed later. */
export class InsufficientStockError extends CheckoutError {
  constructor(message: string, details: { productId?: number; variantId?: string; available?: number } = {}) {
    super('insufficient_stock', 409, message, details as Record<string, unknown>)
  }
}

/** A payment provider interaction failed in a way the shopper cannot fix. The
 * message is generic on purpose: provider error text routinely contains
 * merchant identifiers and internal decline reasons. */
export class PaymentProcessingError extends CheckoutError {
  constructor(message = GENERIC_ERROR) {
    super('payment_processing', 502, message)
  }
}

/** True for anything this module defines, so a route can map known failures
 * and let everything else fall through to `serverError`. */
export function isCheckoutError(err: unknown): err is CheckoutError {
  return err instanceof CheckoutError
}
