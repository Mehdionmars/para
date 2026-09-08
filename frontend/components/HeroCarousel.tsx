"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { HERO_SLIDES, type HeroSlide } from "@/data/home";
import { SnowParticles } from "./SnowParticles";

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
 * Whether the visitor asked their OS for less motion.
 *
 * SnowParticles reads the same query imperatively, which is right for a canvas
 * loop but wrong here: this value decides what gets *rendered* (the arrows,
 * the live-region politeness), so it has to be state. It is external
 * browser state that can flip while the page is open, so useSyncExternalStore
 * is the tool — reading it into useState from an effect is the cascade
 * `react-hooks/set-state-in-effect` exists to catch.
 *
 * The server snapshot is `false`: the server cannot know, so the markup is
 * built as if motion is allowed and corrects itself on hydration. Erring the
 * other way would ship a paused carousel to everyone.
 */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCE_MOTION_QUERY).matches,
    () => false,
  );
}

/** A carousel advancing in a tab nobody is looking at burns a timer, spends
 * mobile battery, and — because `activate` also mounts the next slide — can
 * quietly pull images for slides the visitor never sees. */
function usePageVisible() {
  return useSyncExternalStore(
    subscribePageVisible,
    () => !document.hidden,
    () => true,
  );
}

export function HeroCarousel({ slides }: { slides?: HeroSlide[] }) {
  const heroSlides = slides && slides.length > 0 ? slides : HERO_SLIDES;
  const [active, setActive] = useState(0);
  // Slides whose images have been mounted. Grows as the carousel advances
  // and never shrinks, so a slide already fetched doesn't re-request on the
  // next loop. Slide 0 starts mounted: it's the LCP candidate.
  // Slide 0 (the LCP candidate) plus the one queued behind it. Mounting the
  // *next* slide while the current one shows is what keeps the crossfade
  // from landing on an empty frame: a slide mounted only at transition time
  // starts fetching then, and shows its bare background for a beat.
  const [mountedSlides, setMountedSlides] = useState<Set<number>>(() => new Set([0, 1]));

  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  /** Transient: the pointer is over the hero, or focus is somewhere inside it.
   * Advancing the slide under a visitor who is reading it — or who is tabbing
   * through its link — is the behaviour that makes carousels hostile. */
  const [engaged, setEngaged] = useState(false);
  /** Bumped on every manual navigation to restart the interval, so clicking
   * "next" gives the new slide a full turn rather than whatever was left of
   * the previous one's. */
  const [cycle, setCycle] = useState(0);
  /** Mirrors `active` for the autoplay interval, which needs the current index
   * without being torn down and rebuilt on every slide change. */
  const activeRef = useRef(0);

  // One slide is not a carousel: no timer, no arrows.
  const isCarousel = heroSlides.length > 1;
  const autoplaying = isCarousel && !reducedMotion && !engaged && pageVisible;

  /** The one place the slide changes. Marks the target mounted at the same
   * time, so mounting is driven by the transition itself rather than by an
   * effect reacting to it — an effect here would setState synchronously on
   * every slide change and cascade an extra render. */
  const activate = useCallback(
    (index: number) => {
      activeRef.current = index;
      setActive(index);
      // Mount the target and the one after it, so the following transition
      // already has its image in cache.
      const upcoming = (index + 1) % heroSlides.length;
      setMountedSlides((prev) =>
        prev.has(index) && prev.has(upcoming) ? prev : new Set(prev).add(index).add(upcoming),
      );
    },
    [heroSlides.length],
  );

  // The whole autoplay lifecycle, expressed as one condition. Every reason to
  // stop — reduced motion, hover, focus, a hidden tab, a lone slide — clears
  // the interval by flipping `autoplaying`, and no reason needs its own
  // teardown path. There is no visible pause control among them; see the
  // note next to the arrows for why, and for what that costs.
  //
  // The interval is deliberately not re-created when `active` changes, so it
  // reads the current index from the ref `activate` keeps in step. Deriving it
  // from a `setActive` updater instead would mean mounting the next slide from
  // inside that updater, and updaters have to stay pure.
  useEffect(() => {
    if (!autoplaying) return;
    const id = setInterval(() => {
      activate((activeRef.current + 1) % heroSlides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplaying, cycle, activate, heroSlides.length]);

  function goTo(index: number) {
    activate(index);
    setCycle((c) => c + 1);
  }

  return (
    <section
      className="home-hero"
      aria-roledescription="carousel"
      aria-label="Mises en avant"
      // While the carousel rotates on its own, announcing each slide would
      // interrupt a screen-reader user mid-sentence every 5.5s; once it is
      // stopped, a slide change is something the visitor asked for and should
      // hear. This is the ARIA carousel pattern's live-region rule.
      aria-live={autoplaying ? "off" : "polite"}
      // Mouse, not pointer: `pointerenter` fires on touch and would leave the
      // carousel stuck paused after a tap on a phone, where there is no
      // corresponding leave. Focus covers the keyboard path.
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
      style={{
        position: "relative",
        height: "clamp(430px,44vw,520px)",
        maxWidth: "min(1280px,100%)",
        width: "calc(100% - clamp(28px,6.8vw,64px))",
        margin: "clamp(16px,2vw,24px) auto 0",
        overflow: "hidden",
        borderRadius: "clamp(12px,1.4vw,18px)",
        background: "#2f1f3d",
      }}
    >
      {heroSlides.map((slide, i) => {
        const isActive = i === active;
        // The home page had no <h1> at all — every heading on it, this hero
        // included, was an <h2>. The first slide carries it rather than the
        // active one: a heading that changes as the carousel rotates gives
        // the page a different title every five seconds, and the crawler
        // only ever sees the first frame anyway.
        const Title = i === 0 ? "h1" : "h2";

        // The photograph dissolves; the card is sequenced.
        //
        // Both used to ride on one opacity on this wrapper, which is why the
        // headlines mixed: at the midpoint of a crossfade the outgoing and
        // incoming cards were each ~50% opaque, stacked on the same rect, and
        // the two titles were legible through one another for about a second.
        // Photographs may dissolve — nothing is lost when two images overlap —
        // but two blocks of text at the same coordinates never may. So the
        // photo keeps its own opacity here and the card gets a different one.
        const photoTransition = reducedMotion
          ? "none"
          : isActive
            ? "opacity 900ms ease"
            : // Hold at full opacity underneath and drop only once the incoming
              // photo has fully covered it. Fading both at once would let the
              // hero's dark ground show through at the midpoint and dip the
              // whole frame darker — a flicker the eye reads as a fault.
              "opacity 0ms 900ms";

        // The 260ms delay IS the sequencing: the incoming card cannot start
        // until the outgoing one has finished leaving at 200ms. Exit is faster
        // than entrance, and leaves in place — a card that slides as it goes
        // pulls the eye toward what is departing rather than what is arriving.
        const copyFadeTransition = reducedMotion
          ? "none"
          : isActive
            ? "opacity 420ms cubic-bezier(.16,1,.3,1) 260ms"
            : "opacity 200ms ease-in";

        // The lift belongs to the card, the fade to its wrapper, so neither
        // inherits the other's delay. `transform 0ms 200ms` waits out the fade
        // and then silently resets the offset, giving the next entrance
        // somewhere to rise from without ever animating it visibly.
        const copyLiftTransition = reducedMotion
          ? "none"
          : isActive
            ? "transform 520ms cubic-bezier(.16,1,.3,1) 260ms"
            : "transform 0ms 200ms";

        // Snap the Ken Burns push back once the slide is hidden instead of
        // easing an invisible layer for six seconds; on a two-slide carousel
        // the old behaviour re-entered part-way through its own zoom.
        const photoScaleTransition = reducedMotion ? "none" : isActive ? "transform 6s ease-out" : "transform 0ms 900ms";

        return (
          <div
            key={slide.title}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              // The active layer sits on top so its photo fades in *over* the
              // outgoing one rather than both meeting in the middle.
              zIndex: isActive ? 2 : 1,
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                opacity: isActive ? 1 : 0,
                transition: photoTransition,
              }}
            >
            {/* Slides past the first mount only once they've been shown, so
                a 5-slide carousel doesn't fetch 5 heroes on first paint.
                Slide 0 is always mounted and carries `priority` — it is the
                LCP element. */}
            {mountedSlides.has(i) && (
              <>
                <CloudinaryImage
                  src={slide.img}
                  alt=""
                  fill
                  preset="hero"
                  priority={i === 0}
                  // Art direction is done in CSS (.hero-desktop-img is
                  // display:none under 768px) — but a hidden image element is
                  // still fetched. Declaring 1px below the breakpoint makes
                  // the browser pick the smallest srcset entry there, so the
                  // unused variant costs a thumbnail instead of a full hero.
                  sizes={slide.mobileImg ? "(max-width: 767px) 1px, 100vw" : "100vw"}
                  className={slide.mobileImg ? "hero-desktop-img" : undefined}
                  style={{
                    objectFit: "cover",
                    transform: `scale(${isActive ? 1.06 : 1})`,
                    transition: photoScaleTransition,
                  }}
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
                    style={{
                      objectFit: "cover",
                      transform: `scale(${isActive ? 1.06 : 1})`,
                      transition: "transform 6s ease-out",
                    }}
                  />
                )}
              </>
            )}
            {slide.overlay !== false && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    slide.align === "left"
                      ? "linear-gradient(270deg,rgba(47,31,61,.34) 0%,rgba(47,31,61,.12) 44%,rgba(47,31,61,.06) 100%)"
                      : "linear-gradient(90deg,rgba(47,31,61,.34) 0%,rgba(47,31,61,.12) 44%,rgba(47,31,61,.06) 100%)",
                }}
              />
            )}
            </div>
            <div
              className="home-hero-copy-wrap"
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: slide.align === "left" ? "flex-start" : "flex-end",
                padding: "0 clamp(72px,6vw,88px)",
                opacity: isActive ? 1 : 0,
                transition: copyFadeTransition,
              }}
            >
              <div
                className="home-hero-copy"
                style={{
                  background: "#fff",
                  borderRadius: "clamp(10px,1vw,14px)",
                  padding: "clamp(24px,2.6vw,36px)",
                  width: "min(430px,100%)",
                  boxShadow: "0 24px 50px -30px rgba(30,24,14,.5)",
                  color: "var(--pdh-ink)",
                  transform: `translateY(${isActive ? 0 : 18}px)`,
                  transition: copyLiftTransition,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-poppins)",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    fontSize: 10.5,
                    letterSpacing: ".24em",
                    textTransform: "uppercase",
                    border: "1px solid var(--pdh-plum-border)",
                    color: "var(--pdh-plum)",
                    padding: "6px 14px",
                    borderRadius: 999,
                  }}
                >
                  {slide.tag}
                </span>
                <Title
                  style={{
                    fontFamily: "var(--font-alta)",
                    fontWeight: 300,
                    fontSize: "clamp(26px,3.2vw,38px)",
                    lineHeight: 1.08,
                    margin: "16px 0 0",
                    letterSpacing: "-.01em",
                    color: "var(--pdh-ink)",
                  }}
                >
                  {slide.title}
                </Title>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, opacity: 0.7, margin: "12px 0 22px" }}>{slide.sub}</p>
                <div className="home-hero-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link
                    href={slide.ctaUrl || "/catalogue"}
                    tabIndex={isActive ? 0 : -1}
                    className="btn-plum"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "15px 30px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      transition: "background .25s,transform .25s",
                    }}
                  >
                    {slide.cta}
                  </Link>
                  {slide.secondaryCta && slide.secondaryCtaUrl && (
                    <Link
                      href={slide.secondaryCtaUrl}
                      tabIndex={isActive ? 0 : -1}
                      className="btn-outline-plum"
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "15px 30px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        transition: "background .25s,transform .25s",
                      }}
                    >
                      {slide.secondaryCta}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Controls only exist when there is something to control. A single
          configured slide gets a still image, not a carousel with two arrows
          that lead back to it. */}
      {isCarousel && (
        <>
          {/* There is deliberately no pause control here.
              One was added and then removed at the owner's explicit request,
              after the trade-off was put to them. The consequence is recorded
              rather than hidden: the carousel advances on its own every 5.5s
              with no mechanism to stop it, which fails WCAG 2.2.2 (Pause,
              Stop, Hide) at level A. Hover and keyboard focus still hold it,
              and reduced motion still switches it off entirely, but neither of
              those exists on a touch screen — so on a phone the movement
              cannot be stopped at all. Re-adding a visible control is the only
              thing that fixes it. */}
          <button
            type="button"
            onClick={() => goTo((active - 1 + heroSlides.length) % heroSlides.length)}
            aria-label="Diapositive précédente"
            className="hero-nav-btn"
            style={{
              position: "absolute",
              insetInlineStart: 18,
              top: "50%",
              transform: "translateY(-50%)",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255,255,255,.82)",
              border: "1px solid var(--pdh-plum-tint)",
              color: "var(--pdh-plum)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 4,
            }}
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            onClick={() => goTo((active + 1) % heroSlides.length)}
            aria-label="Diapositive suivante"
            className="hero-nav-btn"
            style={{
              position: "absolute",
              insetInlineEnd: 18,
              top: "50%",
              transform: "translateY(-50%)",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255,255,255,.82)",
              border: "1px solid var(--pdh-plum-tint)",
              color: "var(--pdh-plum)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 4,
            }}
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </>
      )}

      <SnowParticles density={36} opacity={0.8} />
    </section>
  );
}
