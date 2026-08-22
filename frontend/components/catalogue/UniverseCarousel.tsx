"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import type { Category } from "@/data/products";
import { UNIVERSES } from "@/lib/catalogue/universes";
import type { CatalogueFacets } from "@/lib/storefront/catalogue";

/**
 * "Explorer nos univers" — the catalogue's entry point.
 *
 * Replaces the two rows of pills that used to sit under the title. Nine pills
 * plus twelve marketing pills read as a wall of identical chips: everything
 * competing, nothing leading. A carousel can only show three at a time, which
 * forces a hierarchy and gives each aisle a picture instead of a word.
 *
 * The selector behaviour — one card expanded, the rest visible and narrow —
 * comes from the interactive-selector pattern, but none of its chrome: no
 * full-height stage, no dark overlay, no rounded-pill navigation. The card is
 * a plain link, so a click always navigates and never lands on a dead
 * "selected but not opened" state; expansion follows hover and focus on a
 * pointer device and scroll position on a touch one.
 */

// The lower bound is itself viewport-relative so the active card dominates a
// phone (≈76vw) without being allowed to grow past 430px on a desktop, where
// 32vw takes over. A flat 230px min made the active card only 63% of a 390px
// row — too close to its neighbour to read as the selected one.
const EXPANDED = "clamp(min(76vw, 300px), 32vw, 430px)";
const COLLAPSED = "clamp(104px, 21vw, 280px)";

