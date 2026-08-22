/**
 * The statement that stops the shop overselling.
 *
 * `AND stock >= $1` is the entire oversell protection. Two concurrent
 * checkouts for the last unit both reach this UPDATE; PostgreSQL serialises
 * them on the row lock it takes, and the second matches zero rows and fails
 * instead of driving stock negative. A read-then-write ("is there stock? ok,
 * write stock - qty") lets both through — tests/db/concurrency.spec.ts
 * demonstrates exactly that, deterministically.
 *
 * It lives here rather than inline in the checkout route so the concurrency
 * tests can race the *real* statement. A test that re-typed this SQL would
 * keep passing after someone edited the route, which is the failure mode worth
 * designing out for the one query the stock invariant depends on.
 *
 * Parameters: $1 = quantity, $2 = product id.
 * Returns the resulting stock, and zero rows when the guard refuses.
 */
export const STOCK_DECREMENT_SQL =
  'UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2 AND stock >= $1 RETURNING stock'

/**
 * The compensating write, used when an order fails after its stock was
 * committed. Deliberately unguarded: it gives back units this request already
 * took, so there is no upper bound to check against.
 *
 * Parameters: $1 = quantity, $2 = product id.
 */
export const STOCK_RESTORE_SQL = 'UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2'
