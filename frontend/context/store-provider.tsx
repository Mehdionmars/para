"use client";

import { CartProvider } from "./cart-context";
import { FavoritesProvider } from "./favorites-context";
import { ToastProvider } from "./toast-context";

/** Combines the storefront's client-side state (cart, favorites, toast) in one provider. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <FavoritesProvider>
        <CartProvider>{children}</CartProvider>
      </FavoritesProvider>
    </ToastProvider>
  );
}
