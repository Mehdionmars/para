"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "pdh-favorites";

type FavoritesContextValue = {
  favorites: Record<number, boolean>;
  count: number;
  isFavorite: (productId: number) => boolean;
  toggle: (productId: number) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reads localStorage after mount (server and first client render both
    // start empty) so hydration never mismatches; the resulting extra
    // render is the deliberate cost of that, not an accidental one.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      // Corrupt or inaccessible storage: start from no favorites.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const toggle = useCallback((productId: number) => {
    setFavorites((prev) => ({ ...prev, [productId]: !prev[productId] }));
  }, []);

  const isFavorite = useCallback((productId: number) => !!favorites[productId], [favorites]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      count: Object.values(favorites).filter(Boolean).length,
      isFavorite,
      toggle,
    }),
    [favorites, isFavorite, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
