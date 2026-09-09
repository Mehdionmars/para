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
    // A full-bleed band rather than a section on the page ground. The offers
    // are the one part of this page that is allowed to raise its voice, and a
    // colour that runs edge to edge is what separates "the shop is having a
    // sale" from "here is another rail". Everything above and below stays on
    // white, so the band reads as an interruption and not as a new theme.
    //
    // The colour is one token (--promo-band). It defaults to the warm sand
    // this storefront already uses for panels; set it to a saturated yellow
    // in globals.css and you get the reference exactly.
    <section className="promo-band">
      <div className="promo-band-inner">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {/* The band's layout, the type system's roles. Two branches wrote
              this header: one centred it inside the colour, the other gave
              every section heading on the page one size, one leading and one
              colour. Taking the classes rather than the inline values it
              replaced is what keeps this heading in step with the eleven
              others — retyping them here is exactly how the twenty-two
              variants happened in the first place.

              `margin-inline: auto` because .sec-deck caps itself at 62ch, and
              a capped block in a centred column still needs to be told to
              centre. */}
          <h2 className="sec-title">{copy.title}</h2>
          {copy.subtitle && <div className="sec-deck" style={{ marginInline: "auto" }}>{copy.subtitle}</div>}
        </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
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
                // Underlined rather than a filled pill. On a coloured ground
                // a row of white pills becomes the loudest thing in the band
                // and competes with the products it is there to filter; a
                // rule under the active label says the same thing quietly.
                // The 44px min-height stays — it is the tap target, and it is
                // the reason this is padding rather than a bare border.
                className={isActive ? "promo-tab promo-tab--on" : "promo-tab"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  minHeight: 44,
                  padding: "9px 2px",
                  fontSize: 13.5,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? "var(--pdh-ink)" : "transparent"}`,
                  // --pdh-ink-soft rather than dimming ink with opacity. The
                  // typography pass replaced eleven ad-hoc opacity values with
                  // this one token precisely because two of them measured
                  // under 4.5:1; re-introducing a twelfth here, on a tinted
                  // ground where the maths is different again, is how that
                  // comes back.
                  color: isActive ? "var(--pdh-ink)" : "var(--pdh-ink-soft)",
                  transition: "color .2s ease, border-color .2s ease",
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
                    background: isActive ? "rgba(var(--pdh-ink-rgb), 0.10)" : "rgba(var(--pdh-ink-rgb), 0.06)",
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
            border: "1px solid var(--pdh-plum-border)",
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
      </div>
    </section>
  );
}
