"use client";

import { Minus, Plus, X } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

export function CartDrawer() {
  const cart = useCart();
  const { isOpen, closeCart } = cart;

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  if (!cart.isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", justifyContent: "flex-end" }}>
      <button
        type="button"
        aria-label="Fermer le panier"
        onClick={cart.closeCart}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(47,31,61,.45)",
          backdropFilter: "blur(3px)",
          animation: "pop .3s both",
          cursor: "default",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Votre panier"
        style={{
          position: "relative",
          width: "min(432px,100%)",
          height: "100%",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-30px 0 60px -30px rgba(0,0,0,.5)",
          animation: "rise .35s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <div
          style={{
            padding: "24px 26px",
            borderBottom: "1px solid rgba(94,64,116,.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-jost)", fontSize: 24, fontWeight: 300, margin: 0 }}>
            Votre panier ({cart.count})
          </h2>
          <button
            type="button"
            onClick={cart.closeCart}
            aria-label="Fermer le panier"
            className="icon-btn"
            style={{ color: "var(--pdh-plum)" }}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {cart.lines.length > 0 && (
          <div style={{ padding: "0 26px", marginTop: 14 }}>
            <Link
              href="/panier"
              onClick={cart.closeCart}
              className="link-hover"
              style={{ fontSize: 12, letterSpacing: ".06em", color: "var(--pdh-plum)", borderBottom: "1px solid rgba(94,64,116,.35)", paddingBottom: 2 }}
            >
              Voir la page complète du panier →
            </Link>
          </div>
        )}

        <div style={{ padding: "16px 26px", background: "var(--pdh-sand)", borderBottom: "1px solid rgba(94,64,116,.1)" }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>{cart.freeShippingMessage}</div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(94,64,116,.15)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: "100%",
                transform: `scaleX(${cart.freeShippingProgress / 100})`,
                transformOrigin: "left",
                background: "linear-gradient(90deg,var(--pdh-plum),var(--pdh-teal))",
                transition: "transform .5s cubic-bezier(.22,1,.36,1)",
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 26px" }}>
          {cart.lines.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", opacity: 0.55 }}>
              <div style={{ fontFamily: "var(--font-jost)", fontSize: 22, fontWeight: 300, marginBottom: 8 }}>
                Votre panier est vide
              </div>
              <div style={{ fontSize: 13 }}>Ajoutez vos essentiels d&apos;hiver.</div>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {cart.lines.map((line) => {
                // The line's own snapshot, like the cart page: the drawer has
                // to name the option that was bought, not the product in the
                // abstract.
                return (
                  <li
                    key={line.key}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "18px 0",
                      borderBottom: "1px solid rgba(94,64,116,.1)",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        width: 72,
                        height: 80,
                        borderRadius: 12,
                        background: "#fff",
                        flex: "none",
                      }}
                    >
                      <CloudinaryImage preset="thumb" src={line.image} alt={line.name} fill sizes="72px" style={{ objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
                        {line.brand}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3, lineHeight: 1.35 }}>{line.name}</div>
                      {!!line.variantLabel && (
                        <div style={{ color: "#6a7178", fontSize: 11.5, marginTop: 3 }}>
                          {line.variantType || "Option"} :{" "}
                          <span style={{ color: "var(--pdh-ink)", fontWeight: 500 }}>{line.variantLabel}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            border: "1px solid rgba(94,64,116,.22)",
                            borderRadius: 999,
                            padding: "5px 12px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => cart.decrement(line.key)}
                            aria-label={`Retirer un ${line.name}`}
                            style={{ cursor: "pointer", color: "var(--pdh-plum)", display: "flex" }}
                          >
                            <Minus aria-hidden="true" size={13} />
                          </button>
                          <span style={{ fontSize: 12.5 }}>{line.qty}</span>
                          <button
                            type="button"
                            onClick={() => cart.increment(line.key)}
                            aria-label={`Ajouter un ${line.name}`}
                            style={{ cursor: "pointer", color: "var(--pdh-plum)", display: "flex" }}
                          >
                            <Plus aria-hidden="true" size={13} />
                          </button>
                        </div>
                        <span style={{ fontFamily: "var(--font-jost)", fontSize: 17, color: "var(--pdh-plum)" }}>
                          {cart.money(line.price * line.qty)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(line.key)}
                      aria-label={
                        line.variantLabel
                          ? `Retirer ${line.name} (${line.variantLabel}) du panier`
                          : `Retirer ${line.name} du panier`
                      }
                      className="icon-btn"
                      style={{ opacity: 0.4 }}
                    >
                      <X aria-hidden="true" size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div style={{ padding: "22px 26px", borderTop: "1px solid rgba(94,64,116,.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
            <span>Sous-total</span>
            <span>{cart.money(cart.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
            <span>Livraison</span>
            <span>{cart.shipping ? cart.money(cart.shipping) : "Offerte"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Total</span>
            <span style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(22px,2.6vw,30px)", color: "var(--pdh-plum)" }}>
              {cart.money(cart.total)}
            </span>
          </div>
          <Link
            href="/panier"
            onClick={cart.lines.length === 0 ? undefined : cart.closeCart}
            aria-disabled={cart.lines.length === 0}
            className="btn-plum"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: 16,
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              pointerEvents: cart.lines.length === 0 ? "none" : "auto",
              cursor: cart.lines.length === 0 ? "not-allowed" : "pointer",
              opacity: cart.lines.length === 0 ? 0.5 : 1,
            }}
          >
            Passer la commande
          </Link>
        </div>
      </div>
    </div>
  );
}
