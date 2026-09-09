/**
 * What a cart line is, and how two of them are told apart.
 *
 * The cart used to store `{ id, qty }` and price itself from the static
 * products snapshot at render time. That made three things impossible:
 * a shopper could not have 50 ml and 100 ml of the same cream in the cart at
 * once (the second add just incremented the first), the cart could not say
 * *which* option had been chosen, and the amount shown was whatever the
 * snapshot said today rather than what the shopper agreed to.
 *
 * A line now carries a snapshot of the thing bought, taken at the moment it
 * was added, and is identified by product **and** variant.
 */

export type CartLine = {
  /** `productId::variantId` — the line's identity. See `cartLineKey`. */
  key: string;
  productId: number;
  /** Null for a product with no options. */
  variantId: string | null;
  qty: number;

  // ---- snapshot, taken when the line was added -------------------------
  name: string;
  brand: string;
  slug: string;
  /** Unit price of the exact variant chosen. */
  price: number;
  /** Struck-through reference price, 0 when there is none. */
  oldPrice: number;
  image: string;
  /** e.g. "100 ml". Empty for a product with no options. */
  variantLabel: string;
  /** e.g. "Contenance". Empty for a product with no options. */
  variantType: string;
  sku: string;
};

/** Everything needed to add a line, minus the identity and the quantity. */
export type CartLineInput = Omit<CartLine, "key" | "qty">;

/**
 * Two different options of one product are two lines; the same option added
 * twice is one line of the summed quantity. Keying on the product alone was
 * what collapsed "50 ml + 100 ml" into "Produit × 2".
 */
export function cartLineKey(productId: number, variantId: string | null | undefined): string {
  return `${productId}::${variantId || "default"}`;
}

/**
 * A whole quantity of at least one.
 *
 * `Math.max(1, Math.floor(n))` alone does not deliver that: `Math.floor(NaN)`
 * is `NaN` and `Math.max(1, NaN)` is `NaN`, so the guard used to pass straight
 * through and a line could carry a `NaN` quantity into `linesSubtotal`, which
 * renders as "NaN MAD". No current caller can produce one — the quantity
 * stepper only ever emits integers — so this closes the contract rather than
 * fixing a live bug.
 */
function wholeQty(qty: number): number {
  return Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;
}

export function toCartLine(input: CartLineInput, qty: number): CartLine {
  return { ...input, key: cartLineKey(input.productId, input.variantId), qty: wholeQty(qty) };
}

/**
 * Adds `qty` of `input`, merging into the matching line when one exists.
 *
 * The existing line's snapshot is deliberately left alone: it is what the
 * shopper saw when they added it, and silently repricing a line already in
 * the cart because the catalogue moved is the behaviour this replaces.
 */
export function addLine(lines: CartLine[], input: CartLineInput, qty = 1): CartLine[] {
  const key = cartLineKey(input.productId, input.variantId);
  const at = lines.findIndex((l) => l.key === key);
  if (at === -1) return [...lines, toCartLine(input, qty)];
  const next = lines.slice();
  next[at] = { ...next[at], qty: next[at].qty + wholeQty(qty) };
  return next;
}

export function setQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  return lines.map((l) => (l.key === key ? { ...l, qty: wholeQty(qty) } : l));
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => l.key !== key);
}

export function linesSubtotal(lines: CartLine[]): number {
  return Math.round(lines.reduce((sum, l) => sum + l.price * l.qty, 0) * 100) / 100;
}

export function linesCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

/** What the checkout endpoint needs: which row, and how many. Never a price
 * — the server reads that from the database and ignores anything sent. */
export function toCheckoutLines(lines: CartLine[]): { id: number; variantId: string | null; qty: number }[] {
  return lines.map((l) => ({ id: l.productId, qty: l.qty, variantId: l.variantId }));
}

/**
 * Reads whatever is in localStorage, including carts written by the previous
 * `{ id, qty }` shape.
 *
 * A shopper who had a cart open across the deploy must not lose it, and must
 * not be handed lines with `undefined` prices either — so a legacy entry is
 * rehydrated through `lookup`, which the caller backs with the products
 * snapshot. An entry that can't be resolved is dropped rather than kept as a
 * line that would render blank.
 */
export function parseStoredLines(
  raw: unknown,
  lookup: (productId: number) => CartLineInput | null,
): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const qty = wholeQty(Number(row.qty));

    // localStorage is editable by anyone with devtools, so a stored price is
    // checked for being a real, non-negative amount and not merely for being
    // of type number: NaN and -50 are both numbers, and either would render a
    // nonsense line total. Such an entry is dropped, like any other that
    // cannot be resolved — the server never sees these amounts (see
    // toCheckoutLines), so this is about what the shopper is shown.
    const storedPrice = row.price;
    const usablePrice = typeof storedPrice === "number" && Number.isFinite(storedPrice) && storedPrice >= 0;

    if (typeof row.productId === "number" && usablePrice && typeof row.name === "string") {
      const variantId = typeof row.variantId === "string" && row.variantId ? row.variantId : null;
      out.push({
        brand: String(row.brand || ""),
        image: String(row.image || ""),
        key: cartLineKey(row.productId, variantId),
        name: row.name,
        oldPrice: Number(row.oldPrice) || 0,
        price: storedPrice,
        productId: row.productId,
        qty,
        sku: String(row.sku || ""),
        slug: String(row.slug || ""),
        variantId,
        variantLabel: String(row.variantLabel || ""),
        variantType: String(row.variantType || ""),
      });
      continue;
    }

    // Legacy shape: { id, qty }.
    const legacyId = Number(row.id);
    if (Number.isInteger(legacyId) && legacyId > 0) {
      const resolved = lookup(legacyId);
      if (resolved) out.push(toCartLine(resolved, qty));
    }
  }

  // A cart written by two tabs, or a legacy cart that resolved two entries to
  // the same product, must not end up with two lines of the same key.
  const merged: CartLine[] = [];
  for (const line of out) {
    const at = merged.findIndex((l) => l.key === line.key);
    if (at === -1) merged.push(line);
    else merged[at] = { ...merged[at], qty: merged[at].qty + line.qty };
  }
  return merged;
}
