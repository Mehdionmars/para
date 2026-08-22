"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Rail, type RailHandle } from "@/components/Rail";
import { DERMO_CORNER_COPY, DERMO_PICKS } from "@/data/home";
import { getProduct, type Product } from "@/data/products";
import type { LiveProduct } from "@/lib/storefront/products";

type DermoPick = { product: Product | LiveProduct; actif: string; claim: string };
type DermoCornerCopy = typeof DERMO_CORNER_COPY;

const MAX_PICKS = 8;
const PICKS_PER_PAGE = 4;

/** Two separate sections, not one big card: a compact editorial image/text
 * band, then — visually set apart on a tinted background — the product
 * carousel with its own heading, arrows, dot pagination and a light
 * autoplay that pauses on hover. Matches the target layout: image+text is
 * an introduction, not a container for the products below it. */
export function DermoCorner({
  picks,
  copy: copyProp,
}: {
  picks?: DermoPick[];
  copy?: DermoCornerCopy;
} = {}) {
  const allItems: DermoPick[] = picks ?? DERMO_PICKS.map((p) => ({ product: getProduct(p.id), actif: p.actif, claim: p.claim }));
  const items = allItems.slice(0, MAX_PICKS);
  const copy = copyProp ?? DERMO_CORNER_COPY;

  const railRef = useRef<RailHandle>(null);
  const pausedRef = useRef(false);
  const dotCount = Math.max(1, Math.ceil(items.length / PICKS_PER_PAGE));
  const [activeDot, setActiveDot] = useState(0);

  const goToDot = (i: number) => {
    setActiveDot(i);
    railRef.current?.scrollToRatio(dotCount > 1 ? i / (dotCount - 1) : 0);
  };

  const autoplay = copy.autoplay !== false;
  const autoplaySpeedMs = copy.autoplaySpeedMs || 4500;

  useEffect(() => {
    if (!autoplay || items.length <= PICKS_PER_PAGE) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setActiveDot((d) => {
        const next = (d + 1) % dotCount;
        railRef.current?.scrollToRatio(dotCount > 1 ? next / (dotCount - 1) : 0);
        return next;
      });
    }, autoplaySpeedMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, autoplaySpeedMs, dotCount, items.length]);

  function handleScroll(el: HTMLDivElement) {
    const max = el.scrollWidth - el.clientWidth;
    const ratio = max > 0 ? el.scrollLeft / max : 0;
    setActiveDot(Math.round(ratio * (dotCount - 1)));
  }

  return (
    <>
      <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px) clamp(14px,2vw,20px)" }}>
        <div
          className="dermo-band"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px,38%) 1fr",
            gap: "clamp(28px,4vw,56px)",
            alignItems: "center",
          }}
        >
          <div className="dermo-image-zoom" style={{ position: "relative", height: "clamp(240px,30vw,420px)", borderRadius: 20, overflow: "hidden" }}>
            {copy.img && <CloudinaryImage preset="editorial" src={copy.img} alt="" fill sizes="(max-width: 768px) 100vw, 420px" style={{ objectFit: "cover" }} />}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
              {copy.eyebrow}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-jost)",
                fontWeight: 200,
                fontSize: "clamp(28px,3.6vw,42px)",
                lineHeight: 1.08,
                letterSpacing: "-.01em",
                margin: "14px 0 16px",
                maxWidth: 440,
                color: "var(--pdh-ink)",
              }}
            >
              {copy.title}
            </h2>
            {copy.subtitle && (
              <p style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.68, margin: "0 0 26px", maxWidth: 440 }}>{copy.subtitle}</p>
            )}
            <Link
              href={copy.ctaUrl || "/catalogue"}
              className="link-hover"
              style={{
                fontSize: 11.5,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--pdh-plum)",
                borderBottom: "1px solid rgba(94,64,116,.35)",
                paddingBottom: 3,
              }}
            >
              {copy.ctaLabel} →
            </Link>
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <section
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
          style={{
            maxWidth: "min(1280px,100%)",
            margin: "0 auto clamp(28px,3.6vw,48px)",
            padding: "clamp(24px,3vw,36px) clamp(14px,3.4vw,32px)",
            background: "var(--pdh-cream)",
            borderRadius: "clamp(16px,2vw,24px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "clamp(19px,2.2vw,24px)", margin: 0, color: "var(--pdh-ink)" }}>
                {copy.picksTitle}
              </h3>
              <div style={{ fontSize: 12.5, opacity: 0.6, marginTop: 4 }}>{items.length} produits sélectionnés par nos pharmaciens</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => railRef.current?.scrollPrev()} aria-label="Produits précédents" className="circle-btn">
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button type="button" onClick={() => railRef.current?.scrollNext()} aria-label="Produits suivants" className="circle-btn">
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <Rail ref={railRef} ariaLabel={copy.picksTitle} onScroll={handleScroll} cols={{ lg: 3, md: 2.4, sm: 1.8, xl: 3 }}>
            {items.map((pick) => (
              <div key={pick.product.id} role="listitem">
                <ProductCard product={pick.product} variant="dermo" dermo={{ actif: pick.actif, claim: pick.claim }} />
              </div>
            ))}
          </Rail>

          {dotCount > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
              {Array.from({ length: dotCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Aller à la page ${i + 1}`}
                  onClick={() => goToDot(i)}
                  style={{
                    width: i === activeDot ? 20 : 6,
                    height: 6,
                    borderRadius: 999,
                    border: "none",
                    padding: 0,
                    background: i === activeDot ? "var(--pdh-plum)" : "rgba(94,64,116,.25)",
                    transition: "width .25s ease, background .25s ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
