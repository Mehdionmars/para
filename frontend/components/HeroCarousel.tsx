"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { HERO_SLIDES, type HeroSlide } from "@/data/home";

const AUTOPLAY_MS = 5500;

const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCE_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribePageVisible(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * Whether the visitor asked their OS for less motion. External browser state
 * that can flip while the page is open, hence useSyncExternalStore. The server
 * snapshot is `false`: erring the other way would ship a paused carousel to
 * everyone.
 */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCE_MOTION_QUERY).matches,
    () => false,
  );
}

/** A carousel advancing in a tab nobody is looking at burns a timer and can
 * quietly pull images for slides the visitor never sees. */
function usePageVisible() {
  return useSyncExternalStore(
    subscribePageVisible,
    () => !document.hidden,
    () => true,
  );
}

/**
 * The opening statement of the page: type first, photograph beside it.
 *
 * No card over the picture, no pill, no snow. The headline is set large on the
 * page ground and the photograph sits next to it (below it on a phone), so the
 * product is never hidden behind the text that is selling it. Layout lives in
 * `.pdh-hero*` in globals.css.
 *
 * Slide `align` and `overlay` settings from the Storefront Builder no longer
 * apply: with no text over the image there is nothing to align or darken.
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
              inert={!isActive}
            >
              <div className="pdh-hero-copy">
                <Title className="pdh-hero-title">{slide.title}</Title>
                {slide.sub ? <p className="pdh-hero-sub">{slide.sub}</p> : null}
                <div className="pdh-hero-actions">
                  <Link href={slide.ctaUrl || "/catalogue"} className="pdh-hero-cta">
                    {slide.cta}
                    <span aria-hidden="true">→</span>
                  </Link>
                  {slide.secondaryCta && slide.secondaryCtaUrl ? (
                    <Link href={slide.secondaryCtaUrl} className="pdh-hero-link">
                      {slide.secondaryCta}
                    </Link>
                  ) : null}
                </div>
                {slide.tag ? <p className="pdh-hero-tag">{slide.tag}</p> : null}
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
                      sizes={slide.mobileImg ? "(max-width: 767px) 1px, 60vw" : "(max-width: 767px) 100vw, 60vw"}
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
            </div>
          );
        })}
      </div>

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
