import { describe, expect, it } from "vitest";

import {
  keepLiveRoutines,
  lotDiscount,
  parseRoutineOffer,
  parseStoredRoutines,
  routineDiscount,
  withRoutine,
} from "@/lib/cart/routine";

/**
 * The cart's preview of the routine offer. It must reach the same amount as
 * backend/src/lib/routineOffer.ts for every lot the product page can build —
 * the figures below are the ones the backend tests assert (tests/unit/
 * checkoutRoutine.spec.ts: 400 + 370 at 15% = 115.5), so a drift in either
 * implementation shows up as a disagreement between the two suites.
 */

const ON = { enabled: true, minItems: 2, percent: 15 };
const BB = { price: 400, productId: 1, qty: 1 };
const SUN = { price: 370, productId: 2, qty: 1 };

describe("routineDiscount", () => {
  it("previews the amount checkout charges", () => {
    expect(routineDiscount({ lines: [BB, SUN], offer: ON, routines: [{ anchorId: 1, productIds: [1, 2] }] })).toBe(115.5);
  });

  it("discounts one unit per product, and the cheapest option of each", () => {
    const lines = [
      { price: 400, productId: 1, qty: 3 },
      { price: 600, productId: 2, qty: 1 },
      { price: 370, productId: 2, qty: 1 },
    ];
    expect(routineDiscount({ lines, offer: ON, routines: [{ anchorId: 1, productIds: [1, 2] }] })).toBe(115.5);
  });

  it("previews nothing when the offer is off, the anchor is missing, or a product left the cart", () => {
    const lot = { anchorId: 1, productIds: [1, 2] };
    expect(routineDiscount({ lines: [BB, SUN], offer: { ...ON, enabled: false }, routines: [lot] })).toBe(0);
    expect(routineDiscount({ lines: [BB, SUN], offer: ON, routines: [{ anchorId: 9, productIds: [1, 2] }] })).toBe(0);
    expect(routineDiscount({ lines: [BB], offer: ON, routines: [lot] })).toBe(0);
  });

  it("never counts a product in two lots", () => {
    const lines = [1, 2, 3].map((productId) => ({ price: 100, productId, qty: 1 }));
    const routines = [
      { anchorId: 1, productIds: [1, 2] },
      { anchorId: 3, productIds: [3, 2] },
    ];
    expect(routineDiscount({ lines, offer: ON, routines })).toBe(30);
  });
});

describe("lotDiscount", () => {
  it("respects the minimum and the three-product ceiling", () => {
    expect(lotDiscount(ON, [100])).toBe(0);
    expect(lotDiscount({ ...ON, minItems: 3 }, [100, 100])).toBe(0);
    expect(lotDiscount(ON, [100, 100, 100, 100])).toBe(0);
    expect(lotDiscount(ON, [100, 100, 100])).toBe(45);
  });
});

describe("withRoutine", () => {
  it("replaces the lot built from the same product", () => {
    const next = withRoutine([{ anchorId: 1, productIds: [1, 2] }], { anchorId: 1, productIds: [1, 3] });
    expect(next).toEqual([{ anchorId: 1, productIds: [1, 3] }]);
  });

  it("takes a product away from an older lot, dropping that lot when it breaks", () => {
    const next = withRoutine([{ anchorId: 1, productIds: [1, 2] }], { anchorId: 3, productIds: [3, 2] });
    expect(next).toEqual([{ anchorId: 3, productIds: [3, 2] }]);
  });
});

describe("keepLiveRoutines", () => {
  it("drops a lot once one of its products is removed from the cart", () => {
    const lot = { anchorId: 1, productIds: [1, 2] };
    expect(keepLiveRoutines([lot], [BB, SUN])).toEqual([lot]);
    expect(keepLiveRoutines([lot], [BB])).toEqual([]);
    expect(keepLiveRoutines([lot], [BB, { ...SUN, qty: 0 }])).toEqual([]);
  });
});

describe("parseRoutineOffer / parseStoredRoutines", () => {
  it("switches the offer off rather than guess", () => {
    expect(parseRoutineOffer(null).enabled).toBe(false);
    expect(parseRoutineOffer({ enabled: true, percent: 150 }).enabled).toBe(false);
    expect(parseRoutineOffer({ enabled: true, minItems: 3, percent: 15 })).toEqual({ enabled: true, minItems: 3, percent: 15 });
  });

  it("drops stored lots it cannot trust", () => {
    expect(
      parseStoredRoutines([
        { anchorId: 1, productIds: [1, 2] },
        { anchorId: 5, productIds: [1, 2] },
        { anchorId: 1, productIds: [1, 2, 3, 4] },
        "junk",
      ]),
    ).toEqual([{ anchorId: 1, productIds: [1, 2] }]);
  });
});
