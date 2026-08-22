"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/skeleton";
import { routes } from "@/lib/routes";
import { SEO_LINK_GROUPS } from "@/data/catalogue";
import { FREE_SHIPPING_THRESHOLD } from "@/data/home";
import type { Category } from "@/data/products";
import type { CatalogueFacets, CatalogueProduct, StorefrontBrand } from "@/lib/storefront/catalogue";
import { BrandsRail, CatalogueHero, EditorialPair, ReassuranceStrip, ServiceStrip } from "./CatalogueSections";
import { Filters } from "./Filters";
import { FiltersDrawer } from "./FiltersDrawer";
import { RitualSelector } from "./RitualSelector";
import { UniverseCarousel } from "./UniverseCarousel";

const CATEGORY_VALUES: Category[] = [
  "Visage",
  "Corps",
  "Cheveux",
  "Solaire",
  "Baby & Mom",
  "Maquillage",
  "Bucco-Dentaire",
  "Compléments alimentaires",
  "Hygiène",
];

const SORT_OPTIONS: { value: "pertinence" | "price-asc" | "price-desc" | "newest"; label: string }[] = [
  { label: "Pertinence", value: "pertinence" },
  { label: "Prix croissant", value: "price-asc" },
  { label: "Prix décroissant", value: "price-desc" },
  { label: "Nouveautés", value: "newest" },
];

const EMPTY_FACETS: CatalogueFacets = { brands: [], categories: [], inStockCount: 0, totalCount: 0 };
const PAGE_SIZE = 24;

