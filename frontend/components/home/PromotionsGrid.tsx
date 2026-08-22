"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { PROMOTIONS_GRID, TABS } from "@/data/home";
import { PRODUCTS } from "@/data/products";

type PromotionsGridCopy = typeof PROMOTIONS_GRID;

export function PromotionsGrid({ copy: copyProp }: { copy?: PromotionsGridCopy } = {}) {
  const copy = copyProp ?? PROMOTIONS_GRID;
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tous");

  const items = (tab === "Tous" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === tab)).slice(0, copy.limit || 8);

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
            Promotions
          </div>
          <h2 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(25px,3.2vw,38px)", margin: "8px 0 0" }}>{copy.title}</h2>
          {copy.subtitle && <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>{copy.subtitle}</div>}
        </div>
        <div role="tablist" aria-label="Filtrer les promotions par catégorie" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((label) => {
            const isActive = tab === label;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(label)}
                style={{
                  padding: "9px 18px",
                  minHeight: 44,
                  borderRadius: 999,
                  fontSize: 12,
                  letterSpacing: ".06em",
                  cursor: "pointer",
                  background: isActive ? "var(--pdh-plum)" : "#fff",
                  color: isActive ? "var(--pdh-cream)" : "var(--pdh-ink)",
                  border: `1px solid ${isActive ? "var(--pdh-plum)" : "rgba(94,64,116,.22)"}`,
                  transition: "all .25s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="list" className="promotions-grid">
        {items.map((product, i) => (
          <div key={product.id} role="listitem">
            <ProductCard product={product} variant="promo" delayMs={i * 50} />
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "clamp(18px,2.4vw,28px)" }}>
        <Link
          href="/shop/soldes"
          className="link-hover"
          style={{
            display: "inline-block",
            padding: "13px 28px",
            borderRadius: 999,
            border: "1px solid rgba(94,64,116,.28)",
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--pdh-plum)",
          }}
        >
          Voir toutes les offres
        </Link>
      </div>
    </section>
  );
}
