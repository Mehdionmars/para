"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Rail, type RailHandle } from "@/components/Rail";
import type { RailDef } from "@/data/home";
import type { LiveProduct } from "@/lib/storefront/products";
import { hasOwnEditorialCopy, type RailEditorial, resolveRailEditorial } from "@/lib/storefront/railEditorial";

function EditorialBlock({ editorial }: { editorial: RailEditorial }) {
  // Every string here used to be written into the JSX below, which is why
  // two rails with an image printed the same paragraph twice. The rail
  // supplies them now; blanks fall back to what the JSX used to say.
  const copy = resolveRailEditorial(editorial);

  return (
    <section className="rail-editorial" style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
      <div
        style={{
          borderRadius: "clamp(16px,2vw,24px)",
          background: "var(--surface-card)",
          padding: "clamp(22px,3.6vw,40px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
          gap: "clamp(20px,2.8vw,40px)",
          alignItems: "center",
          boxShadow: "0 20px 40px -34px rgba(55,48,32,.5)",
        }}
      >
        <div style={{ aspectRatio: "1/1", borderRadius: 22, position: "relative", overflow: "hidden" }}>
          {/* The alt describes this rail's own block rather than a generic
              "Rituel Para d'Hiver", now that each one can say something
              different. */}
          <CloudinaryImage preset="editorial" src={copy.image} alt={copy.title} fill sizes="480px" style={{ objectFit: "cover" }} />
        </div>
        <div>
          <div className="overlay-card-eyebrow" style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
            {copy.eyebrow}
          </div>
          <h2 className="overlay-card-title" style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(27px,3.8vw,44px)", lineHeight: 1.05, margin: "12px 0 14px", letterSpacing: "-.02em" }}>
            {copy.title}
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.8, opacity: 0.72, margin: "0 0 24px", maxWidth: 820 }}>
            {copy.description}
          </p>
          <div className="overlay-card-actions">
            <Link href={copy.ctaUrl} className="btn-plum overlay-card-cta" style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}>
              {copy.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const BADGE_LABEL: Partial<Record<RailDef["badgeStyle"], string>> = {
  new: "Nouveau",
  team: "Sélection de l'équipe",
};

/** Each of the 4 default rails (essentiels/nouveautés/meilleures ventes/coups
 * de cœur) shares this exact component — no per-rail code duplication — but
 * gets a light editorial accent from its own `badgeStyle` so four rails in a
 * row don't read as four identical blocks. */
export function RailSection({ rail, products }: { rail: RailDef; products: LiveProduct[] }) {
  const railRef = useRef<RailHandle>(null);
  const badgeLabel = BADGE_LABEL[rail.badgeStyle];

  return (
    <>
      <section className="mobile-rail-section" style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
        <div className="mobile-section-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
                {rail.eyebrow}
              </div>
              {badgeLabel && (
                <span
                  style={{
                    fontFamily: "var(--font-poppins)",
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "var(--pdh-plum)",
                    background: "rgba(94,64,116,.1)",
                    padding: "3px 9px",
                    borderRadius: 999,
                  }}
                >
                  {badgeLabel}
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(25px,3.2vw,38px)", margin: "8px 0 0", letterSpacing: "-.01em" }}>
              {rail.title}
            </h2>
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6, maxWidth: 760 }}>{rail.subtitle}</div>
          </div>
          <div className="mobile-rail-actions" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link
              href={rail.ctaUrl || "/catalogue"}
              className="link-hover"
              style={{
                flex: "none",
                whiteSpace: "nowrap",
                fontSize: 11.5,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--pdh-plum)",
                borderBottom: "1px solid rgba(94,64,116,.35)",
                paddingBottom: 3,
              }}
            >
              {rail.ctaLabel || "Voir tout"}
            </Link>
            <button type="button" onClick={() => railRef.current?.scrollPrev()} aria-label="Produits précédents" className="circle-btn">
              <ChevronLeft aria-hidden="true" size={16} />
            </button>
            <button type="button" onClick={() => railRef.current?.scrollNext()} aria-label="Produits suivants" className="circle-btn">
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>

        <Rail ref={railRef} ariaLabel={rail.title}>
          {products.map((product, i) => (
            <div key={product.id} role="listitem" style={{ position: "relative" }}>
              {rail.badgeStyle === "rank" && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 10,
                    insetInlineStart: 10,
                    zIndex: 4,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--pdh-ink)",
                    color: "var(--pdh-cream)",
                    fontFamily: "var(--font-alta)",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </span>
              )}
              <ProductCard product={product} variant="rail" delayMs={i * 50} />
            </div>
          ))}
        </Rail>
      </section>

      {rail.editorial && hasOwnEditorialCopy(rail.editorial) && <EditorialBlock editorial={rail.editorial} />}
    </>
  );
}
