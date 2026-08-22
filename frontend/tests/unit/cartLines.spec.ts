import { describe, expect, it } from "vitest";

import {
  addLine,
  type CartLine,
  type CartLineInput,
  cartLineKey,
  linesCount,
  linesSubtotal,
  parseStoredLines,
  removeLine,
  setQty,
  toCheckoutLines,
} from "@/lib/cart/lines";

/**
 * The rules a shopper's money depends on.
 *
 * The cart used to store `{ id, qty }` and re-price itself from the products
 * snapshot at render time. Adding 50 ml and then 100 ml of one cream produced
 * a single line reading "Produit × 2", at one price, with no record of which
 * option had been chosen — and the amount shown was whatever the catalogue
 * said today rather than what the shopper had agreed to. Each of these tests
 * pins one half of that.
 */

const CREAM_50: CartLineInput = {
  brand: "DCP",
  image: "/50.jpg",
  name: "Sunscreen Hydro",
  oldPrice: 0,
  price: 242,
  productId: 541,
  sku: "DCP-SUN-50",
  slug: "sunscreen-hydro",
  variantId: "v50",
  variantLabel: "50 ml",
  variantType: "Contenance",
};

const CREAM_100: CartLineInput = {
  ...CREAM_50,
  image: "/100.jpg",
  price: 389,
  sku: "DCP-SUN-100",
  variantId: "v100",
  variantLabel: "100 ml",
};

const NO_VARIANT: CartLineInput = {
  brand: "Avène",
  image: "/tolerance.jpg",
  name: "Tolérance Control",
  oldPrice: 0,
  price: 180,
  productId: 900,
  sku: "",
  slug: "tolerance-control",
  variantId: null,
  variantLabel: "",
  variantType: "",
};

describe("cartLineKey", () => {
  it("separates two options of the same product", () => {
    expect(cartLineKey(541, "v50")).not.toBe(cartLineKey(541, "v100"));
  });

  it("gives a product with no option a stable key", () => {
    expect(cartLineKey(900, null)).toBe(cartLineKey(900, undefined));
    expect(cartLineKey(900, null)).toBe("900::default");
  });

  it("separates the same option id across two products", () => {
    expect(cartLineKey(541, "v50")).not.toBe(cartLineKey(542, "v50"));
  });
});

describe("addLine", () => {
  it("keeps two options of one product as two lines", () => {
    const lines = addLine(addLine([], CREAM_50), CREAM_100);

    // The bug this replaces produced one line of qty 2.
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => l.variantLabel)).toEqual(["50 ml", "100 ml"]);
    expect(lines.map((l) => l.price)).toEqual([242, 389]);
    expect(linesCount(lines)).toBe(2);
    expect(linesSubtotal(lines)).toBe(631);
  });

  it("merges the same option added twice", () => {
    const lines = addLine(addLine([], CREAM_50, 1), CREAM_50, 2);
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(3);
  });

  it("leaves an existing line's snapshot alone when merging", () => {
    // The catalogue moved between the two adds. What the shopper agreed to is
    // the first price, and silently repricing the line is the behaviour this
    // whole snapshot exists to prevent.
    const lines = addLine(addLine([], CREAM_50), { ...CREAM_50, price: 999 }, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0].price).toBe(242);
    expect(lines[0].qty).toBe(2);
  });

  it("never adds fewer than one", () => {
    expect(addLine([], CREAM_50, 0)[0].qty).toBe(1);
    expect(addLine([], CREAM_50, -5)[0].qty).toBe(1);
  });

  it("handles a product with no option alongside one with options", () => {
    const lines = addLine(addLine([], CREAM_50), NO_VARIANT);
    expect(lines).toHaveLength(2);
    expect(lines[1].variantId).toBeNull();
  });
});

describe("setQty / removeLine", () => {
  const lines = addLine(addLine([], CREAM_50), CREAM_100);

  it("changes only the addressed line", () => {
    const next = setQty(lines, lines[1].key, 4);
    expect(next[0].qty).toBe(1);
    expect(next[1].qty).toBe(4);
  });

  it("floors the quantity at one rather than at zero", () => {
    // Decrementing past one must not leave a phantom line of qty 0; removing
    // is a separate, explicit action.
    expect(setQty(lines, lines[0].key, 0)[0].qty).toBe(1);
    expect(setQty(lines, lines[0].key, -3)[0].qty).toBe(1);
  });

  it("removes one option without touching the other", () => {
    const next = removeLine(lines, lines[0].key);
    expect(next).toHaveLength(1);
    expect(next[0].variantLabel).toBe("100 ml");
  });
});

describe("linesSubtotal", () => {
  it("prices from the line snapshots, not from any catalogue", () => {
    const lines = setQty(addLine(addLine([], CREAM_50), CREAM_100), cartLineKey(541, "v100"), 2);
    expect(linesSubtotal(lines)).toBe(242 + 389 * 2);
  });

  it("rounds to the centime rather than accumulating float drift", () => {
    const odd: CartLineInput = { ...NO_VARIANT, price: 0.1 };
    const lines = setQty(addLine([], odd), cartLineKey(900, null), 3);
    expect(linesSubtotal(lines)).toBe(0.3);
  });
});

describe("toCheckoutLines", () => {
  it("sends which option and how many, and no amount at all", () => {
    const lines = addLine(addLine([], CREAM_50), CREAM_100);
    expect(toCheckoutLines(lines)).toEqual([
      { id: 541, qty: 1, variantId: "v50" },
      { id: 541, qty: 1, variantId: "v100" },
    ]);
    // A price in the request body would be a price the server could be talked
    // into trusting.
    for (const line of toCheckoutLines(lines)) {
      expect(Object.keys(line).sort()).toEqual(["id", "qty", "variantId"]);
    }
  });
});

