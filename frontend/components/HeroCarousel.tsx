"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { HERO_SLIDES, type HeroSlide } from "@/data/home";
import { usePageVisible, useReducedMotion } from "@/hooks/use-motion-preferences";

const AUTOPLAY_MS = 5500;

/**
 * The banner carousel that opens the page, directly under the header.
 *
 * Each slide is one wide piece of campaign artwork (brand, offer and product
 * are in the picture itself), the whole banner is the link, and plain chevrons
 * sit in the grey margins either side. A slide's `mobileImg` replaces the wide
 * artwork on a phone, where a 4:1 banner would be too short to read.
 *
 * The slide's title, sub and CTA are not drawn: they stay in the markup for
 * screen readers and search engines. `align` and `overlay` do not apply.
 * Layout lives in `.pdh-hero*` in globals.css.
 */
export function HeroCarousel({ slides }: { slides?: HeroSlide[] }) {
  const heroSlides = slides && slides.length > 0 ? slides : HERO_SLIDES;
  const [active, setActive] = useState(0);
  // Slide 0 (the LCP candidate) plus the one queued behind it. Mounting the
  // next slide while the current one shows keeps the crossfade from landing on
  // an empty frame. The set only grows, so a fetched slide never re-requests.
  const [mountedSlides, setMountedSlides] = useState<Set<number>>(() => new Set([0, 1]));

  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  /** Transient: the pointer is over the hero, or focus is inside it. Advancing
   * the slide under a visitor who is reading it is what makes carousels hostile. */
  const [engaged, setEngaged] = useState(false);
  /** Mirrors `active` for the interval, which must not be rebuilt per slide. */
  const activeRef = useRef(0);

  // One slide is not a carousel: no timer.
  const isCarousel = heroSlides.length > 1;
  const autoplaying = isCarousel && !reducedMotion && !engaged && pageVisible;

  const activate = useCallback(
    (index: number) => {
      activeRef.current = index;
      setActive(index);
      const upcoming = (index + 1) % heroSlides.length;
      setMountedSlides((prev) =>
        prev.has(index) && prev.has(upcoming) ? prev : new Set(prev).add(index).add(upcoming),
      );
    },
    [heroSlides.length],
  );

  // Swipe: a mostly-horizontal drag of 40px or more changes slide. The stage
  // keeps `touch-action: pan-y`, so vertical scrolling is still the browser's.
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const go = useCallback(
    (step: number) => activate((activeRef.current + step + heroSlides.length) % heroSlides.length),
    [activate, heroSlides.length],
  );

  // The whole autoplay lifecycle as one condition: every reason to stop flips
  // `autoplaying` and clears the interval, so none needs its own teardown.
  useEffect(() => {
    if (!autoplaying) return;
    const id = setInterval(() => {
      activate((activeRef.current + 1) % heroSlides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplaying, activate, heroSlides.length]);

  return (
    <section
      className="pdh-hero"
      aria-roledescription="carousel"
      aria-label="Mises en avant"
      // While the carousel rotates on its own, announcing each slide would
      // interrupt a screen-reader user every 5.5s; once it is stopped, a slide
      // change is something the visitor asked for and should hear.
      aria-live={autoplaying ? "off" : "polite"}
      // Mouse, not pointer: pointerenter fires on touch and would leave the
      // carousel paused after a tap on a phone. Focus covers the keyboard.
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
    >
      <div
        className="pdh-hero-stage"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" || !isCarousel) return;
          dragStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = dragStart.current;
          dragStart.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      >
        {heroSlides.map((slide, i) => {
          const isActive = i === active;
          // The first slide carries the page's only h1: a heading that changed
          // as the carousel rotated would retitle the page every five seconds.
          const Title = i === 0 ? "h1" : "h2";

          return (
            <div
              key={slide.title}
              aria-hidden={!isActive}
              className="pdh-hero-slide"
              data-active={isActive ? "true" : "false"}
              data-has-mobile={slide.mobileImg ? "true" : "false"}
              inert={!isActive}
            >
              {/* The artwork carries the message, so the copy is kept for
                  screen readers and search engines only, and the whole banner
                  is the link. */}
              <Link href={slide.ctaUrl || "/catalogue"} className="pdh-hero-banner">
                <div className="sr-only">
                  <Title>{slide.title}</Title>
                  {slide.sub ? <p>{slide.sub}</p> : null}
                  <p>{slide.cta}</p>
                </div>
                <div aria-hidden="true" className="pdh-hero-photo">
                  {/* Slides past the first mount only once they are shown or next
                      in line, so a 5-slide carousel does not fetch 5 heroes on
                      first paint. Slide 0 carries `priority`: it is the LCP. */}
                  {mountedSlides.has(i) && (
                    <>
                      <CloudinaryImage
                        src={slide.img}
                        alt=""
                        fill
                        preset="hero"
                        priority={i === 0}
                        // Art direction is CSS (.hero-desktop-img is display:none
                        // under 768px) but a hidden <img> is still fetched, so the
                        // unused variant is declared 1px to cost a thumbnail.
                        sizes={slide.mobileImg ? "(max-width: 767px) 1px, 100vw" : "100vw"}
                        className={slide.mobileImg ? "hero-desktop-img" : undefined}
                        style={{ objectFit: "cover" }}
                      />
                      {slide.mobileImg && (
                        <CloudinaryImage
                          src={slide.mobileImg}
                          alt=""
                          fill
                          preset="hero"
                          priority={i === 0}
                          sizes="(max-width: 767px) 100vw, 1px"
                          className="hero-mobile-img"
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {isCarousel && (
        <>
          <button type="button" className="pdh-hero-arrow pdh-hero-arrow--prev" aria-label="Mise en avant précédente" onClick={() => go(-1)}>
            <ChevronLeft aria-hidden="true" size={34} strokeWidth={1.4} />
          </button>
          <button type="button" className="pdh-hero-arrow pdh-hero-arrow--next" aria-label="Mise en avant suivante" onClick={() => go(1)}>
            <ChevronRight aria-hidden="true" size={34} strokeWidth={1.4} />
          </button>
        </>
      )}

      {isCarousel && (
        <div className="pdh-hero-dots">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Afficher la mise en avant ${i + 1} sur ${heroSlides.length}`}
              aria-current={i === active}
              className="pdh-hero-dot"
              onClick={() => activate(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
