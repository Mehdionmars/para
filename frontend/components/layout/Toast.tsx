"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/toast-context";

const ADDED_SUFFIX = " ajouté au panier";

export function Toast() {
  const { action, dismiss, isVisible, message } = useToast();
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
          {action && <ToastActionButton action={action} onDone={dismiss} />}
        </div>
      )}
    </div>
  );
}

/** "Voir" or "Annuler" at the end of the pill. Underlined cream on the ink
 * pill — the one thing in it that can be pressed — and it closes the toast. */
function ToastActionButton({ action, onDone }: { action: { label: string; href?: string; onClick?: () => void }; onDone: () => void }) {
  const style: React.CSSProperties = {
    background: "none",
    border: 0,
    color: "var(--pdh-cream)",
    cursor: "pointer",
    flexShrink: 0,
    font: "inherit",
    fontWeight: 600,
    // Negative margins give the padding back: a 44px tap target without
    // making the pill taller or pushing the message aside.
    margin: "-12px -8px -12px 0",
    minHeight: 44,
    minWidth: 44,
    padding: "12px 8px",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    whiteSpace: "nowrap",
  };
  if (action.href) {
    return (
      <Link href={action.href} onClick={onDone} style={style}>
        {action.label}
      </Link>
    );
  }
  return (
    <button
      onClick={() => {
        action.onClick?.();
        onDone();
      }}
      style={style}
      type="button"
    >
      {action.label}
    </button>
  );
}
