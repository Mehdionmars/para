import { describe, expect, it } from "vitest";

import { FALLBACK_SHIPPING_COST, cartTotals } from "@/lib/cart/totals";

/**
 * The free-shipping rule, as a shopper experiences it.
 *
 * These numbers are a preview: /api/checkout recomputes the order from the
 * database and is the authority. That is exactly why they are pinned — a
 * preview that disagrees with the server quotes one price and charges
 * another, which is the failure mode worth catching here.
 *
 * The threshold shipping today is 399 MAD (data/home.ts), passed in rather
 * than imported so a content re-sync cannot silently rewrite these tests.
 */

const THRESHOLD = 399;

describe("shipping cost", () => {
  it("charges the fallback below the threshold", () => {
    expect(cartTotals(100, THRESHOLD).shipping).toBe(FALLBACK_SHIPPING_COST);
    expect(cartTotals(398.99, THRESHOLD).shipping).toBe(FALLBACK_SHIPPING_COST);
  });

  it("treats the threshold as inclusive", () => {
    // 399 exactly must qualify: "livraison offerte dès 399 MAD" is how it is
    // advertised, and an off-by-one here charges the shopper who did the sum.
    expect(cartTotals(THRESHOLD, THRESHOLD).shipping).toBe(0);
    expect(cartTotals(THRESHOLD, THRESHOLD).qualifiesForFreeShipping).toBe(true);
    expect(cartTotals(398.99, THRESHOLD).qualifiesForFreeShipping).toBe(false);
  });

  it("charges nothing above the threshold", () => {
    expect(cartTotals(1000, THRESHOLD).shipping).toBe(0);
  });

  it("charges nothing for an empty cart", () => {
    // A delivery charge under a cart with nothing in it reads as a bug.
    const totals = cartTotals(0, THRESHOLD);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(0);
  });
});

describe("total", () => {
  it("adds shipping to the subtotal below the threshold", () => {
    expect(cartTotals(100, THRESHOLD).total).toBe(100 + FALLBACK_SHIPPING_COST);
  });

  it("equals the subtotal once delivery is free", () => {
    expect(cartTotals(500, THRESHOLD).total).toBe(500);
  });
});

describe("free-shipping progress", () => {
  it("reports how far along the cart is", () => {
    expect(cartTotals(0, THRESHOLD).freeShippingProgress).toBe(0);
    expect(cartTotals(399, THRESHOLD).freeShippingProgress).toBe(100);
    // 200/399 = 50.1%
    expect(cartTotals(200, THRESHOLD).freeShippingProgress).toBe(50);
  });

  it("never reports more than a full bar", () => {
    expect(cartTotals(10_000, THRESHOLD).freeShippingProgress).toBe(100);
  });

  it("does not divide by zero when the threshold is unset", () => {
    // A content edit that clears the threshold must not render a NaN%-wide bar.
    const totals = cartTotals(50, 0);
    expect(totals.freeShippingProgress).toBe(100);
    expect(Number.isNaN(totals.freeShippingProgress)).toBe(false);
  });
});

describe("remaining to free shipping", () => {
  it("reports what is still missing", () => {
    expect(cartTotals(99, THRESHOLD).freeShippingRemaining).toBe(300);
  });

  it("never goes negative once the threshold is passed", () => {
    // This value is formatted straight into "Plus que X pour la livraison
    // offerte"; a negative would render as "Plus que -120,00 MAD".
    expect(cartTotals(519, THRESHOLD).freeShippingRemaining).toBe(0);
    expect(cartTotals(THRESHOLD, THRESHOLD).freeShippingRemaining).toBe(0);
  });

  it("rounds to the centime rather than showing float drift", () => {
    // 399 - 0.1 - 0.2 would otherwise surface as 398.699999...
    expect(cartTotals(0.1 + 0.2, THRESHOLD).freeShippingRemaining).toBe(398.7);
  });
});

describe("a shopper crossing the threshold", () => {
  it("switches from a charge to free delivery at the moment the cart qualifies", () => {
    const before = cartTotals(390, THRESHOLD);
    const after = cartTotals(400, THRESHOLD);

    expect(before.shipping).toBe(FALLBACK_SHIPPING_COST);
    expect(before.total).toBe(420);
    expect(before.freeShippingRemaining).toBe(9);

    expect(after.shipping).toBe(0);
    expect(after.total).toBe(400);
    expect(after.freeShippingRemaining).toBe(0);

    // Adding 10 MAD of product made the order cheaper overall — the whole
    // point of the threshold, and worth pinning so it stays true.
    expect(after.total).toBeLessThan(before.total);
  });
});
