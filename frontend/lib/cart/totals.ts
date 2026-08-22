/**
 * What a cart costs before checkout re-computes it.
 *
 * These rules used to live inside the `useMemo` in context/cart-context.tsx,
 * which meant the only way to exercise the free-shipping threshold was to
 * render a React provider. They are arithmetic, not state, so they live here
 * and are unit-tested directly.
 *
 * Authority note: none of this binds. `/api/checkout` recomputes the order
 * from the database and ignores any amount in the request body — see
 * backend/src/lib/pricing.ts, which owns the real shipping rules. What this
 * module produces is the *preview* a shopper is shown, and it must therefore
 * agree with the server or the shopper is quoted one price and charged
 * another.
 *
 * Deliberately dependency-free (no data/*.ts, no formatter): the threshold and
 * the fallback cost are passed in, so this stays testable in a node
 * environment and pulls none of the generated catalogue into the bundle.
 */

/**
 * Charged when the cart is below the free-shipping threshold and no shipping
 * rule from the CMS applies yet — i.e. before a city is chosen.
 *
 * It is a placeholder, not a quote: the server resolves the real cost from the
 * shipping-rules table, and CartView replaces this as soon as the shopper
 * picks a city. It does not correspond to any single rule.
 */
export const FALLBACK_SHIPPING_COST = 30;

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  /** 0-100, for the progress bar. */
  freeShippingProgress: number;
  /** How much more is needed; 0 once the threshold is met. */
  freeShippingRemaining: number;
  qualifiesForFreeShipping: boolean;
};

/**
 * An empty cart ships for nothing — showing a delivery charge under a cart
 * with no items in it reads as a bug to a shopper, and there is nothing to
 * deliver.
 */
export function cartTotals(
  subtotal: number,
  threshold: number,
  fallbackShippingCost: number = FALLBACK_SHIPPING_COST,
): CartTotals {
  const qualifiesForFreeShipping = subtotal >= threshold;
  const shipping = qualifiesForFreeShipping || subtotal === 0 ? 0 : fallbackShippingCost;

  // Guard the progress bar against a threshold of 0, which would otherwise
  // divide by zero and render NaN% wide.
  const ratio = threshold > 0 ? subtotal / threshold : 1;

  return {
    freeShippingProgress: Math.min(100, Math.round(ratio * 100)),
    freeShippingRemaining: Math.max(0, Math.round((threshold - subtotal) * 100) / 100),
    qualifiesForFreeShipping,
    shipping,
    subtotal,
    total: subtotal + shipping,
  };
}
