"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { money, type Product, productImage, stars } from "@/data/products";

/** One selectable option, as resolved server-side (lib/storefront/products).
 * `price` is already correct for the product's pricing mode, so this
 * component never computes a price from a contenance. */
export type PanelVariant = {
  /** The products_variants row id — the cart and the order line key on it. */
  id: string;
  optionValue: string;
  sku: string;
  price: number;
  old: number;
  stock: number;
  stockState: PurchaseStockState;
  /** This option's own photo, "" when it has none. */
  image: string;
};

function accordionsFor(product: Product) {
  return [
    {
      title: "Description complète",
      body: `${product.desc} Utilisation quotidienne, matin et soir, sur peau propre et sèche.`,
    },
    {
      title: "Ingrédients clés",
      body: "Eau thermale, glycérine, niacinamide, céramides, acide hyaluronique. Sans parfum, sans paraben, testé sous contrôle dermatologique.",
    },
    {
      title: "Livraison & retours",
      body: "Livraison 24h à Casablanca, 48h dans le reste du Maroc. Retour gratuit sous 7 jours si le produit n'a pas été ouvert.",
    },
  ];
}

export type PurchaseStockState = "ok" | "low" | "out";

/** `stock`/`stockState` come from the live Payload fetch on the product
 * page. Omitted by callers still on the static snapshot, which keeps the
 * previous "En stock" wording rather than inventing an availability. */