export function UniverseCarousel({
  facets,
  onSelect,
}: {
  facets: CatalogueFacets;
  /** Filters the grid below in place rather than navigating away. */
  onSelect: (category: Category) => void;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  // Touch scrolling drives `active`; a pointer drives it from hover. Without
  // this flag the scroll handler fights the hover on hybrid devices, and the
  // expanded card flickers between two neighbours.
  const pointerDriven = useRef(false);
  // The centre-of-viewport heuristic is right once the rail has been
  // scrolled, and wrong on the very first paint: at scrollLeft 0 the card
  // nearest the centre is the second one, so the page opened with "Corps"
  // expanded and "Visage" collapsed at the very edge. Until the visitor
  // actually scrolls, the first card stays the active one.
  const hasScrolled = useRef(false);

  const focusIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(UNIVERSES.length - 1, index));
    setActive(clamped);
    cardRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  // Keeps the arrows honest (disabled at each end) and, on touch, promotes
  // whichever card is nearest the centre to the expanded state.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setAtStart(el.scrollLeft <= 2);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
        if (el.scrollLeft > 4) hasScrolled.current = true;
        if (pointerDriven.current || !hasScrolled.current) return;
        const centre = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const cardCentre = card.offsetLeft + card.offsetWidth / 2;
          const distance = Math.abs(cardCentre - centre);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        setActive(best);
      });
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section aria-labelledby="univers-title" style={{ marginTop: "clamp(30px,3.6vw,48px)" }}>
      <div style={{ alignItems: "flex-end", display: "flex", gap: 20, justifyContent: "space-between", marginBottom: "clamp(16px,1.8vw,22px)" }}>
        <div>
          <div style={{ color: "var(--pdh-teal)", fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase" }}>
            Le catalogue
          </div>
          <h2
            id="univers-title"
            style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(24px,3vw,34px)", fontWeight: 200, margin: "10px 0 0" }}
          >
            Explorer nos univers
          </h2>
        </div>

        <div className="univers-arrows" style={{ display: "flex", gap: 8 }}>
          {[
            { disabled: atStart, icon: ChevronLeft, label: "Univers précédents", step: -1 },
            { disabled: atEnd, icon: ChevronRight, label: "Univers suivants", step: 1 },
          ].map(({ disabled, icon: Icon, label, step }) => (
            <button
              key={label}
              aria-label={label}
              className="circle-btn"
              disabled={disabled}
              onClick={() => focusIndex(active + step)}
              style={{
                alignItems: "center",
                background: "#fff",
                border: "1px solid rgba(94,64,116,.24)",
                borderRadius: "50%",
                cursor: disabled ? "default" : "pointer",
                display: "flex",
                height: 40,
                justifyContent: "center",
                opacity: disabled ? 0.35 : 1,
                transition: "opacity .2s, background .2s",
                width: 40,
              }}
              type="button"
            >
              <Icon aria-hidden="true" color="var(--pdh-plum)" size={17} strokeWidth={1.7} />
            </button>
          ))}
        </div>
      </div>

      <ul className="univers-rail" ref={scrollerRef}>
        {UNIVERSES.map((universe, i) => {
          const count = facets.categories.find((f) => f.value === universe.category)?.count ?? 0;
          const isActive = i === active;
          return (
            <li
              className="univers-card"
              data-active={isActive ? "true" : "false"}
              key={universe.category}
              onBlur={() => {
                pointerDriven.current = false;
              }}
              onFocus={() => {
                pointerDriven.current = true;
                setActive(i);
              }}
              onMouseEnter={() => {
                pointerDriven.current = true;
                setActive(i);
              }}
              onMouseLeave={() => {
                pointerDriven.current = false;
              }}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              style={{ width: isActive ? EXPANDED : COLLAPSED }}
            >
              <Link
                aria-current={isActive ? "true" : undefined}
                href={`/catalogue?cat=${encodeURIComponent(universe.category)}`}
                onClick={(e) => {
                  // Same page: filter in place instead of a full navigation,
                  // so the grid updates without losing scroll position.
                  e.preventDefault();
                  onSelect(universe.category);
                }}
                style={{ color: "inherit", display: "block", height: "100%", position: "relative" }}
              >
                {universe.image ? (
                  <CloudinaryImage
                    alt=""
                    className="univers-shot"
                    crop="fill"
                    fill
                    sizes="(max-width: 720px) 78vw, 430px"
                    src={universe.image}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  // No editorial shot for this aisle yet. Rather than borrow an
                  // unrelated photo, the card states itself: the initial set in
                  // the display face, on the brand's warm ground.
                  <span
                    aria-hidden="true"
                    style={{
                      alignItems: "center",
                      background: "linear-gradient(160deg, var(--pdh-sand) 0%, #efe7dc 100%)",
                      color: "rgba(94,64,116,.16)",
                      display: "flex",
                      fontFamily: "var(--font-jost)",
                      fontSize: "clamp(64px,9vw,120px)",
                      fontWeight: 200,
                      inset: 0,
                      justifyContent: "center",
                      lineHeight: 1,
                      position: "absolute",
                    }}
                  >
                    {universe.category.slice(0, 2)}
                  </span>
                )}

                {/* Only over a photo: the typographic card is already legible
                    and a scrim would just grey it down. */}
                {universe.image && <span aria-hidden="true" className="univers-scrim" />}

                <span className="univers-body">
                  <span className="univers-name" style={{ color: universe.image ? "#fff" : "var(--pdh-ink)" }}>
                    {universe.category}
                  </span>
                  {/* Kept mounted and faded rather than unmounted, so the card
                      doesn't reflow its own text while it is still widening.
                      Visibility is driven by [data-active] on the card, not by
                      an inline opacity, so the CSS owns the whole transition. */}
                  <span className="univers-detail">
                    <span
                      style={{
                        color: universe.image ? "rgba(255,255,255,.88)" : "rgba(55,48,32,.7)",
                        display: "block",
                        fontSize: 12.5,
                        lineHeight: 1.6,
                      }}
                    >
                      {universe.blurb}
                    </span>
                    <span
                      style={{
                        color: universe.image ? "rgba(255,255,255,.72)" : "rgba(55,48,32,.55)",
                        display: "block",
                        fontSize: 11,
                        letterSpacing: ".12em",
                        marginTop: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      {count} produit{count === 1 ? "" : "s"}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
