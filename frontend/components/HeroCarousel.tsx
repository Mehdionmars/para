"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { HERO_SLIDES, type HeroSlide } from "@/data/home";
import { SnowParticles } from "./SnowParticles";

const AUTOPLAY_MS = 5500;

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
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  // Mirrors `active` for the autoplay interval, which needs the current
  // index without re-creating the timer on every slide change.
  const activeRef = useRef(0);

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

  const restartAutoplay = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      activate((activeRef.current + 1) % heroSlides.length);
    }, AUTOPLAY_MS);
  }, [activate, heroSlides.length]);

  useEffect(() => {
    restartAutoplay();
    return () => clearInterval(timerRef.current);
  }, [restartAutoplay]);

  function goTo(index: number) {
    activate(index);
    restartAutoplay();
  }

  return (
    <section
      className="home-hero"
      aria-roledescription="carousel"
      aria-label="Mises en avant"
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
        return (
          <div
            key={slide.title}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transition: "opacity 1s cubic-bezier(.22,1,.36,1)",
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              pointerEvents: isActive ? "auto" : "none",
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
                    transition: "transform 6s ease-out",
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
            <div
              className="home-hero-copy-wrap"
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: slide.align === "left" ? "flex-start" : "flex-end",
                padding: "0 clamp(72px,6vw,88px)",
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
                  transition: "all 1s cubic-bezier(.22,1,.36,1)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-raleway)",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    fontSize: 10.5,
                    letterSpacing: ".24em",
                    textTransform: "uppercase",
                    border: "1px solid rgba(94,64,116,.3)",
                    color: "var(--pdh-plum)",
                    padding: "6px 14px",
                    borderRadius: 999,
                  }}
                >
                  {slide.tag}
                </span>
                <Title
                  style={{
                    fontFamily: "var(--font-jost)",
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

      <button
        type="button"
        onClick={() => goTo((active - 1 + heroSlides.length) % heroSlides.length)}
        aria-label="Diapositive précédente"
        className="hero-nav-btn"
        style={{
          position: "absolute",
          left: 18,
          top: "50%",
          transform: "translateY(-50%)",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "rgba(255,255,255,.82)",
          border: "1px solid rgba(94,64,116,.14)",
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
          right: 18,
          top: "50%",
          transform: "translateY(-50%)",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "rgba(255,255,255,.82)",
          border: "1px solid rgba(94,64,116,.14)",
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

      <SnowParticles density={36} opacity={0.8} />
    </section>
  );
}