export function PurchasePanel({
  product,
  stock,
  stockState,
  variants = [],
  variantOptionLabel = "",
  sameVariantPrice = true,
  selectedVariantId = null,
  onSelectVariant,
}: {
  product: Product & { image?: string; sku?: string };
  stock?: number;
  stockState?: PurchaseStockState;
  /** Empty means this product has no options — no selector is rendered. */
  variants?: PanelVariant[];
  variantOptionLabel?: string;
  /** When true the price never changes as the option changes. */
  sameVariantPrice?: boolean;
  /** Controlled by ProductDetail, which shares it with the gallery so an
   * option carrying its own photograph can move the hero. */
  selectedVariantId?: string | null;
  onSelectVariant?: (id: string) => void;
}) {
  const cart = useCart();
  const toast = useToast();

  // Uncontrolled fallback, for a caller that renders the panel on its own.
  // Either way the selection is an id, never a list index: an index silently
  // points at a different option as soon as the array changes.
  const [ownSelection, setOwnSelection] = useState<string | null>(() => {
    if (variants.length === 0) return null;
    return (variants.find((v) => v.stockState !== "out") ?? variants[0]).id;
  });
  const activeId = onSelectVariant ? selectedVariantId : ownSelection;
  const selectVariant = onSelectVariant ?? setOwnSelection;

  const activeVariant = variants.find((v) => v.id === activeId) ?? null;

  // A variant's own stock wins when there is one; otherwise the product's.
  const effectiveStockState: PurchaseStockState | undefined = activeVariant ? activeVariant.stockState : stockState;
  const effectiveStock = activeVariant ? activeVariant.stock : stock;
  // In same-price mode this is always product.price by construction — the
  // resolver already collapsed it — so switching option cannot move it.
  const effectivePrice = activeVariant ? activeVariant.price : product.price;
  const effectiveOld = activeVariant ? activeVariant.old : product.old;
  const effectiveSku = activeVariant ? activeVariant.sku : product.sku || "";

  const isOutOfStock = effectiveStockState === "out";
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  // Roughly four lines at this measure. Below that the toggle would be
  // chrome around nothing.
  const isLongDesc = product.desc.length > 260;
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const mainCtaRef = useRef<HTMLButtonElement>(null);

  /** The exact configuration being bought, snapshotted for the cart line —
   * everything the cart, the checkout and the order need to say what was
   * ordered without re-reading a product that can change afterwards. */
  function currentLine() {
    return {
      brand: product.brand,
      image: activeVariant?.image || product.image || productImage(product.id),
      name: product.name,
      oldPrice: effectiveOld || 0,
      price: effectivePrice,
      productId: product.id,
      sku: effectiveSku,
      slug: product.slug,
      variantId: activeVariant?.id ?? null,
      variantLabel: activeVariant?.optionValue ?? "",
      variantType: activeVariant ? variantOptionLabel || "Option" : "",
    };
  }

  function handleAdd() {
    if (isOutOfStock) return;
    cart.add(currentLine(), qty);
    toast.fire(
      activeVariant
        ? `${product.name} — ${activeVariant.optionValue} ajouté au panier`
        : `${product.name} ajouté au panier`,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  function handleBuyNow() {
    if (isOutOfStock) return;
    cart.add(currentLine(), qty);
    cart.openCart();
  }

  // The sticky mobile bar appears only once the real "Ajouter au panier"
  // button has scrolled out of view — an IntersectionObserver on the actual
  // button, not a scroll-position guess, so it tracks the real CTA exactly.
  useEffect(() => {
    const el = mainCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sticky-atc-active", stickyVisible);
    return () => document.body.classList.remove("sticky-atc-active");
  }, [stickyVisible]);

  return (
    <>
    <div className="pdp-purchase-panel">
      <div style={{ fontFamily: "var(--font-poppins)", fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
        {product.brand}
      </div>
      <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(27px,3.8vw,44px)", lineHeight: 1.06, margin: "10px 0 12px" }}>
        {product.name}
      </h1>
      {product.reviews > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ color: "var(--pdh-teal-text)", letterSpacing: ".12em" }}>{stars(product.rating)}</span>
          <span style={{ fontSize: 12, color: "var(--pdh-muted-text)" }}>{product.reviews} avis</span>
        </div>
      )}
      {/* Clamped, not truncated. CMS descriptions run to a full monograph —
          this one is 1 100 characters of ingredients and directions — and
          printing it whole put the price, the option selector and the buy
          button a full screen below the fold: the shopper met the product and
          had to scroll to learn what it cost. The complete text is one tap
          away here and repeated in the "Description complète" accordion,
          so nothing is hidden, only deferred. */}
      <div style={{ margin: "0 0 22px", maxWidth: 820 }}>
        <p
          className={descExpanded ? undefined : "pdp-desc-clamp"}
          style={{ fontSize: 14.5, lineHeight: 1.8, color: "#57534a", margin: 0 }}
        >
          {product.desc}
        </p>
        {isLongDesc && (
          <button
            aria-expanded={descExpanded}
            onClick={() => setDescExpanded((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "var(--pdh-plum)",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: ".06em",
              marginTop: 8,
              padding: "4px 0",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
            type="button"
          >
            {descExpanded ? "Réduire" : "Lire la suite"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 22 }}>
        <span style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(25px,3.2vw,38px)", color: "var(--pdh-plum)" }}>{money(effectivePrice)}</span>
        {!!effectiveOld && <span style={{ fontSize: 16, opacity: 0.45, textDecoration: "line-through" }}>{money(effectiveOld)}</span>}
      </div>

      {/* Rendered only when the product genuinely has options. The previous
          version showed a hardcoded 30/50/100 ml selector on every product —
          including a toothbrush. */}
      {variants.length > 0 && (
        <fieldset style={{ border: "none", padding: 0, margin: "0 0 24px" }}>
          <legend style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 10, padding: 0 }}>
            {variantOptionLabel || "Option"}
          </legend>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {variants.map((variant) => {
              const isActive = activeId === variant.id;
              const soldOut = variant.stockState === "out";
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={isActive}
                  // Sold-out options stay visible AND selectable: a shopper
                  // is entitled to see what the 100 ml costs before deciding
                  // to wait for it. The buy button is what refuses, not this.
                  onClick={() => selectVariant(variant.id)}
                  title={soldOut ? "Rupture de stock" : undefined}
                  style={{
                    padding: "11px 20px",
                    borderRadius: 12,
                    fontSize: 13,
                    cursor: "pointer",
                    background: isActive ? "var(--pdh-plum)" : "#fff",
                    color: isActive ? "var(--pdh-cream)" : soldOut ? "#6f6a63" : "var(--pdh-ink)",
                    border: `1.5px solid ${isActive ? "var(--pdh-plum)" : "rgba(94,64,116,.22)"}`,
                    textDecoration: soldOut ? "line-through" : undefined,
                    transition: "all .25s",
                  }}
                >
                  {variant.optionValue}
                  {/* Only annotate the price per option when it actually
                      differs — repeating an identical price on every chip is
                      noise, and implies a difference that isn't there. */}
                  {!sameVariantPrice && (
                    <span style={{ marginLeft: 8, fontSize: 11.5, opacity: isActive ? 0.85 : 0.55 }}>
                      {money(variant.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* After the selector on purpose: with per-variant stock, "En stock"
          stated above the options is a claim about no particular thing a
          shopper can buy. */}
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: 20 }}>
        <span
          style={{
            alignItems: "center",
            color: effectiveStockState === "out" ? "var(--pdh-error)" : effectiveStockState === "low" ? "var(--pdh-warning)" : "#1F7A55",
            display: "flex",
            fontSize: 13,
            fontWeight: 500,
            gap: 7,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              background: "currentColor",
              borderRadius: "50%",
              flex: "none",
              height: 7,
              width: 7,
            }}
          />
          {effectiveStockState === "out"
            ? "Rupture de stock"
            : effectiveStockState === "low" && effectiveStock !== undefined
              ? `Plus que ${effectiveStock} en stock`
              : "En stock"}
        </span>
        {!!effectiveSku && (
          <span style={{ color: "var(--pdh-muted-text)", fontSize: 12 }}>
            SKU <span style={{ letterSpacing: ".04em" }}>{effectiveSku}</span>
          </span>
        )}
      </div>

      <div className="pdp-buy-row" style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid rgba(94,64,116,.25)", borderRadius: 999, padding: "2px 4px" }}>
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Diminuer la quantité"
            style={{ cursor: "pointer", color: "var(--pdh-plum)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44 }}
          >
            <Minus aria-hidden="true" size={16} />
          </button>
          <span style={{ fontSize: 15, minWidth: 18, textAlign: "center" }}>{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Augmenter la quantité"
            style={{ cursor: "pointer", color: "var(--pdh-plum)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44 }}
          >
            <Plus aria-hidden="true" size={16} />
          </button>
        </div>
        <button
          ref={mainCtaRef}
          type="button"
          onClick={handleAdd}
          className="btn-plum"
          disabled={justAdded || isOutOfStock}
          style={{ flex: 1, textAlign: "center", padding: 16, borderRadius: 999, fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", cursor: isOutOfStock ? "not-allowed" : "pointer", opacity: isOutOfStock ? 0.5 : 1 }}
        >
          {isOutOfStock ? "Indisponible" : justAdded ? "Ajouté ✓" : "Ajouter au panier"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleBuyNow}
        className="btn-outline-plum"
        disabled={isOutOfStock}
        style={{ width: "100%", textAlign: "center", padding: 15, borderRadius: 999, fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", cursor: isOutOfStock ? "not-allowed" : "pointer", opacity: isOutOfStock ? 0.5 : 1, marginBottom: 26 }}
      >
        Acheter maintenant
      </button>

      <div style={{ borderTop: "1px solid rgba(94,64,116,.15)" }}>
        {accordionsFor(product).map((a, i) => {
          const isOpen = openAccordion === i;
          return (
            <div key={a.title} style={{ borderBottom: "1px solid rgba(94,64,116,.15)" }}>
              <button
                type="button"
                onClick={() => setOpenAccordion(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: ".06em",
                  textAlign: "left",
                }}
              >
                {a.title}
                <Plus
                  aria-hidden="true"
                  size={18}
                  style={{ color: "var(--pdh-plum)", transition: "transform .3s", transform: `rotate(${isOpen ? 45 : 0}deg)`, flexShrink: 0 }}
                />
              </button>
              <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows .4s ease" }}>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 13, lineHeight: 1.75, opacity: 0.7, paddingBottom: 16 }}>{a.body}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div
      className="sticky-atc-bar"
      aria-hidden={!stickyVisible}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 95,
        background: "#fff",
        borderTop: "1px solid rgba(94,64,116,.15)",
        boxShadow: "0 -8px 24px -12px rgba(55,48,32,.25)",
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom,0px))",
        display: stickyVisible ? "flex" : "none",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flex: "none" }}>
        <span style={{ fontFamily: "var(--font-alta)", fontSize: 18, color: "var(--pdh-plum)" }}>{money(effectivePrice)}</span>
        {activeVariant ? (
          <span style={{ color: "var(--pdh-muted-text)", fontSize: 11 }}>{activeVariant.optionValue}</span>
        ) : (
          !!effectiveOld && <span style={{ color: "#6f6a63", fontSize: 11, textDecoration: "line-through" }}>{money(effectiveOld)}</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="btn-plum"
        disabled={justAdded || isOutOfStock}
        style={{ flex: 1, minHeight: 48, borderRadius: 999, fontSize: 12.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", cursor: isOutOfStock ? "not-allowed" : "pointer", opacity: isOutOfStock ? 0.5 : 1 }}
      >
        {isOutOfStock ? "Indisponible" : justAdded ? "Ajouté ✓" : "Ajouter au panier"}
      </button>
    </div>
    </>
  );
}
