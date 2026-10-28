"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import type { MARKETING_BANNERS } from "@/data/home";
import { usePageVisible, useReducedMotion } from "@/hooks/use-motion-preferences";
import {
  type CardLayoutOptions,
  framingToObjectPosition,
  toCtaAlign,
} from "@/lib/storefront/cardLayout";

const AUTOPLAY_MS = 6000;

// Only used before a picture's real dimensions are known (the offline
// snapshot does not carry them). They reserve a plausible box; once the file
// arrives the slide takes the picture's own shape whatever these say.
const FALLBACK_DESKTOP = { width: 1920, height: 800 };
const FALLBACK_MOBILE = { width: 1080, height: 1350 };

// data/home.ts is generated from the CMS and must not be hand-edited, so the
// layout options and the artwork's dimensions are declared here as optional
// additions to the generated shape. Optional means a banner from either
// source — the live CMS or the snapshot — still satisfies this type. The
// dimension keys are omitted from the generated shape first: a snapshot synced
// from a CMS that knows them types them as required numbers.
type ArtworkSizeKey = "imgWidth" | "imgHeight" | "imgMobileWidth" | "imgMobileHeight";
export type MarketingBannerData = Omit<(typeof MARKETING_BANNERS)[number], ArtworkSizeKey> &
  CardLayoutOptions & {
    /** Each picture's own dimensions, supplied by the live CMS. They let the
     * browser reserve the slide's height before the file has loaded. */
    imgWidth?: number;
    imgHeight?: number;
    imgMobileWidth?: number;
    imgMobileHeight?: number;
  };

/**
 * The campaign banners, as a carousel across the full width of the page.
 *
 * Every live campaign is a slide; which ones are live (Active, inside their
 * date window) is decided upstream in page.tsx. A slide is as tall as its
 * picture is at the page's width: nothing is cropped to a fixed ratio, so
 * artwork with its offer and copy baked in arrives whole. The row is as tall
 * as its tallest slide, so banners of one format sit flush.
 *
 * The row is a native horizontal scroller with snap points rather than a
 * transformed track. A finger swipes it, a trackpad scrolls it, and the
 * arrows, the dots and the timer all move that same scroll position. The
 * current slide is read back from the position, so the dots can never
 * disagree with what is on screen.
 */
