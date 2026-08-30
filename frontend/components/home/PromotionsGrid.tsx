"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { PROMOTIONS_GRID } from "@/data/home";
import { PRODUCTS, productImage } from "@/data/products";
import type { LiveProduct } from "@/lib/storefront/products";

/** The snapshot shape, plus the fields the live CMS adds ahead of the next
 * `sync-cms`. `data/home.ts` is regenerated, so it cannot be widened there. */
type PromotionsGridCopy = typeof PROMOTIONS_GRID & { eyebrow?: string };

const ALL = "Tous";

/** A product whose only "photo" is the shared placeholder has none. */
function hasPhoto(id: number): boolean {
  return !productImage(id).includes("product-placeholder");
}

export function PromotionsGrid({
  copy: copyProp,
  products,
}: { copy?: PromotionsGridCopy; products?: LiveProduct[] } = {}) {
  const copy: PromotionsGridCopy = copyProp ?? PROMOTIONS_GRID;

  /**
   * Actual offers, and only actual offers.
   *
   * This block used to render `PRODUCTS.slice(0, 8)` — the first eight rows of
   * the static snapshot, with no discount test anywhere. Under a heading
   * reading "Profitez de nos meilleures offres" it was showing full-price new
   * arrivals badged "Nouveau", a claim the page could not back.
   *
   * The products now arrive resolved live from the CMS (see
   * `fetchDiscountedProducts`), like every rail on this page — so a price or a
   * stock edited in the admin is correct on the next request instead of at the
   * next `sync-cms` and redeploy. The snapshot stays as the offline fallback,
   * filtered and photo-sorted the same way the fetcher does.
   */
  const promos = useMemo(
    () =>
      products ??
      PRODUCTS.filter((p) => p.old > p.price).sort((a, b) => Number(hasPhoto(b.id)) - Number(hasPhoto(a.id))),
    [products],
  );

  /**
   * Filters built from what is actually discounted, not a hardcoded list.
   *
   * The four fixed tabs (Tous / Visage / Corps / Cheveux) were wrong in both
   * directions: they offered Corps and Cheveux when nothing in either is on
   * offer — a filter that empties the grid — and they had no Solaire, which is
   * the second-largest category in the shop and where most of the discounts
   * are. Counts are shown so a filter's result is legible before it is used.
   */
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of promos) counts.set(p.cat, (counts.get(p.cat) ?? 0) + 1);
    return [
      { label: ALL, count: promos.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
        .map(([label, count]) => ({ label, count })),
    ];
  }, [promos]);

  const [tab, setTab] = useState<string>(ALL);
  // The catalogue can change under a mounted component: a filter whose
  // category no longer has any offer falls back rather than showing nothing.
  const active = tabs.some((t) => t.label === tab) ? tab : ALL;

  const items = (active === ALL ? promos : promos.filter((p) => p.cat === active)).slice(0, copy.limit || 8);

  // Nothing on offer is a real state, and an empty "offers" section with a
  // row of filters is worse than no section at all.
  if (promos.length === 0) return null;

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
            {copy.eyebrow || "Promotions"}
          </div>
          <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(25px,3.2vw,38px)", margin: "8px 0 0" }}>{copy.title}</h2>
          {copy.subtitle && <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>{copy.subtitle}</div>}
        </div>
        {/* Toggle buttons in a labelled group, not role="tablist".
            The previous markup claimed tab semantics without a tabpanel,
            aria-controls or arrow-key navigation — a promise to assistive
            technology that the component did not keep. These are filters, and
            aria-pressed says exactly that. */}
        <div role="group" aria-label="Filtrer les offres par catégorie" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map(({ label, count }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={isActive}
                onClick={() => setTab(label)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 16px",
                  minHeight: 44,
                  borderRadius: 999,
                  fontSize: 12,
                  letterSpacing: ".06em",
                  cursor: "pointer",
                  background: isActive ? "var(--pdh-plum)" : "#fff",
                  color: isActive ? "var(--pdh-cream)" : "var(--pdh-ink)",
                  border: `1px solid ${isActive ? "var(--pdh-plum)" : "rgba(94,64,116,.22)"}`,
                  transition: "background .25s ease, color .25s ease, border-color .25s ease",
                }}
              >
                {label}
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 10.5,
                    fontVariantNumeric: "tabular-nums",
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: isActive ? "rgba(247,238,229,.22)" : "rgba(94,64,116,.09)",
                    color: "inherit",
                  }}
                >
                  {count}
                </span>
                {/* The badge is decorative; the count still reaches a screen
                    reader as part of the button's name. */}
                <span className="sr-only">
                  {count} {count > 1 ? "offres" : "offre"}
                </span>
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
