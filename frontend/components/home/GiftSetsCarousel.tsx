"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useRef } from "react";
import { Rail, type RailHandle } from "@/components/Rail";
import { useToast } from "@/context/toast-context";
import { COFFRETS, COFFRETS_COPY } from "@/data/home";
import { money } from "@/data/products";

type Coffret = (typeof COFFRETS)[number];
type CoffretsCopy = typeof COFFRETS_COPY;

function CoffretCard({ c }: { c: Coffret }) {
  const toast = useToast();
  return (
    <button
      type="button"
      role="listitem"
      onClick={() => toast.fire(c.toast)}
      className="giftset-card tile-hover"
      style={{
        position: "relative",
        height: 320,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid rgba(94,64,116,.1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        textAlign: "start",
      }}
    >
      <CloudinaryImage preset="category" src={c.img} alt={c.title} fill sizes="380px" style={{ objectFit: "cover" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(55,48,32,0) 26%,rgba(55,48,32,.62) 58%,rgba(38,32,20,.9) 100%)" }} />
      <div style={{ position: "relative", zIndex: 3, padding: 26 }}>
        {c.tag && (
          <span style={{ display: "inline-block", background: "var(--pdh-cream)", color: "var(--pdh-plum)", fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", padding: "5px 11px", borderRadius: 999 }}>
            {c.tag}
          </span>
        )}
        <div style={{ fontFamily: "var(--font-alta)", fontWeight: 300, fontSize: 24, lineHeight: 1.15, margin: "12px 0 6px", maxWidth: 280, color: "var(--pdh-cream)", textShadow: "0 1px 12px rgba(30,24,14,.5)" }}>
          {c.title}
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(247,238,229,.82)", maxWidth: 280, lineHeight: 1.6 }}>{c.sub}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 16 }}>
          <span style={{ fontFamily: "var(--font-alta)", fontSize: 21, color: "var(--pdh-cream)", whiteSpace: "nowrap" }}>
            {c.priceFrom ? "Dès " : ""}
            {money(c.price)}
          </span>
          <span className="link-hover" style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pdh-cream)", borderBottom: "1px solid rgba(247,238,229,.5)", paddingBottom: 2, whiteSpace: "nowrap" }}>
            {c.ctaLabel} →
          </span>
        </div>
      </div>
    </button>
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
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
            {copy.eyebrow}
          </div>
          <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(25px,3.2vw,38px)", margin: "8px 0 0" }}>{copy.title}</h2>
          {copy.subtitle && <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>{copy.subtitle}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href={copy.ctaUrl || "/collections"}
            className="link-hover"
            style={{ flex: "none", whiteSpace: "nowrap", fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pdh-plum)", borderBottom: "1px solid rgba(94,64,116,.35)", paddingBottom: 3 }}
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
            <div key={c.title} style={i === 0 && items.length >= 3 ? { gridColumn: "span 2" } : undefined}>
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