export function MarketingCarousel({
  banners,
  label = "Campagnes en cours",
}: {
  banners: MarketingBannerData[];
  /** Names the section for assistive technology. */
  label?: string;
}) {
  const slides = banners.filter((banner) => banner.img);
  const count = slides.length;
  const isCarousel = count > 1;

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  /** Transient: the pointer is over the banner, or focus is inside it.
   * Changing the slide under a visitor who is reading it is what makes
   * carousels hostile. */
  const [engaged, setEngaged] = useState(false);
  /** The section is on screen, or about to be. The homepage puts it well down
   * the page: rotating it unseen would land the visitor on whichever slide the
   * timer reached, and on a picture the browser had no reason to fetch yet. */
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  const autoplaying = isCarousel && inView && !reducedMotion && !engaged && pageVisible;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !isCarousel) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [isCarousel]);

  const syncActive = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }, []);

  const show = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const target = ((index % count) + count) % count;
      track.scrollTo({ left: target * track.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [count, reducedMotion],
  );

  // A timeout per slide rather than one interval: any change of slide, the
  // visitor's own included, restarts the full delay before the next one.
  useEffect(() => {
    if (!autoplaying) return;
    const id = setTimeout(() => show(active + 1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [autoplaying, active, show]);

  if (count === 0) return null;

  return (
    <section
      aria-label={label}
      aria-roledescription={isCarousel ? "carousel" : undefined}
      className="mkt-carousel"
      // Mouse, not pointer: pointerenter fires on touch and would leave the
      // carousel paused after a tap on a phone. Focus covers the keyboard.
      onBlur={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      ref={sectionRef}
    >
      <div className="mkt-carousel-stage">
        <div className="mkt-carousel-track" onScroll={isCarousel ? syncActive : undefined} ref={trackRef}>
          {slides.map((banner, i) => (
            <div
              key={`${banner.campaign}-${i}`}
              aria-label={isCarousel ? `${i + 1} sur ${count}` : undefined}
              aria-roledescription={isCarousel ? "slide" : undefined}
              className="mkt-slide"
              // Off-screen slides keep their links out of the tab order.
              inert={i !== active}
              role={isCarousel ? "group" : undefined}
            >
              {/* The slide on screen and the one after it load as soon as the
                  section comes near; the rest wait for their turn. */}
              <BannerSlide banner={banner} eager={inView && (i === active || i === (active + 1) % count)} />
            </div>
          ))}
        </div>

        {isCarousel && (
          <>
            <button
              aria-label="Campagne précédente"
              className="mkt-carousel-arrow mkt-carousel-arrow--prev"
              onClick={() => show(active - 1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
            <button
              aria-label="Campagne suivante"
              className="mkt-carousel-arrow mkt-carousel-arrow--next"
              onClick={() => show(active + 1)}
              type="button"
            >
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {isCarousel && (
        // The hero's dots, so the page has one way of saying "there is more".
        <div className="pdh-hero-dots">
          {slides.map((banner, i) => (
            <button
              key={`${banner.campaign}-${i}`}
              aria-current={i === active}
              aria-label={`Afficher la campagne ${i + 1} sur ${count}`}
              className="pdh-hero-dot"
              onClick={() => show(i)}
              type="button"
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BannerSlide({ banner, eager }: { banner: MarketingBannerData; eager: boolean }) {
  const href = banner.ctaUrl || "/catalogue";

  if (banner.imageMode === "imageOnly") {
    // Artwork with the offer, the products and the copy already laid out in
    // it: the whole picture is the link. It needs a real accessible name,
    // since no visible label is drawn over it.
    return (
      <Link
        aria-label={banner.ctaLabel || banner.title || banner.eyebrow || "Découvrir la sélection"}
        className="mkt-slide-frame"
        href={href}
      >
        <BannerImages alt={banner.title || banner.eyebrow || "Bannière promotionnelle"} banner={banner} eager={eager} />
        {banner.badgeLabel && <BannerBadge label={banner.badgeLabel} />}
      </Link>
    );
  }

  // The scrim exists to carry the copy's contrast. A banner saved in overlay
  // mode with no title, text or button has no copy, and the scrim was then
  // only a dark band across the bottom of the picture.
  const hasCopy = Boolean(banner.title || banner.description || banner.ctaLabel);

  return (
    <div className="mkt-slide-frame mkt-slide-frame--overlay">
      <BannerImages
        alt=""
        banner={banner}
        eager={eager}
        objectPosition={framingToObjectPosition(banner.imageFraming)}
      />
      {hasCopy && <div aria-hidden="true" className="scrim-bottom" style={{ position: "absolute", inset: 0 }} />}
      {banner.badgeLabel && <BannerBadge label={banner.badgeLabel} />}

      {hasCopy && (
        <div className="overlay-card-content mkt-slide-copy">
          {banner.title && <h2 className="overlay-card-title overlay-card-title--feature">{banner.title}</h2>}
          {banner.description && (
            /* The one overlay text that is not tinted from cream: this
               banner's copy is #fff on an editor-chosen photograph, and the
               scrim behind it is what carries the contrast. */
            <p className="overlay-card-text" style={{ color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
              {banner.description}
            </p>
          )}
          {banner.ctaLabel && (
            <div className="overlay-card-actions" data-cta-align={toCtaAlign(banner.ctaAlign)}>
              <Link
                className="btn-plum overlay-card-cta"
                href={href}
                style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
              >
                {banner.ctaLabel}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The picture at the full width of the page and at its own height.
 *
 * `crop="limit"` asks Cloudinary for the file scaled down to the requested
 * width, never cropped and never enlarged, which is what lets the slide take
 * the picture's shape. Art direction is CSS (the desktop picture is hidden
 * under 768px when a phone version exists, and the other way round), and a
 * hidden <img> is still fetched, so the variant not in use is declared 1px
 * wide to cost a thumbnail.
 */
function BannerImages({
  alt,
  banner,
  eager,
  objectPosition,
}: {
  alt: string;
  banner: MarketingBannerData;
  eager: boolean;
  objectPosition?: string;
}) {
  const hasMobile = Boolean(banner.imgMobile);
  const style = objectPosition ? { objectPosition } : undefined;
  const loading = eager ? "eager" : "lazy";

  return (
    <>
      <CloudinaryImage
        alt={alt}
        className={hasMobile ? "mkt-slide-img mkt-slide-img--desktop" : "mkt-slide-img"}
        crop="limit"
        height={banner.imgHeight || FALLBACK_DESKTOP.height}
        loading={loading}
        sizes={hasMobile ? "(max-width: 767px) 1px, 100vw" : "100vw"}
        src={banner.img}
        style={style}
        width={banner.imgWidth || FALLBACK_DESKTOP.width}
      />
      {hasMobile && (
        <CloudinaryImage
          alt={alt}
          className="mkt-slide-img mkt-slide-img--mobile"
          crop="limit"
          height={banner.imgMobileHeight || FALLBACK_MOBILE.height}
          loading={loading}
          sizes="(max-width: 767px) 100vw, 1px"
          src={banner.imgMobile}
          style={style}
          width={banner.imgMobileWidth || FALLBACK_MOBILE.width}
        />
      )}
    </>
  );
}

function BannerBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        position: "absolute",
        top: "clamp(14px,2vw,20px)",
        insetInlineEnd: "clamp(14px,2vw,20px)",
        zIndex: 2,
        background: "var(--pdh-sale-strong)",
        color: "#fff",
        fontFamily: "var(--font-poppins)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".04em",
        padding: "6px 14px",
        borderRadius: 999,
      }}
    >
      {label}
    </span>
  );
}
