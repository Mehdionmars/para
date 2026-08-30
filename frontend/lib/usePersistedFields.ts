"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keeps a form's typed values across a reload.
 *
 * ## Why a hook rather than lifting the forms into context
 *
 * Both callers already hold one `useState` per field, which is the right
 * shape for a form. This mirrors those values into storage instead of
 * restructuring them, so a field keeps its own validation and error wiring.
 *
 * ## Hydration
 *
 * Storage is read *after* mount, never during render, and the restore is
 * applied once. Server and first client render therefore both start from the
 * same empty form and cannot mismatch — the same trade the cart makes in
 * context/cart-context.tsx, and for the same reason.
 *
 * ## What it deliberately does not do
 *
 * It stores plain strings under a versioned key and nothing else. It is not a
 * place for anything a shopper would not want the next person on a shared
 * machine to read: callers that hold personal details are expected to call
 * `clear()` once those details have served their purpose.
 */
export function usePersistedFields(
  storageKey: string,
  values: Record<string, string>,
  restore: (saved: Record<string, string>) => void,
): { clear: () => void; restored: boolean } {
  const [restored, setRestored] = useState(false);
  // Captured once, deliberately not kept in sync: the restore runs a single
  // time on mount, and re-pointing this at a later closure would only risk
  // replaying saved values over what the shopper is currently typing.
  const restoreRef = useRef(restore);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          /** Only strings are restored: anything else is a corrupt or
           *  tampered entry, and a form field can hold nothing else. */
          const clean: Record<string, string> = {};
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof v === "string") clean[k] = v;
          }
          if (Object.keys(clean).length > 0) restoreRef.current(clean);
        }
      }
    } catch {
      // Private mode, disabled storage, or a corrupt entry: start empty. A
      // form that cannot be remembered is an inconvenience, not a failure.
    }
    // Same trade as context/cart-context.tsx: one extra render after mount is
    // the price of never mismatching hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRestored(true);
  }, [storageKey]);

  // Derived outside the effect: `values` is a fresh object every render, so it
  // is the serialised form and the emptiness flag that are the real
  // dependencies — and both are plain variables the linter can check.
  const serialised = JSON.stringify(values);
  const hasContent = Object.values(values).some((v) => v.trim().length > 0);

  useEffect(() => {
    if (!restored) return;
    try {
      // An entirely empty form writes nothing and removes any earlier entry,
      // so clearing the fields by hand is also how a shopper forgets them.
      if (hasContent) window.localStorage.setItem(storageKey, serialised);
      else window.localStorage.removeItem(storageKey);
    } catch {
      // Storage full or unavailable — the form still works, it just forgets.
    }
  }, [storageKey, restored, serialised, hasContent]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Nothing to do: the entry either never existed or is unreachable.
    }
  }, [storageKey]);

  return { clear, restored };
}
