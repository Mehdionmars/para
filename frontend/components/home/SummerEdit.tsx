"use client";

import { ChevronLeft, ChevronRight, Droplet, Leaf, ShieldCheck, Sparkles, Sun, type LucideIcon } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Rail, type RailHandle } from "@/components/Rail";
import { SUMMER_EDIT_ACTS, SUMMER_EDIT_COPY } from "@/data/home";
import { getProduct, type Product } from "@/data/products";
import type { LiveProduct } from "@/lib/storefront/products";

type Copy = typeof SUMMER_EDIT_COPY;
type Act = { eyebrow: string; title: string; description: string; products: (Product | LiveProduct)[] };

const HIGHLIGHT_ICONS: Record<string, LucideIcon> = { Sun, Droplet, Leaf, Sparkles, ShieldCheck };
const MAX_ACT_PRODUCTS = 4;
const SPEED_MULTIPLIER: Record<Copy["animation"]["speed"], number> = { slow: 1.5, normal: 1, fast: 0.65 };

/** Fires once an element scrolls into view, then stays true — the single
 * primitive every scroll-triggered moment in this section is built on.
 * Reduced-motion visitors get `true` immediately: they see the settled
 * state with no transition ever running, never content stuck invisible. */
function useInView<T extends HTMLElement>(enabled: boolean): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(!enabled);

  useEffect(() => {
    if (!enabled || inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return [ref, inView];
}

/** Very subtle, JS-driven vertical drift on an element as it scrolls through
 * the viewport — rAF-throttled, a single scroll listener, capped to a small
 * range so it reads as ambient depth rather than a "big animation". Skips
 * entirely for reduced-motion. */
function useParallax<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    function update() {
      const el = ref.current;
      ticking = false;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (section top just entered at viewport bottom) .. 1 (section top
      // has fully exited past viewport top) — clamped, then scaled down to
      // a ±14px drift so the effect stays ambient, not a "big animation".
      const progress = Math.min(1, Math.max(-1, 1 - (rect.top + rect.height / 2) / vh));
      setOffset(progress * 14);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return [ref, offset] as const;
}

/** Seasonal editorial campaign — independent of Dermo Corner ("Conseil
 * dermo") and Campaign ("Nos coups de cœur"): an asymmetric hero band
 * (oversized two-tone title beside a large editorial image, not a
 * full-bleed banner) followed by up to 3 compact "Acts", each its own small
 * automatically-scrolling product carousel with a prev/next + numeric
 * counter. Ships nothing until real content exists — same convention as
 * ImageCarousel/DermoCorner. Colours, layout and motion are all Builder-
 * editable per campaign (Summer today, Winter/Christmas/Ramadan tomorrow —
 * same block, new values, no code change). */
export function SummerEdit({
  copy: copyProp,
  acts: actsProp,
}: {
  copy?: Copy;
  acts?: Act[];
} = {}) {
  const copy = copyProp ?? SUMMER_EDIT_COPY;
  const acts = actsProp ?? SUMMER_EDIT_ACTS.map((a) => ({ ...a, products: a.productIds.map((id) => getProduct(id)) }));
  const activeActs = acts.filter((a) => a.products.length > 0).slice(0, 3);

  const [heroRef, heroInView] = useInView<HTMLDivElement>(copy.animation.enableReveal);
  const [parallaxRef, parallaxOffset] = useParallax<HTMLDivElement>(copy.animation.enableParallax);

  if (!copy.img || activeActs.length === 0) return null;

  const { background, text, accent, cta: ctaColor } = copy.colors;
  const speed = SPEED_MULTIPLIER[copy.animation.speed] ?? 1;
  const imageFirst = copy.imagePosition === "left";

  return (
    <section aria-labelledby="summer-edit-heading">
      {/* Hero band */}
      <div style={{ background, padding: "clamp(40px,6vw,88px) 0 clamp(48px,6vw,88px)" }}>
        <div
          ref={heroRef}
          className="summer-hero-grid"
          style={{
            maxWidth: copy.fullWidth ? "100%" : "min(1280px,100%)",
            margin: "0 auto",
            padding: copy.fullWidth ? 0 : "0 clamp(14px,3.4vw,32px)",
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)",
            gap: "clamp(32px,5vw,72px)",
            alignItems: "center",
          }}
        >
          <div style={{ order: imageFirst ? 2 : 1 }}>
            <div
              className="summer-reveal"
              data-in-view={heroInView}
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: 11,
                letterSpacing: ".28em",
                textTransform: "uppercase",
                color: accent,
                transitionDelay: `${0.05 * speed}s`,
              }}
            >
              {copy.eyebrow}
              {copy.year && <span style={{ opacity: 0.6 }}> — {copy.year}</span>}
            </div>

            <h2
              id="summer-edit-heading"
              className="summer-reveal"
              data-in-view={heroInView}
              style={{
                fontFamily: "var(--font-alta)",
                fontWeight: 200,
                fontSize: "clamp(38px,6.2vw,76px)",
                lineHeight: 0.98,
                letterSpacing: "-.01em",
                margin: "18px 0 20px",
                transitionDelay: `${0.14 * speed}s`,
              }}
            >
              <span style={{ display: "block", color: text }}>{copy.title}</span>
              {copy.titleAccent && <span style={{ display: "block", color: accent }}>{copy.titleAccent}</span>}
            </h2>

            {copy.description && (
              <p
                className="summer-reveal"
                data-in-view={heroInView}
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  maxWidth: 440,
                  margin: "0 0 32px",
                  color: text,
                  opacity: 0.72,
                  transitionDelay: `${0.22 * speed}s`,
                }}
              >
                {copy.description}
              </p>
            )}

            <div className="summer-reveal" data-in-view={heroInView} style={{ transitionDelay: `${0.3 * speed}s` }}>
              <Link
                href={copy.ctaUrl || "/catalogue"}
                className="summer-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 32px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  background: ctaColor,
                  color: "#fff",
                }}
              >
                {copy.ctaLabel} →
              </Link>
            </div>

            {copy.highlights.length > 0 && (
              <div
                className="summer-reveal"
                data-in-view={heroInView}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "clamp(18px,2.4vw,32px)",
                  marginTop: "clamp(28px,3.4vw,44px)",
                  paddingTop: "clamp(22px,2.8vw,32px)",
                  borderTop: `1px solid ${text}22`,
                  transitionDelay: `${0.38 * speed}s`,
                }}
              >
                {copy.highlights.map((h, i) => {
                  const Icon = HIGHLIGHT_ICONS[h.icon] || Sun;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Icon aria-hidden="true" size={17} strokeWidth={1.5} style={{ color: accent, flex: "none" }} />
                      <span style={{ fontSize: 12.5, letterSpacing: ".01em", color: text, opacity: 0.75 }}>{h.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Two layers on purpose: parallax needs to track scroll instantly
              (no transition, or it lags/smears), while the mount/scroll
              reveal needs a slow eased transition — one shared `transform`
              can't satisfy both without one silently fighting the other. */}
          <div
            ref={parallaxRef}
            style={{
              order: imageFirst ? 1 : 2,
              position: "relative",
              height: "clamp(320px,42vw,560px)",
              borderRadius: "clamp(24px,3vw,40px)",
              overflow: "hidden",
              transform: `translateY(${parallaxOffset}px)`,
            }}
          >
            <div
              className="summer-image-reveal dermo-image-zoom"
              data-in-view={heroInView}
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${heroInView ? 1 : copy.imageScale})`,
                transition: "transform 1.1s cubic-bezier(.22,1,.36,1)",
              }}
            >
              <picture>
                {copy.imgMobile && <source media="(max-width: 767px)" srcSet={copy.imgMobile} />}
                <CloudinaryImage preset="editorial" src={copy.img} alt="" fill sizes="(max-width: 768px) 100vw, 660px" style={{ objectFit: "cover" }} />
              </picture>
              {copy.overlay && (
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.32) 100%)" }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Acts */}
      {activeActs.map((act, i) => (
        <ActBand key={`${act.title}-${i}`} act={act} tint={i % 2 === 1} copy={copy} speed={speed} />
      ))}
    </section>
  );
}

function ActBand({ act, tint, copy, speed }: { act: Act; tint: boolean; copy: Copy; speed: number }) {
  const railRef = useRef<RailHandle>(null);
  const pausedRef = useRef(false);
  const items = act.products.slice(0, MAX_ACT_PRODUCTS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bandRef, bandInView] = useInView<HTMLDivElement>(copy.animation.staggerProducts);
  const { autoplay, autoplaySpeedMs, showCounter, showProgress } = copy.carousel;

  useEffect(() => {
    if (!autoplay || items.length <= 1) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setActiveIndex((i) => {
        const next = (i + 1) % items.length;
        railRef.current?.scrollToRatio(items.length > 1 ? next / (items.length - 1) : 0);
        return next;
      });
    }, autoplaySpeedMs);
    return () => clearInterval(id);
  }, [autoplay, autoplaySpeedMs, items.length]);

  return (
    <div
      ref={bandRef}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      style={{ background: tint ? "rgba(0,138,165,.06)" : "transparent" }}
    >
      <div
        className="summer-act-grid"
        style={{
          maxWidth: "min(1280px,100%)",
          margin: "0 auto",
          padding: "clamp(36px,4.6vw,64px) clamp(14px,3.4vw,32px)",
          display: "grid",
          gridTemplateColumns: "minmax(0,280px) minmax(0,1fr)",
          gap: "clamp(24px,3.4vw,48px)",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
            {act.eyebrow}
          </div>
          <h3
            style={{
              fontFamily: "var(--font-alta)",
              fontWeight: 200,
              fontSize: "clamp(28px,3.4vw,40px)",
              lineHeight: 1.02,
              color: "var(--pdh-plum)",
              margin: "10px 0 14px",
            }}
          >
            {act.title}
          </h3>
          {act.description && <p style={{ fontSize: 13.5, lineHeight: 1.75, opacity: 0.68, margin: "0 0 20px", maxWidth: 300 }}>{act.description}</p>}
          <div style={{ height: 1, width: 44, background: "rgba(94,64,116,.25)" }} />
        </div>

        <div style={{ minWidth: 0 }}>
          <Rail ref={railRef} ariaLabel={act.title} cols={{ lg: 4, md: 3, sm: 2.15, xl: 4 }}>
            {items.map((product, i) => (
              <div
                key={product.id}
                role="listitem"
                className={copy.animation.staggerProducts ? "summer-reveal" : undefined}
                data-in-view={bandInView}
                style={{ transitionDelay: copy.animation.staggerProducts ? `${i * 0.09 * speed}s` : undefined }}
              >
                <ProductCard product={product} variant="similar" delayMs={copy.animation.staggerProducts ? undefined : i * 60} />
              </div>
            ))}
          </Rail>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
            {showProgress && (
              <div style={{ flex: "1 1 auto", maxWidth: 120, height: 2, borderRadius: 999, background: "rgba(94,64,116,.14)", overflow: "hidden" }}>
                <div
                  className="bar-fill"
                  style={{
                    background: "var(--pdh-plum)",
                    transform: `scaleX(${(activeIndex + 1) / items.length})`,
                  }}
                />
              </div>
            )}
            {showCounter && (
              <span style={{ fontFamily: "var(--font-alta)", fontSize: 12.5, letterSpacing: ".08em", color: "var(--pdh-ink)", opacity: 0.55, whiteSpace: "nowrap" }}>
                {String(activeIndex + 1).padStart(2, "0")} — {String(items.length).padStart(2, "0")}
              </span>
            )}
            <button type="button" onClick={() => railRef.current?.scrollPrev()} aria-label="Produits précédents" className="circle-btn">
              <ChevronLeft aria-hidden="true" size={15} />
            </button>
            <button type="button" onClick={() => railRef.current?.scrollNext()} aria-label="Produits suivants" className="circle-btn">
              <ChevronRight aria-hidden="true" size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
