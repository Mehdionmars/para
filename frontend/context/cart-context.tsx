"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FREE_SHIPPING_THRESHOLD } from "@/data/home";
import { getProduct, money, productImage } from "@/data/products";
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
import { type CartRoutine, keepLiveRoutines, parseStoredRoutines, withRoutine } from "@/lib/cart/routine";
import { cartTotals } from "@/lib/cart/totals";

// Bumped from "pdh-cart": the stored shape changed from { id, qty } to a
// full line snapshot. The old key is read once, migrated and then left
// alone, so a shopper mid-purchase across the deploy keeps their cart and a
// rollback would still find the old one intact.
const STORAGE_KEY = "pdh-cart-v2";
const LEGACY_STORAGE_KEY = "pdh-cart";
/** Lots from "Complétez votre routine", beside the lines rather than inside
 * them: a lot is a relation between lines, and keeping it out of the line
 * shape leaves pdh-cart-v2 readable by a build that predates it. */
const ROUTINES_STORAGE_KEY = "pdh-routines-v1";

export type { CartLine, CartLineInput };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingProgress: number; // 0-100
  freeShippingMessage: string;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Adds a fully described line. `lineKey` on the result is what every
   * other method takes, so a caller never has to rebuild the identity. */
  add: (item: CartLineInput, qty?: number) => void;
  /** Convenience for the surfaces that sell a product with no option chosen
   * (grid cards, rails): builds the snapshot from the product itself. */
  addProduct: (
    product: { id: number; name: string; brand: string; slug: string; price: number; old?: number; image?: string; sku?: string },
    qty?: number,
  ) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** True when this exact product+variant is already in the cart. */
  has: (productId: number, variantId?: string | null) => boolean;
  /** The payload the checkout endpoint expects — ids and quantities only. */
  checkoutLines: () => { id: number; variantId: string | null; qty: number }[];
  /** Routine lots whose products are all still in the cart. */
  routines: CartRoutine[];
  /** Records a lot built on a product page. Its lines are added separately. */
  addRoutine: (lot: CartRoutine) => void;
  money: typeof money;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Rehydrates a pre-variant `{ id, qty }` entry from the products snapshot. */
function legacyLookup(productId: number): CartLineInput | null {
  // getProduct falls back to the first product rather than returning null, so
  // the id has to be re-checked: rehydrating an unknown id would otherwise
  // silently put a completely different product in someone's cart.
  const product = getProduct(productId);
  if (!product || product.id !== productId) return null;
  return {
    brand: product.brand,
    image: productImage(product.id),
    name: product.name,
    oldPrice: product.old || 0,
    price: product.price,
    productId: product.id,
    sku: "",
    slug: product.slug,
    variantId: null,
    variantLabel: "",
    variantType: "",
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [storedRoutines, setStoredRoutines] = useState<CartRoutine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reads localStorage after mount (server and first client render both
    // start empty) so hydration never mismatches; the resulting extra
    // render is the deliberate cost of that, not an accidental one.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(parseStoredLines(JSON.parse(raw), legacyLookup));
      const rawRoutines = window.localStorage.getItem(ROUTINES_STORAGE_KEY);
      if (rawRoutines) setStoredRoutines(parseStoredRoutines(JSON.parse(rawRoutines)));
    } catch {
      // Corrupt or inaccessible storage: start from an empty cart.
    }
    setHydrated(true);
  }, []);

  // A lot broken by removing one of its products is dropped for good, not
  // kept dormant to revive if the product is added back on its own later.
  const routineLines = useMemo(() => lines.map((l) => ({ price: l.price, productId: l.productId, qty: l.qty })), [lines]);
  const routines = useMemo(() => keepLiveRoutines(storedRoutines, routineLines), [storedRoutines, routineLines]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    window.localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
  }, [lines, routines, hydrated]);

  const addRoutine = useCallback((lot: CartRoutine) => {
    setStoredRoutines((prev) => withRoutine(prev, lot));
  }, []);

  const add = useCallback((item: CartLineInput, qty = 1) => {
    setLines((prev) => addLine(prev, item, qty));
  }, []);

  const addProduct = useCallback<CartContextValue["addProduct"]>((product, qty = 1) => {
    setLines((prev) =>
      addLine(
        prev,
        {
          brand: product.brand,
          image: product.image || productImage(product.id),
          name: product.name,
          oldPrice: product.old || 0,
          price: product.price,
          productId: product.id,
          sku: product.sku || "",
          slug: product.slug,
          // A card in a grid sells the product as configured by default —
          // choosing an option is what the product page is for.
          variantId: null,
          variantLabel: "",
          variantType: "",
        },
        qty,
      ),
    );
  }, []);

  const increment = useCallback((key: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)));
  }, []);

  const decrement = useCallback((key: string) => {
    setLines((prev) => setQty(prev, key, (prev.find((l) => l.key === key)?.qty ?? 1) - 1));
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => removeLine(prev, key));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setStoredRoutines([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    // From the line snapshots, not from today's catalogue: the amount a
    // shopper is asked to confirm is the one they were shown. The arithmetic
    // itself lives in lib/cart/totals.ts so it can be tested without
    // rendering a provider.
    const count = linesCount(lines);
    const { freeShippingProgress, freeShippingRemaining, qualifiesForFreeShipping, shipping, subtotal, total } =
      cartTotals(linesSubtotal(lines), FREE_SHIPPING_THRESHOLD);
    const freeShippingMessage = qualifiesForFreeShipping
      ? "Livraison offerte débloquée ✦"
      : `Plus que ${money(freeShippingRemaining)} pour la livraison offerte`;

    return {
      add,
      addProduct,
      addRoutine,
      checkoutLines: () => toCheckoutLines(lines),
      clear,
      closeCart: () => setIsOpen(false),
      count,
      decrement,
      freeShippingMessage,
      freeShippingProgress,
      has: (productId, variantId) => lines.some((l) => l.key === cartLineKey(productId, variantId ?? null)),
      increment,
      isOpen,
      lines,
      money,
      openCart: () => setIsOpen(true),
      remove,
      routines,
      shipping,
      subtotal,
      total,
    };
  }, [lines, routines, isOpen, add, addProduct, addRoutine, increment, decrement, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