export function CatalogueView({
  initialQuery,
  initialCategory = "",
  initialTag = "",
  initialBrand = "",
  initialQuick = "",
  pageTitle,
  pageIntro,
  breadcrumbExtra,
  brands = [],
  editorial = false,
}: {
  initialQuery: string;
  initialCategory?: string;
  initialTag?: string;
  /** Real brand name (not slug) — resolved server-side from the URL's brand slug. */
  initialBrand?: string;
  /** One of QUICK_FILTERS' own values — lets /shop/soldes and /shop/nouveautes
   * land pre-filtered without duplicating the filter logic itself. */
  initialQuick?: string;
  pageTitle?: string;
  pageIntro?: string;
  /** An extra breadcrumb crumb between "Accueil" and the current page, e.g.
   * {label: "Marques", href: "/marques"} on a brand page. */
  breadcrumbExtra?: BreadcrumbItem;
  /**
   * The brand list for the partners rail, resolved on the server by the page
   * that turns `editorial` on. Passed down rather than fetched here: this is
   * a client component, and a second round trip from the browser for data the
   * server already had would be pure waste.
   */
  brands?: StorefrontBrand[];
  /**
   * Renders the full editorial catalogue: hero, universe carousel, the two
   * banners, brands and services. Only /catalogue and /shop turn this on — a
   * brand or category landing is already a filtered view, and repeating
   * "Explorer nos univers" there would send the visitor back out of the very
   * aisle they just chose.
   */
  editorial?: boolean;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  const [activeCategories, setActiveCategories] = useState<Set<Category>>(() => {
    const match = CATEGORY_VALUES.find((c) => c.toLowerCase() === initialCategory.toLowerCase());
    return match ? new Set([match]) : new Set();
  });
  // A /shop/[slug] category that's a real Payload Category (has a nav entry,
  // a real slug, an actual landing page) but that no product is tagged with
  // yet — Products.category is a fixed 5-value enum, narrower than the full
  // nav taxonomy. Rather than silently show the whole catalogue (wrong) or
  // invent matching products (forbidden), this renders an honest "no
  // products yet" state under the category's real name.
  const [forcedEmptyCategoryLabel] = useState<string>(() => {
    if (!initialCategory) return "";
    const match = CATEGORY_VALUES.find((c) => c.toLowerCase() === initialCategory.toLowerCase());
    return match ? "" : initialCategory;
  });
  const [brand, setBrand] = useState(initialBrand);
  const [maxPrice, setMaxPrice] = useState(399);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("pertinence");
  const [tag, setTagState] = useState(initialTag);
  const [quick, setQuick] = useState(initialQuick);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<CatalogueFacets>(EMPTY_FACETS);
  // No real product carries a forced-empty category yet — starts already
  // "not loading" with the (already-correct, already-empty) initial state
  // above, rather than firing a fetch that would just come back empty for
  // the wrong reason.
  const [loading, setLoading] = useState(!forcedEmptyCategoryLabel);

  useEffect(() => {
    if (forcedEmptyCategoryLabel) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (initialQuery) params.set("q", initialQuery);
    activeCategories.forEach((c) => params.append("cat", c));
    if (brand) params.set("brand", brand);
    if (tag) params.set("tag", tag);
    if (quick) params.set("quick", quick);
    if (maxPrice < 399) params.set("maxPrice", String(maxPrice));
    if (inStockOnly) params.set("avail", "inStock");
    params.set("sort", sort);
    params.set("limit", String(limit));

    // Written as one async body rather than a .then/.catch/.finally chain
    // because of the last link: `finally` ran even for a request that had just
    // been aborted, so switching filters quickly turned `loading` off while
    // the replacement request was still in flight — the grid stopped being
    // dimmed and "Charger plus" re-enabled mid-fetch. An aborted request now
    // returns without touching any state; only the live one reports back.
    (async () => {
      try {
        const res = await fetch(`/api/catalogue?${params.toString()}`, { signal: controller.signal });
        const data = (await res.json()) as { products: CatalogueProduct[]; total: number; facets: CatalogueFacets };
        if (controller.signal.aborted) return;
        setProducts(data.products);
        setTotal(data.total);
        setFacets(data.facets);
      } catch {
        // The only expected rejection here is the abort fired by the cleanup
        // below, which is not a failure and must not clear the grid.
        if (controller.signal.aborted) return;
        setProducts([]);
      }
      setLoading(false);
    })();

    return () => controller.abort();
  }, [initialQuery, activeCategories, brand, tag, quick, maxPrice, inStockOnly, sort, limit, forcedEmptyCategoryLabel]);

  // Sets loading eagerly, from the event handler that triggers the fetch
  // effect below — not from inside the effect itself, so a filter click
  // shows the dimmed state immediately instead of waiting a render.
  function resetPaging() {
    setLoading(true);
    setLimit(PAGE_SIZE);
  }

  const toggleCategory = useCallback((category: Category) => {
    resetPaging();
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
     
  }, []);

  // Picking a universe from the carousel filters in place. Without the scroll
  // the grid updates far below the fold and the click looks like it did
  // nothing at all.
  const selectCategoryAndScroll = useCallback((category: Category) => {
    resetPaging();
    setActiveCategories((prev) => (prev.size === 1 && prev.has(category) ? new Set() : new Set([category])));
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }, []);

  const selectBrand = useCallback((name: string) => {
    resetPaging();
    setBrand((prev) => (prev === name ? "" : name));
     
  }, []);

  const setTag = useCallback((label: string) => {
    resetPaging();
    setTagState((prev) => (prev === label ? "" : label));
    setTimeout(() => {
      const el = gridRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 170;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 60);
     
  }, []);

  const filtersProps = useMemo(
    () => ({
      activeBrand: brand,
      activeCategories,
      activeTag: tag,
      facets,
      inStockOnly,
      maxPrice,
      needs: SEO_LINK_GROUPS.find((g) => g.title === "Par besoin")?.items || [],
      onSelectBrand: selectBrand,
      onSelectNeed: setTag,
      onToggleCategory: toggleCategory,
      onToggleInStockOnly: () => {
        resetPaging();
        setInStockOnly((v) => !v);
      },
      onMaxPriceChange: (v: number) => {
        resetPaging();
        setMaxPrice(v);
      },
    }),
    [brand, activeCategories, tag, facets, inStockOnly, maxPrice, selectBrand, setTag, toggleCategory],
  );

  // One removable chip per active refinement, replacing the twenty-one pills
  // that used to sit above the grid. Pills advertised every possible filter at
  // once; chips show only what is actually applied, which is the one thing a
  // visitor needs to see and to undo.
  const activeChips: { label: string; onRemove: () => void }[] = [
    ...[...activeCategories].map((c) => ({ label: c as string, onRemove: () => toggleCategory(c) })),
    ...(brand ? [{ label: brand, onRemove: () => selectBrand(brand) }] : []),
    ...(tag
      ? [
          {
            label: tag,
            // Deliberately not setTag(): that helper scrolls the grid into
            // view, which is right when *adding* a refinement from the SEO
            // links and wrong when removing one from the chip row.
            onRemove: () => {
              resetPaging();
              setTagState("");
            },
          },
        ]
      : []),
    ...(quick
      ? [
          {
            label: quick,
            onRemove: () => {
              resetPaging();
              setQuick("");
            },
          },
        ]
      : []),
  ];

  const heroTitle = pageTitle || "Catalogue parapharmacie";
  const heroIntro = pageIntro || "Des soins sélectionnés par nos pharmaciens pour accompagner chaque besoin.";

  // A slug that is a real nav entry but that no product carries yet. The page
  // used to render the whole machine anyway — toolbar, sort, filter sidebar,
  // an empty grid — around a single sentence apologising for it. There is
  // nothing to sort or filter, so none of that is shown; the visitor gets the
  // five aisles that do hold products instead of a dead end.
  if (forcedEmptyCategoryLabel) {
    return (
      <div style={{ margin: "0 auto", maxWidth: "min(1280px,100%)", padding: "clamp(18px,2.4vw,30px) clamp(14px,3.4vw,32px) clamp(44px,5vw,76px)" }}>
        <Breadcrumbs
          items={[{ label: "Accueil", href: routes.home() }, ...(breadcrumbExtra ? [breadcrumbExtra] : []), { label: heroTitle }]}
        />
        <div style={{ marginTop: 10, maxWidth: 760 }}>
          <h1 style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(28px,3.8vw,44px)", fontWeight: 200, margin: 0 }}>{heroTitle}</h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, margin: "12px 0 0", opacity: 0.62 }}>
            Ce rayon n&apos;est pas encore en ligne. En attendant, voici les univers déjà disponibles — ou parcourez le{" "}
            <Link className="link-hover" href={routes.catalogue()} style={{ color: "var(--pdh-plum)", fontWeight: 600 }}>
              catalogue complet
            </Link>
            .
          </p>
        </div>

        <RitualSelector activeSlug={forcedEmptyCategoryLabel.toLowerCase()} />
      </div>
    );
  }

  return (
    <div style={{ margin: "0 auto", maxWidth: "min(1280px,100%)", padding: "clamp(18px,2.4vw,30px) clamp(14px,3.4vw,32px) clamp(44px,5vw,76px)" }}>
      <Breadcrumbs
        items={[{ label: "Accueil", href: routes.home() }, ...(breadcrumbExtra ? [breadcrumbExtra] : []), { label: pageTitle || "Catalogue" }]}
      />

      {editorial ? (
        <CatalogueHero intro={heroIntro} title={heroTitle} />
      ) : (
        <div style={{ marginTop: 10, maxWidth: 760 }}>
          <h1 style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(28px,3.8vw,44px)", fontWeight: 200, margin: 0 }}>{heroTitle}</h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, margin: "12px 0 0", opacity: 0.62 }}>{heroIntro}</p>
        </div>
      )}

      {editorial && (
        <>
          <UniverseCarousel facets={facets} onSelect={selectCategoryAndScroll} />
          <ReassuranceStrip />
        </>
      )}

      <div
        ref={gridRef}
        style={{
          alignItems: "center",
          borderBottom: "1px solid rgba(94,64,116,.12)",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          marginTop: "clamp(34px,4vw,56px)",
          paddingBottom: 18,
          scrollMarginTop: 150,
        }}
      >
        <div style={{ fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>{total}</span> produit{total === 1 ? "" : "s"}
          {initialQuery ? ` pour « ${initialQuery} »` : ""}
        </div>

        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 14 }}>
          <button
            aria-pressed={filtersOpen}
            className="link-hover"
            onClick={() => {
              if (window.matchMedia("(max-width: 899px)").matches) setDrawerOpen(true);
              else setFiltersOpen((v) => !v);
            }}
            style={{
              alignItems: "center",
              border: "1px solid rgba(94,64,116,.28)",
              borderRadius: 999,
              color: "var(--pdh-ink)",
              cursor: "pointer",
              display: "flex",
              fontSize: 12,
              fontWeight: 600,
              gap: 9,
              letterSpacing: ".1em",
              minHeight: 44,
              padding: "9px 18px",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" size={14} strokeWidth={1.7} />
            Filtrer
          </button>
          <label style={{ alignItems: "center", display: "flex", fontSize: 12, gap: 8 }}>
            <span style={{ opacity: 0.55 }}>Trier par</span>
            <select
              onChange={(e) => {
                resetPaging();
                setSort(e.target.value as typeof sort);
              }}
              style={{
                background: "#fff",
                border: "1px solid rgba(94,64,116,.28)",
                borderRadius: 999,
                color: "var(--pdh-ink)",
                cursor: "pointer",
                fontSize: 12.5,
                minHeight: 44,
                padding: "9px 14px",
              }}
              value={sort}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div aria-label="Filtres actifs" role="group" style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 16 }}>
          {activeChips.map((chip) => (
            <button
              aria-label={`Retirer le filtre ${chip.label}`}
              key={chip.label}
              onClick={chip.onRemove}
              style={{
                alignItems: "center",
                background: "var(--pdh-plum)",
                borderRadius: 999,
                color: "var(--pdh-cream)",
                cursor: "pointer",
                display: "flex",
                fontSize: 11.5,
                gap: 8,
                letterSpacing: ".06em",
                padding: "7px 14px",
              }}
              type="button"
            >
              {chip.label}
              <X aria-hidden="true" size={13} style={{ opacity: 0.7 }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: "clamp(18px,2.4vw,30px)", paddingTop: "clamp(18px,2.2vw,26px)" }}>
        {filtersOpen && (
          <div className="catalogue-sidebar">
            <Filters {...filtersProps} />
          </div>
        )}

        <div style={{ flex: "999 1 420px", minWidth: 0 }}>
          {/* First load has no grid to dim — the previous `opacity: 0.5`
              only worked once results existed, so the very first paint was a
              blank column. Skeletons hold the grid's real shape instead.
              A *refine* (filter change) keeps the current results dimmed, so
              the page doesn't flash back to placeholders on every click. */}
          {loading && products.length === 0 ? (
            <ProductGridSkeleton count={12} />
          ) : !loading && products.length === 0 ? (
            <p style={{ fontSize: 14, opacity: 0.6 }}>Aucun produit ne correspond à ces filtres.</p>
          ) : (
            <div className="catalogue-grid" role="list" style={{ opacity: loading ? 0.5 : 1, transition: "opacity .2s" }}>
              {products.map((product, i) => (
                <div key={product.id} role="listitem">
                  <ProductCard delayMs={i * 30} product={product} variant="catalogue" />
                </div>
              ))}
            </div>
          )}

          {products.length < total && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(28px,3.4vw,40px)" }}>
              <button
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setLimit((v) => v + PAGE_SIZE);
                }}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(94,64,116,.28)",
                  borderRadius: 999,
                  color: "var(--pdh-ink)",
                  cursor: loading ? "wait" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".1em",
                  padding: "14px 34px",
                  textTransform: "uppercase",
                }}
                type="button"
              >
                {loading ? "Chargement…" : `Charger plus (${total - products.length} restants)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {drawerOpen && <FiltersDrawer {...filtersProps} onClose={() => setDrawerOpen(false)} resultCount={total} />}

      {editorial && (
        <>
          <EditorialPair />
          <BrandsRail brands={brands} />
          <ServiceStrip freeFrom={FREE_SHIPPING_THRESHOLD} />
        </>
      )}
    </div>
  );
}
