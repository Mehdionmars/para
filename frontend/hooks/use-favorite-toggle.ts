"use client";

import { useCallback } from "react";
import { useFavorites } from "@/context/favorites-context";
import { useToast } from "@/context/toast-context";

/** A short beat on the heart as it fills. Web Animations rather than a CSS
 * class: nothing to clean up, and skipped entirely for reduced motion. */
function pulse(el: HTMLElement | null | undefined) {
  if (!el || typeof el.animate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(1)" }], {
    duration: 320,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });
}

/**
 * Save or unsave a product, and say so.
 *
 * One behaviour for every heart on the site — product cards and the product
 * page. The filled heart alone never told a shopper where the product went: a
 * save now says "Ajouté à vos favoris — Voir", linking to /favoris, and a
 * removal (often a missed tap) says "Retiré de vos favoris — Annuler".
 */
export function useFavoriteToggle() {
  const favorites = useFavorites();
  const toast = useToast();

  return useCallback(
    (productId: number, heart?: HTMLElement | null) => {
      const wasFavorite = favorites.isFavorite(productId);
      favorites.toggle(productId);
      if (wasFavorite) {
        toast.fire("Retiré de vos favoris", { label: "Annuler", onClick: () => favorites.toggle(productId) });
      } else {
        toast.fire("Ajouté à vos favoris", { href: "/favoris", label: "Voir" });
        pulse(heart);
      }
    },
    [favorites, toast],
  );
}
