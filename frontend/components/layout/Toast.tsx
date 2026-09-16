"use client";

import { Check } from "lucide-react";
import { useToast } from "@/context/toast-context";

const ADDED_SUFFIX = " ajouté au panier";

export function Toast() {
  const { message, isVisible } = useToast();
  // When the line is too long it is the product name that gets cut, never
  // what happened to it: "PACK DUO MOUSSE FL… ajouté au panier".
  const suffix = message?.endsWith(ADDED_SUFFIX) && message.length > ADDED_SUFFIX.length ? ADDED_SUFFIX : "";

  // Styles live in globals.css (.site-toast): the position has to react to the
  // mobile sticky bars, which only a body-class selector can do.
  return (
    <div aria-live="polite" role="status" className="site-toast-region">
      {isVisible && (
        <div className="site-toast">
          <span aria-hidden="true" className="site-toast-check">
            <Check size={12} color="#fff" strokeWidth={2.5} />
          </span>
          {suffix ? (
            <span className="site-toast-text">
              <span className="site-toast-name">{message.slice(0, -suffix.length)}</span>
              <span className="site-toast-suffix">{suffix}</span>
            </span>
          ) : (
            <span className="site-toast-text site-toast-name">{message}</span>
          )}
        </div>
      )}
    </div>
  );
}
