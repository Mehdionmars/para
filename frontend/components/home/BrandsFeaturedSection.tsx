"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useRef } from "react";
import { Rail, type RailHandle } from "@/components/Rail";
import type { BrandFeatured } from "@/data/home";
import { routes } from "@/lib/routes";

/** The single, consolidated "Marques à l'honneur" carousel — replaces what
 * used to be a one-off brand spotlight duplicated after individual rails. */
export function BrandsFeaturedSection({ brands }: { brands: BrandFeatured[] }) {
  const railRef = useRef<RailHandle>(null);
  if (brands.length === 0) return null;

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
            Nos partenaires
          </div>
          <h2 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(25px,3.2vw,38px)", margin: "8px 0 0", letterSpacing: "-.01em" }}>
            Marques à l&apos;honneur
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8, flex: "none" }}>
          <button type="button" onClick={() => railRef.current?.scrollPrev()} aria-label="Marques précédentes" className="circle-btn">
            <ChevronLeft aria-hidden="true" size={16} />
          </button>
          <button type="button" onClick={() => railRef.current?.scrollNext()} aria-label="Marques suivantes" className="circle-btn">
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <Rail ref={railRef} ariaLabel="Marques à l'honneur" cols={{ lg: 3, md: 2.4, sm: 1.35, xl: 4 }}>
        {brands.map((b, i) => (
          <div key={b.slug || b.name} role="listitem">
            <Link
              href={b.slug ? routes.brand(b.slug) : routes.brands()}
              className="tile-hover"
              style={{
                display: "block",
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgba(94,64,116,.12)",
                background: "#fff",
                animation: "rise .5s both",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--pdh-sand)" }}>
                {b.img && <CloudinaryImage preset="brand" src={b.img} alt={b.name} fill sizes="300px" style={{ objectFit: "cover" }} />}
              </div>
              <div style={{ padding: "18px 20px 22px" }}>
                <div style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: 22, letterSpacing: ".04em", color: "var(--pdh-plum)" }}>{b.name}</div>
                {b.phrase && <p style={{ fontSize: 12.5, lineHeight: 1.6, opacity: 0.68, margin: "8px 0 14px", minHeight: 40 }}>{b.phrase}</p>}
                <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>{b.ctaLabel} →</span>
              </div>
            </Link>
          </div>
        ))}
      </Rail>
    </section>
  );
}
