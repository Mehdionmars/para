"use client";

import { CheckCircle2, Copy, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ShippingOption } from "@/app/api/shipping-rules/route";
import { CheckoutField } from "@/components/cart/CheckoutField";
import { CouponField, type AppliedCoupon } from "@/components/cart/CouponField";
import { PaymentBadges } from "@/components/layout/PaymentBadges";
import { useCart } from "@/context/cart-context";
import { routes } from "@/lib/routes";

type Step = "cart" | "form" | "success";

export function CartView() {
  const cart = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  // The cart signature the coupon was priced against is stored with it, so a
  // stale discount is discarded during render rather than by an effect that
  // would briefly paint the wrong total first.
  const [couponState, setCouponState] = useState<(AppliedCoupon & { linesKey: string }) | null>(null);
  const [shippingRules, setShippingRules] = useState<ShippingOption[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  // Per-field messages, so an error names the field it belongs to instead of
  // leaving the shopper to guess which of four inputs is wrong.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusErrors, setFocusErrors] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shipping-rules")
      .then((r) => r.json())
      .then((d: { rules?: ShippingOption[] }) => {
        if (cancelled) return;
        const rules = d.rules || [];
        setShippingRules(rules);
        // Preselect the default city so the displayed total is never blank,
        // and matches what checkout would charge if the shopper never picks.
        setCity((current) => current || rules.find((r) => r.isDefault)?.city || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Moves focus to the first field in error once it is actually rendered. A
  // message the shopper has scrolled past announces nothing and fixes
  // nothing; this is a DOM side effect, not derived state.
  useEffect(() => {
    if (!focusErrors) return;
    const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.focus();
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    const done = window.setTimeout(() => setFocusErrors(false), 0);
    return () => window.clearTimeout(done);
  }, [focusErrors, fieldErrors]);

  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  // Clipboard access is refused outside a secure context and can be declined:
  // the number stays on screen either way, so a failure needs no error state.
  async function handleCopyOrderNumber() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopiedOrderNumber(true);
      window.setTimeout(() => setCopiedOrderNumber(false), 2000);
    } catch {
      /* left visible for the shopper to copy by hand */
    }
  }

  // Pads the page for the fixed mobile total bar, the same way the product
  // page does for its own (`sticky-atc-active`). Without it the bar sits over
  // the last cart line and the footer links underneath it.
  const showStickyTotal = step === "cart" && cart.lines.length > 0;
  useEffect(() => {
    document.body.classList.toggle("sticky-cart-active", showStickyTotal);
    return () => document.body.classList.remove("sticky-cart-active");
  }, [showStickyTotal]);

  const linesKey = cart.lines.map((l) => `${l.key}x${l.qty}`).join(",");
  // A coupon priced against an older cart is dropped: changing the lines can
  // change the discount, and showing the previous one would misquote the
  // total. The shopper reapplies it.
  const coupon = couponState?.linesKey === linesKey ? couponState : null;

  // These mirror the server's arithmetic so the shopper sees the same numbers
  // before submitting. They are never sent: /api/checkout recomputes all of it
  // from the database and ignores any amount in the request body.
  const discount = coupon ? Math.min(coupon.discount, cart.subtotal) : 0;
  const afterDiscount = Math.max(0, cart.subtotal - discount);
  const activeRule = shippingRules.find((r) => r.city === city);
  const shipping = activeRule
    ? activeRule.freeFrom !== null && afterDiscount >= activeRule.freeFrom
      ? 0
      : activeRule.price
    : cart.shipping;
  const total = afterDiscount + shipping;

  /** Mirrors the server's own requirements (name + email are mandatory there
   * too). Client-side only to give an immediate, field-level message — the
   * checkout route validates again and remains the authority. */
  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Indiquez votre nom complet.";
    if (!email.trim()) next.email = "Indiquez votre adresse email.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = "Cette adresse email semble incorrecte.";
    if (!address.trim()) next.address = "Indiquez votre adresse de livraison.";
    return next;
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError("");
      // Flagged for the effect below rather than focused here: the DOM still
      // holds the previous render at this point, so no field carries
      // aria-invalid yet and the query would find nothing.
      setFocusErrors(true);
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/checkout", {
        body: JSON.stringify({
          address,
          city,
          couponCode: coupon?.code,
          email,
          // ids and quantities only: the server prices the order from the
          // database and ignores anything an amount-shaped field might carry.
          lines: cart.checkoutLines(),
          name,
          phone,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de créer la commande.");
      setOrderNumber(data.orderNumber);
      cart.clear();
      setStep("success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cart-mobile-page" style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, letterSpacing: ".02em", marginBottom: 16 }}>
        <Link href="/" className="link-hover" style={{ color: "inherit", opacity: 0.55 }}>
          Accueil
        </Link>{" "}
        <span style={{ opacity: 0.4 }}>/</span> <span style={{ fontWeight: 600 }}>Panier</span>
      </nav>

      <h1 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(28px,3.8vw,44px)", margin: "0 0 clamp(24px,3vw,36px)" }}>
        {step === "success" ? "Commande confirmée" : `Votre panier${cart.lines.length > 0 ? ` (${cart.count})` : ""}`}
      </h1>

      {step === "success" ? (
        <div
          style={{
            textAlign: "center",
            padding: "clamp(60px,8vw,100px) 20px",
            borderRadius: "clamp(16px,2vw,24px)",
            background: "var(--pdh-sand)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(0,138,165,.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--pdh-teal)",
              margin: "0 auto 18px",
            }}
          >
            <CheckCircle2 aria-hidden="true" size={26} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(20px,2.4vw,26px)", fontWeight: 300, marginBottom: 8 }}>
            Merci, {name} !
          </div>
          <p style={{ fontSize: 13.5, opacity: 0.7, maxWidth: 420, margin: "0 auto 6px", lineHeight: 1.7 }}>
            Votre commande a bien été enregistrée. Nous vous contactons rapidement au{" "}
            {phone || email} pour confirmer la livraison.
          </p>

          {/* The order number is the one string the shopper has to keep — it is
              what /suivi-commande asks for — and on a phone a run of text inside
              a paragraph is fiddly to select. */}
          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className="order-number-copy"
            aria-label={`Copier le numéro de commande ${orderNumber}`}
          >
            <span>{orderNumber}</span>
            {copiedOrderNumber ? <CheckCircle2 aria-hidden="true" size={15} strokeWidth={1.8} /> : <Copy aria-hidden="true" size={15} strokeWidth={1.8} />}
          </button>
          <div aria-live="polite" style={{ fontSize: 12, color: "var(--pdh-teal)", minHeight: 18, marginTop: 6 }}>
            {copiedOrderNumber ? "Numéro copié" : ""}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 18 }}>
            <Link
              href="/catalogue"
              className="btn-plum"
              style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
            >
              Continuer mes achats
            </Link>
            <Link
              href="/suivi-commande"
              className="btn-outline-plum"
              style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
            >
              Suivre ma commande
            </Link>
          </div>
        </div>
      ) : cart.lines.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "clamp(60px,8vw,100px) 20px",
            borderRadius: "clamp(16px,2vw,24px)",
            background: "var(--pdh-sand)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(94,64,116,.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--pdh-plum)",
              margin: "0 auto 18px",
            }}
          >
            <ShoppingBag aria-hidden="true" size={22} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(20px,2.4vw,26px)", fontWeight: 300, marginBottom: 8 }}>
            Votre panier est vide
          </div>
          <p style={{ fontSize: 13.5, opacity: 0.6, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Ajoutez vos essentiels d&apos;hiver depuis le catalogue.
          </p>
          <Link
            href="/catalogue"
            className="btn-plum"
            style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
          >
            Voir le catalogue
          </Link>
        </div>
      ) : (
        <div className="cart-mobile-layout" style={{ display: "flex", gap: "clamp(20px,3vw,40px)", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "999 1 420px", minWidth: 0 }}>
            <div style={{ padding: "16px 20px", background: "var(--pdh-sand)", borderRadius: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, marginBottom: 8 }}>{cart.freeShippingMessage}</div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(94,64,116,.15)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${cart.freeShippingProgress}%`,
                    background: "linear-gradient(90deg,var(--pdh-plum),var(--pdh-teal))",
                    transition: "width .5s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </div>
            </div>

            <ul className="cart-line-list" style={{ listStyle: "none", margin: 0, padding: 0, border: "1px solid rgba(94,64,116,.12)", borderRadius: 18, overflow: "hidden" }}>
              {cart.lines.map((line, i) => {
                // Everything below is the line's own snapshot, taken when it
                // was added. Reading it back out of the catalogue is what let
                // a cart show today's price for yesterday's decision — and
                // made it impossible to say which option had been chosen.
                return (
                  <li
                    className="cart-line-item"
                    key={line.key}
                    style={{
                      display: "flex",
                      gap: 18,
                      padding: "20px 22px",
                      borderBottom: i === cart.lines.length - 1 ? "none" : "1px solid rgba(94,64,116,.1)",
                    }}
                  >
                    <Link
                      className="cart-line-image"
                      href={routes.product(line.slug)}
                      style={{ position: "relative", overflow: "hidden", width: 92, height: 100, borderRadius: 14, background: "#fff", flex: "none" }}
                    >
                      <CloudinaryImage preset="thumb" src={line.image} alt={line.name} fill sizes="92px" style={{ objectFit: "contain" }} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
                        {line.brand}
                      </div>
                      <Link
                        href={routes.product(line.slug)}
                        style={{ display: "block", width: "fit-content", maxWidth: "100%", fontSize: 14.5, fontWeight: 500, marginTop: 4, lineHeight: 1.4, color: "inherit" }}
                      >
                        {line.name}
                      </Link>
                      {!!line.variantLabel && (
                        <div style={{ color: "var(--pdh-ink)", fontSize: 12.5, marginTop: 5 }}>
                          <span style={{ color: "#6a7178" }}>{line.variantType || "Option"} : </span>
                          <span style={{ fontWeight: 500 }}>{line.variantLabel}</span>
                        </div>
                      )}
                      {!!line.sku && <div style={{ color: "#6a7178", fontSize: 11.5, marginTop: 2 }}>SKU {line.sku}</div>}
                      <div style={{ color: "#6a7178", fontSize: 11.5, marginTop: 4 }}>
                        {cart.money(line.price)} l&apos;unité
                      </div>
                      <div className="cart-line-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 12 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            border: "1px solid rgba(94,64,116,.22)",
                            borderRadius: 999,
                            padding: "6px 14px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => cart.decrement(line.key)}
                            aria-label={`Retirer un ${line.name}`}
                            className="qty-step-btn"
                            style={{ cursor: "pointer", color: "var(--pdh-plum)", display: "flex" }}
                          >
                            <Minus aria-hidden="true" size={14} />
                          </button>
                          <span style={{ fontSize: 13.5, minWidth: 14, textAlign: "center" }}>{line.qty}</span>
                          <button
                            type="button"
                            onClick={() => cart.increment(line.key)}
                            aria-label={`Ajouter un ${line.name}`}
                            className="qty-step-btn"
                            style={{ cursor: "pointer", color: "var(--pdh-plum)", display: "flex" }}
                          >
                            <Plus aria-hidden="true" size={14} />
                          </button>
                        </div>
                        <span style={{ fontFamily: "var(--font-jost)", fontSize: 19, color: "var(--pdh-plum)", whiteSpace: "nowrap" }}>
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
                      style={{ opacity: 0.4, flex: "none" }}
                    >
                      <X aria-hidden="true" size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <Link href="/catalogue" className="link-hover" style={{ display: "inline-block", marginTop: 20, fontSize: 12.5, letterSpacing: ".08em", color: "var(--pdh-plum)" }}>
              ← Continuer mes achats
            </Link>
          </div>

          <div
            className="cart-summary-panel"
            style={{
              flex: "1 1 300px",
              minWidth: 280,
              maxWidth: 380,
              position: "sticky",
              top: 100,
              border: "1px solid rgba(94,64,116,.12)",
              borderRadius: 18,
              padding: "clamp(20px,2.4vw,28px)",
              background: "#fff",
            }}
          >
            {/* Two segments, not a numbered wizard: there are exactly two
                screens before the confirmation, and saying so is what stops
                "Passer la commande" reading like the button that charges you. */}
            <ol className="cart-steps" aria-label="Étapes de la commande">
              {(["cart", "form"] as const).map((s, i) => (
                <li
                  key={s}
                  aria-current={step === s ? "step" : undefined}
                  data-state={step === s ? "current" : i === 0 ? "done" : "todo"}
                >
                  <span className="cart-step-dot">{i + 1}</span>
                  <span className="cart-step-label">{s === "cart" ? "Panier" : "Livraison"}</span>
                </li>
              ))}
            </ol>

            <h2 style={{ fontFamily: "var(--font-jost)", fontSize: 18, fontWeight: 500, margin: "0 0 18px" }}>
              {step === "form" ? "Vos coordonnées" : "Récapitulatif"}
            </h2>

            {step === "cart" && (
              <>
                {/* Split so the phone can pin the total and the CTA on their
                    own. The whole panel used to be the sticky sheet, which put
                    439px — coupon field, breakdown and payment badges
                    included — over a 844px screen and buried the cart lines
                    behind it. Everything below scrolls; only .cart-summary-action
                    stays on screen. Desktop ignores both wrappers. */}
                <div className="cart-summary-details">
                <CouponField
                  applied={coupon}
                  city={city}
                  email={email || undefined}
                  lines={cart.checkoutLines()}
                  onApply={(c) => setCouponState({ ...c, linesKey })}
                  onRemove={() => setCouponState(null)}
                />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
                  <span>Sous-total</span>
                  <span>{cart.money(cart.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 8,
                      color: "#1F8A5C",
                      fontWeight: 500,
                    }}
                  >
                    <span>Réduction {coupon ? `(${coupon.code})` : ""}</span>
                    <span>−{cart.money(discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 14 }}>
                  <span>Livraison{activeRule ? ` · ${activeRule.city}` : ""}</span>
                  <span>{shipping ? cart.money(shipping) : "Offerte"}</span>
                </div>
                </div>

                <div className="cart-summary-action">
                <div
                  className="cart-summary-total"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 20,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(94,64,116,.12)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Total</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(24px,2.8vw,30px)", color: "var(--pdh-plum)" }}>
                    {cart.money(total)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="btn-plum"
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: 16,
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Passer la commande
                </button>
                </div>

                <div className="cart-summary-reassurance" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(94,64,116,.12)" }}>
                  <PaymentBadges />
                </div>
              </>
            )}

            {step === "form" && (
              <form
                onSubmit={handleSubmitOrder}
                // noValidate: the browser's own bubble fires first and would
                // stop our handler, so the fields would never get aria-invalid
                // or a persistent, styled message. `required` stays on each
                // input for semantics — it is still announced as mandatory.
                noValidate
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <CheckoutField
                  label="Nom complet"
                  value={name}
                  onChange={setName}
                  error={fieldErrors.name}
                  autoComplete="name"
                  required
                />
                <CheckoutField
                  label="Adresse email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                  autoComplete="email"
                  hint="Pour suivre votre commande."
                  required
                />
                <CheckoutField
                  label="Téléphone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  error={fieldErrors.phone}
                  autoComplete="tel"
                  hint="Le livreur vous appellera à ce numéro."
                />
                {shippingRules.length > 0 && (
                  <div>
                    <label
                      htmlFor="checkout-city"
                      style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 5, opacity: 0.8 }}
                    >
                      Ville de livraison
                    </label>
                    <select
                      id="checkout-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="field-input"
                      style={{ width: "100%", height: 44, borderRadius: 10, padding: "0 10px", fontSize: 13.5, cursor: "pointer" }}
                    >
                      {shippingRules.map((r) => (
                        <option key={r.city} value={r.city}>
                          {r.city} — {r.price === 0 ? "offerte" : cart.money(r.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <CheckoutField
                  label="Adresse de livraison"
                  value={address}
                  onChange={setAddress}
                  error={fieldErrors.address}
                  autoComplete="street-address"
                  multiline
                  required
                />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, opacity: 0.7, marginTop: 4 }}>
                  <span>Sous-total</span>
                  <span>{cart.money(cart.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#1F8A5C", fontWeight: 500 }}>
                    <span>Réduction {coupon ? `(${coupon.code})` : ""}</span>
                    <span>−{cart.money(discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, opacity: 0.7 }}>
                  <span>Livraison</span>
                  <span>{shipping ? cart.money(shipping) : "Offerte"}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    paddingTop: 10,
                    borderTop: "1px solid rgba(94,64,116,.12)",
                  }}
                >
                  <span style={{ fontSize: 12.5, opacity: 0.7 }}>Total à payer à la livraison</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: 20, color: "var(--pdh-plum)" }}>
                    {cart.money(total)}
                  </span>
                </div>

                {formError && (
                  // role="alert" so a screen reader announces the failure
                  // instead of it being silently painted below the button.
                  <p role="alert" style={{ fontSize: 12.5, color: "#9A3B3B", margin: 0 }}>
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-plum"
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: 16,
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Envoi en cours…" : "Confirmer la commande"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="link-hover"
                  style={{ fontSize: 12, color: "var(--pdh-plum)", textAlign: "center" }}
                >
                  ← Retour au panier
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
