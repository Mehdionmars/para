"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Rail, type RailHandle } from "@/components/Rail";
import { CAMPAIGN_COPY, CAMPAIGN_PRODUCT_IDS } from "@/data/home";
import { IMG, getProduct, type Product } from "@/data/products";
import {
  type CardLayoutOptions,
  framingToObjectPosition,
  toCtaAlign,
} from "@/lib/storefront/cardLayout";
import type { LiveProduct } from "@/lib/storefront/products";

type CampaignCopy = typeof CAMPAIGN_COPY & CardLayoutOptions;

export function CampaignSection({
  copy: copyProp,
  products: productsProp,
}: { copy?: CampaignCopy; products?: (Product | LiveProduct)[] } = {}) {
  const railRef = useRef<RailHandle>(null);
  const products = productsProp ?? CAMPAIGN_PRODUCT_IDS.map((id) => getProduct(id));

  if (products.length === 0) return null;

  const copy: CampaignCopy = copyProp ?? CAMPAIGN_COPY;
  const image = copy.img || IMG.baby;
  const railTitle = copy.railTitle || "Les indispensables bébé";

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(18px,2.4vw,28px)", alignItems: "stretch" }}>
        <div className="campaign-tile" style={{ position: "relative", minHeight: 400, borderRadius: "clamp(16px,2vw,24px)", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
          <CloudinaryImage
            preset="marketing"
            src={image}
            alt={copy.title || "Campagne"}
            fill
            sizes="480px"
            style={{ objectFit: "cover", objectPosition: framingToObjectPosition(copy.imageFraming) }}
          />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(55,48,32,0) 34%,rgba(47,31,61,.72) 100%)" }} />
          <div className="overlay-card-content" style={{ position: "relative", zIndex: 3, padding: "clamp(22px,3vw,34px)", color: "var(--pdh-cream)" }}>
            {copy.eyebrow && (
              <div className="overlay-card-eyebrow" style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.85 }}>{copy.eyebrow}</div>
            )}
            <div className="overlay-card-title" style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.1, margin: "10px 0 8px", maxWidth: 340 }}>
              {copy.title}
            </div>
            {copy.description && (
              <p className="overlay-card-text" style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(247,238,229,.82)", margin: "0 0 18px", maxWidth: 360 }}>{copy.description}</p>
            )}
            <div className="overlay-card-actions" data-cta-align={toCtaAlign(copy.ctaAlign)}>
              <Link
                href={copy.ctaUrl || "/catalogue"}
                className="overlay-card-cta"
                style={{ display: "inline-block", background: "var(--pdh-cream)", color: "var(--pdh-ink)", padding: "13px 28px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}
              >
                {copy.ctaLabel || "Voir la sélection"}
              </Link>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
                La sélection
              </div>
              <h2 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(24px,2.8vw,32px)", margin: "8px 0 0" }}>{railTitle}</h2>
            </div>
            <div style={{ display: "flex", gap: 8, flex: "none" }}>
              <button type="button" onClick={() => railRef.current?.scrollPrev()} aria-label="Produits précédents" className="circle-btn">
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button type="button" onClick={() => railRef.current?.scrollNext()} aria-label="Produits suivants" className="circle-btn">
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <Rail ref={railRef} ariaLabel={railTitle} cols={{ lg: 2, md: 2, sm: 1.6, xl: 3 }}>
            {products.map((product, i) => (
              <div key={product.id} role="listitem">
                <ProductCard product={product} variant="campaign" delayMs={i * 50} />
              </div>
            ))}
          </Rail>
        </div>
      </div>
    </section>
  );
}