describe("parseStoredLines", () => {
  const lookup = (productId: number): CartLineInput | null =>
    productId === 900 ? NO_VARIANT : null;

  it("reads back a cart it wrote", () => {
    const lines = addLine(addLine([], CREAM_50, 2), CREAM_100);
    const restored = parseStoredLines(JSON.parse(JSON.stringify(lines)), lookup);
    expect(restored).toEqual(lines);
  });

  it("migrates a pre-variant { id, qty } cart through the lookup", () => {
    const restored = parseStoredLines([{ id: 900, qty: 3 }], lookup);
    expect(restored).toHaveLength(1);
    expect(restored[0].name).toBe("Tolérance Control");
    expect(restored[0].price).toBe(180);
    expect(restored[0].qty).toBe(3);
    expect(restored[0].variantId).toBeNull();
  });

  it("drops a legacy entry whose product no longer exists", () => {
    // Better an item quietly missing than a line rendering blank, or — worse —
    // rehydrated as a different product because the lookup fell back.
    expect(parseStoredLines([{ id: 4242, qty: 1 }], lookup)).toEqual([]);
  });

  it("merges duplicate keys written by two tabs", () => {
    const restored = parseStoredLines(
      [
        { ...CREAM_50, key: cartLineKey(541, "v50"), qty: 1 },
        { ...CREAM_50, key: cartLineKey(541, "v50"), qty: 2 },
      ],
      lookup,
    );
    expect(restored).toHaveLength(1);
    expect(restored[0].qty).toBe(3);
  });

  it("survives corrupt storage without throwing", () => {
    expect(parseStoredLines(null, lookup)).toEqual([]);
    expect(parseStoredLines("not an array", lookup)).toEqual([]);
    expect(parseStoredLines([null, 42, {}, { id: "x" }], lookup)).toEqual([]);
  });

  it("rebuilds the key rather than trusting the stored one", () => {
    // A key tampered with in devtools must not let one line masquerade as
    // another and merge into it.
    const restored = parseStoredLines([{ ...CREAM_100, key: "541::v50", qty: 1 }], lookup);
    expect(restored[0].key).toBe(cartLineKey(541, "v100"));
  });
});

describe("a full session", () => {
  it("carries the exact configuration from the product page to the checkout", () => {
    let lines: CartLine[] = [];
    lines = addLine(lines, CREAM_50, 1);
    lines = addLine(lines, CREAM_100, 2);
    lines = addLine(lines, NO_VARIANT, 1);

    expect(linesCount(lines)).toBe(4);
    expect(linesSubtotal(lines)).toBe(242 + 389 * 2 + 180);

    // The cart can say exactly what is being bought, for every line.
    expect(lines.map((l) => `${l.name} ${l.variantLabel}`.trim())).toEqual([
      "Sunscreen Hydro 50 ml",
      "Sunscreen Hydro 100 ml",
      "Tolérance Control",
    ]);
    expect(lines.map((l) => l.sku)).toEqual(["DCP-SUN-50", "DCP-SUN-100", ""]);

    // And each line points the server at its own row.
    expect(toCheckoutLines(lines).map((l) => l.variantId)).toEqual(["v50", "v100", null]);
  });
});

describe("quantity is always a whole number of at least one", () => {
  // No current caller can produce these — the stepper only ever emits
  // integers — so these pin the contract rather than reproduce a live bug.
  // Without the Number.isFinite guard, Math.max(1, Math.floor(NaN)) is NaN
  // and the line total renders as "NaN MAD".
  it("never lets a non-finite quantity through addLine", () => {
    expect(addLine([], CREAM_50, Number.NaN)[0].qty).toBe(1);
    expect(addLine([], CREAM_50, Number.POSITIVE_INFINITY)[0].qty).toBe(1);
  });

  it("never lets a non-finite quantity through setQty", () => {
    const lines = addLine([], CREAM_50, 2);
    expect(setQty(lines, lines[0].key, Number.NaN)[0].qty).toBe(1);
    expect(setQty(lines, lines[0].key, Number.POSITIVE_INFINITY)[0].qty).toBe(1);
  });

  it("keeps the subtotal a real number even then", () => {
    const lines = addLine([], CREAM_50, Number.NaN);
    expect(Number.isFinite(linesSubtotal(lines))).toBe(true);
    expect(linesSubtotal(lines)).toBe(242);
  });

  it("still floors a fractional quantity rather than rounding it up", () => {
    expect(addLine([], CREAM_50, 2.9)[0].qty).toBe(2);
  });
});

describe("a tampered localStorage price", () => {
  const noLookup = (): CartLineInput | null => null;

  it("drops a line whose stored price is negative or not a real number", () => {
    // A negative price would render a negative line total and a subtotal
    // smaller than what is owed. The server never sees these amounts (see
    // toCheckoutLines), so this is display integrity, not a payment hole.
    for (const price of [-50, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(parseStoredLines([{ ...CREAM_50, key: cartLineKey(541, "v50"), price, qty: 1 }], noLookup)).toEqual([]);
    }
  });

  it("still accepts a legitimate zero-price line", () => {
    // A free gift line is real; only negatives and non-numbers are refused.
    const restored = parseStoredLines([{ ...CREAM_50, key: cartLineKey(541, "v50"), price: 0, qty: 1 }], noLookup);
    expect(restored).toHaveLength(1);
    expect(restored[0].price).toBe(0);
  });
});
