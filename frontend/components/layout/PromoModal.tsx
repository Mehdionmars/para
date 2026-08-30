"use client";

import { Check, Clock, Copy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { useToast } from "@/context/toast-context";
import type { PromoModalContent } from "@/lib/storefront/siteChromeContent";

/** Keyed by code, so launching a new campaign shows the popup again to
 * everyone instead of staying dismissed forever behind the old one. */
const dismissKey = (code: string) => `pdh-promo-dismissed:${code}`;

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function PromoModal({ config }: { config: PromoModalContent }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Whatever had focus before the dialog stole it, so it can be handed back.
  const returnFocusRef = useRef<Element | null>(null);

  // Open once, after a delay, unless this code was already dismissed.
  useEffect(() => {
    if (!config.enabled) return;
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(dismissKey(config.code)) === "1";
    } catch {
      // Private mode or blocked storage: showing it once per page is a
      // better failure than never showing it at all.
    }
    if (dismissed) return;

    const id = setTimeout(() => setOpen(true), config.delaySeconds * 1000);
    return () => clearTimeout(id);
  }, [config.enabled, config.code, config.delaySeconds]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(dismissKey(config.code), "1");
    } catch {
      // Nothing to do — it will simply appear again next visit.
    }
    // Hand focus back where it was, or the dismissed dialog leaves the
    // keyboard at the top of the document with no idea what happened.
    const back = returnFocusRef.current;
    if (back instanceof HTMLElement) back.focus();
  }, [config.code]);

  // Focus management, Escape, and the focus trap.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      // Without this, Tab walks straight out of the dialog and into the page
      // behind it — which `aria-modal` tells a screen reader is unreachable.
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, close]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(config.code);
    } catch {
      // Insecure origins and older browsers have no clipboard API. The code
      // is on screen and selectable, so this is a downgrade, not a dead end.
      toast.fire(`Copiez le code : ${config.code}`);
      return;
    }
    setCopied(true);
    toast.fire(`Code ${config.code} copié`);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!config.enabled || !open) return null;

  return (
    <div className="promo-modal-root" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={panelRef}
        className="promo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-modal-title"
        aria-describedby={config.description ? "promo-modal-desc" : undefined}
      >
        <button ref={closeRef} type="button" onClick={close} aria-label="Fermer" className="promo-modal-close">
          <X aria-hidden="true" size={17} strokeWidth={2} />
        </button>

        {config.image && (
          <div className="promo-modal-media">
            <CloudinaryImage preset="editorial" src={config.image} alt="" fill sizes="520px" style={{ objectFit: "cover" }} />
          </div>
        )}

        <div className="promo-modal-body">
          {(config.badge || config.expiryLabel) && (
            <div className="promo-modal-meta">
              {config.badge && <span className="promo-modal-badge">{config.badge}</span>}
              {config.expiryLabel && (
                <span className="promo-modal-expiry">
                  <Clock aria-hidden="true" size={13} strokeWidth={1.8} />
                  {config.expiryLabel}
                </span>
              )}
            </div>
          )}

          <h2 id="promo-modal-title" className="promo-modal-title">
            {config.title}
            {config.subtitle && (
              <>
                <br />
                <strong className="promo-modal-title-accent">{config.subtitle}</strong>
              </>
            )}
          </h2>

          {config.description && (
            <p id="promo-modal-desc" className="promo-modal-desc">
              {config.description}
            </p>
          )}

          <div className="promo-modal-code-row">
            <span className="promo-modal-code">{config.code}</span>
            <button type="button" onClick={copyCode} className="promo-modal-copy">
              {copied ? <Check aria-hidden="true" size={15} strokeWidth={2} /> : <Copy aria-hidden="true" size={15} strokeWidth={1.8} />}
              {copied ? "Copié" : config.ctaLabel}
            </button>
          </div>

          {config.conditions.length > 0 && (
            <ul className="promo-modal-conditions">
              {config.conditions.map((c) => (
                <li key={c}>
                  <Check aria-hidden="true" size={14} strokeWidth={2} />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
