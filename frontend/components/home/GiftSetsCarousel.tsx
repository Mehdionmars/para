"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useRef } from "react";
import { Rail, type RailHandle } from "@/components/Rail";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { COFFRETS, COFFRETS_COPY } from "@/data/home";
import { money } from "@/data/products";
import { routes } from "@/lib/routes";

type Coffret = (typeof COFFRETS)[number];
type CoffretsCopy = typeof COFFRETS_COPY;

/**
 * A coffret as a product tile: the picture, then the copy beneath it.
 *
 * The copy used to sit on a dark scrim over the photo, which hid the box it
 * was describing. The card now reads top to bottom — picture, name, line,
 * price and "Offrir" — and lifts slightly on hover.
 *
 * Two targets, never nested: the picture opens the coffret's page, "Offrir"
 * puts it in the cart. Both need a product behind the card (set in the
 * Storefront Builder); without one the picture is not a link and "Offrir"
 * falls back to the card's own CTA link, since there is nothing to sell.
 */
function CoffretCard({ c }: { c: Coffret }) {
  const cart = useCart();
  const toast = useToast();
  const product = c.product;
  const price = product ? product.price : c.price;
  const old = product && product.old > product.price ? product.old : 0;

  const picture = (
    <>
      <CloudinaryImage preset="category" src={c.img} alt="" fill sizes="(max-width: 767px) 80vw, 380px" style={{ objectFit: "cover" }} />
      {c.tag && <span className="giftset-card-tag">{c.tag}</span>}
    </>
  );

  function offer() {
    if (!product) return;
    cart.addProduct(product, 1);
    toast.fire(c.toast || `${c.title} ajouté au panier`, { label: "Voir le panier", onClick: cart.openCart });
  }

  return (
    <article className="giftset-card">
      {product ? (
        <Link href={routes.coffret(product.slug)} className="giftset-card-media" aria-label={c.title}>
          {picture}
        </Link>
      ) : (
        <div className="giftset-card-media">{picture}</div>
      )}
      <h3 className="giftset-card-title">{c.title}</h3>
      {c.sub && <p className="giftset-card-sub">{c.sub}</p>}
      <div className="giftset-card-foot">
        <span className="giftset-card-price">
          {c.priceFrom ? "Dès " : ""}
          {money(price)}
          {old > 0 && <s className="giftset-card-old">{money(old)}</s>}
        </span>
        {product ? (
          <button type="button" className="giftset-card-cta" onClick={offer}>
            {c.ctaLabel || "Offrir"}
          </button>
        ) : (
          <Link href={c.ctaUrl || "/catalogue"} className="giftset-card-cta">
            {c.ctaLabel || "Offrir"}
          </Link>
        )}
      </div>
    </article>
  );
}

/** "Coffrets & cadeaux" — a real carousel by default (a fixed-column grid
 * always leaves an orphan card on a non-multiple item count). The 'grid'
 * layout stays available from the CMS for a static page; there the first
 * card spans 2 columns so it reads as a lead item instead of 4 identical
 * tiles, and generalizes cleanly to any card count instead of an orphan row. */
export function GiftSetsCarousel({ coffrets, copy: copyProp }: { coffrets?: Coffret[]; copy?: CoffretsCopy } = {}) {
  const items = coffrets ?? COFFRETS;
  const copy = copyProp ?? COFFRETS_COPY;
  const railRef = useRef<RailHandle>(null);

  if (items.length === 0) return null;

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 className="sec-title">{copy.title}</h2>
          {copy.subtitle && <div className="sec-deck">{copy.subtitle}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href={copy.ctaUrl || "/collections"}
            className="link-hover"
            style={{ flex: "none", whiteSpace: "nowrap", fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pdh-plum)", borderBottom: "1px solid var(--pdh-plum-divider)", paddingBottom: 3 }}
          >
            {copy.ctaLabel || "Tous les coffrets"}
          </Link>
          {copy.layout !== "grid" && (
            <>
              <button type="button" onClick={() => railRef.current?.scrollPrev()} aria-label="Coffrets précédents" className="circle-btn">
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button type="button" onClick={() => railRef.current?.scrollNext()} aria-label="Coffrets suivants" className="circle-btn">
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {copy.layout === "grid" ? (
        <div
          role="list"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "clamp(12px,1.7vw,20px)" }}
        >
          {items.map((c, i) => (
            <div key={c.title} role="listitem" style={i === 0 && items.length >= 3 ? { gridColumn: "span 2" } : undefined}>
              <CoffretCard c={c} />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={
            {
              "--gs-desktop": copy.visibleDesktop || 3,
              "--gs-mobile": copy.visibleMobile || 1,
            } as React.CSSProperties
          }
        >
          <Rail ref={railRef} ariaLabel={copy.title}>
            {items.map((c) => (
              <div key={c.title} role="listitem" className="giftset-card-wrap">
                <CoffretCard c={c} />
              </div>
            ))}
          </Rail>
        </div>
      )}
    </section>
  );
}
