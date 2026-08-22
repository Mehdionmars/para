"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Rail, type RailHandle } from "@/components/Rail";
import { IMAGE_CAROUSEL_COPY, IMAGE_CAROUSEL_PRODUCT_IDS } from "@/data/home";
import { getProduct, type Product } from "@/data/products";
import type { LiveProduct } from "@/lib/storefront/products";

type ImageCarouselCopy = typeof IMAGE_CAROUSEL_COPY;

const MAX_PRODUCTS = 8;

/** Independent block, separate from Dermo Corner and "Nos coups de cœur":
 * one editorial image on the left with its own overlaid copy + CTA, a
 * product carousel on the right — the reusable "editorial + rail" template
 * so the same shape can carry a different curated moment each time it's
 * dropped onto the homepage. */
export function ImageCarousel({
  products: productsProp,
  copy: copyProp,
}: {
  products?: (Product | LiveProduct)[];
  copy?: ImageCarouselCopy;
} = {}) {
  const railRef = useRef<RailHandle>(null);
  const allProducts = productsProp ?? IMAGE_CAROUSEL_PRODUCT_IDS.map((id) => getProduct(id));
  const products = allProducts.slice(0, MAX_PRODUCTS);
  const copy = copyProp ?? IMAGE_CAROUSEL_COPY;

  if (products.length === 0 || !copy.img) return null;

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,38%) 1fr", gap: "clamp(18px,2.4vw,28px)", alignItems: "stretch" }} className="image-carousel-grid">
        <div style={{ position: "relative", minHeight: 360, borderRadius: "clamp(16px,2vw,24px)", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
          <CloudinaryImage preset="editorial" src={copy.img} alt={copy.title || "Sélection"} fill sizes="(max-width: 768px) 100vw, 480px" style={{ objectFit: "cover" }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(55,48,32,0) 34%,rgba(47,31,61,.72) 100%)" }} />
          <div style={{ position: "relative", zIndex: 3, padding: "clamp(22px,3vw,34px)", color: "var(--pdh-cream)" }}>
            {copy.eyebrow && (
              <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.85 }}>{copy.eyebrow}</div>
            )}
            <div style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.1, margin: "10px 0 8px", maxWidth: 340 }}>
              {copy.title}
            </div>
            {copy.subtitle && (
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(247,238,229,.82)", margin: "0 0 18px", maxWidth: 360 }}>{copy.subtitle}</p>
            )}
            <Link
              href={copy.ctaUrl || "/catalogue"}
              style={{ display: "inline-block", background: "var(--pdh-cream)", color: "var(--pdh-ink)", padding: "13px 28px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}
            >
              {copy.ctaLabel || "Voir la sélection"}
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <h3 style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "clamp(19px,2.2vw,24px)", margin: 0, color: "var(--pdh-ink)" }}>
              {copy.picksTitle || "Notre sélection"}
            </h3>
            <div style={{ display: "flex", gap: 8, flex: "none" }}>
              <button type="button" onClick={() => railRef.current?.scrollPrev()} aria-label="Produits précédents" className="circle-btn">
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button type="button" onClick={() => railRef.current?.scrollNext()} aria-label="Produits suivants" className="circle-btn">
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <Rail ref={railRef} ariaLabel={copy.picksTitle || copy.title || "Sélection"} cols={{ lg: 2, md: 2, sm: 1.6, xl: 3 }}>
            {products.map((product, i) => (
              <div key={product.id} role="listitem">
                <ProductCard product={product} variant="rail" delayMs={i * 50} />
              </div>
            ))}
          </Rail>
        </div>
      </div>
    </section>
  );
}
