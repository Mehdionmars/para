import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { MARKETING_BANNERS } from "@/data/home";

export type MarketingBannerData = (typeof MARKETING_BANNERS)[number];

/** Full-width seasonal/campaign banner between the hero and the product
 * rails — one CMS entry per campaign (été, Black Friday, Noël...); the
 * active one is picked upstream in page.tsx (see pickActiveMarketingBanner)
 * and passed in here already resolved, so this component only ever renders
 * a single banner and stays uninvolved in the active/date-window logic. */
export function MarketingBanner({ banner }: { banner?: MarketingBannerData }) {
  if (!banner || !banner.img) return null;

  const imageOnly = banner.imageMode === "imageOnly";
  const href = banner.ctaUrl || "/catalogue";
  // imageOnly banners have their copy baked into the photo, so the whole
  // tile is one link — needs a real accessible name since no visible CTA
  // text is drawn over it.
  const wholeTileLabel = imageOnly ? banner.ctaLabel || banner.title || banner.eyebrow || "Découvrir la sélection" : undefined;
  const altText = banner.title || banner.eyebrow || "Bannière promotionnelle";

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      {imageOnly ? (
        <Link href={href} aria-label={wholeTileLabel} className="marketing-banner" style={{ display: "block" }}>
          <BannerImage banner={banner} alt={altText} />
          {banner.badgeLabel && <BannerBadge label={banner.badgeLabel} />}
        </Link>
      ) : (
        <div className="marketing-banner" style={{ display: "flex", alignItems: "flex-end" }}>
          <BannerImage banner={banner} alt="" />
          <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(30,20,14,.6) 0%,rgba(30,20,14,.15) 45%,transparent 70%)" }}
          />
          {banner.badgeLabel && <BannerBadge label={banner.badgeLabel} />}

          <div style={{ position: "relative", zIndex: 2, padding: "clamp(24px,3.6vw,48px)", maxWidth: 560, color: "#fff" }}>
            {banner.eyebrow && (
              <div style={{ fontFamily: "var(--font-raleway)", fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.9, marginBottom: 10 }}>
                {banner.eyebrow}
              </div>
            )}
            {banner.title && (
              <h2
                style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(28px,4vw,44px)", lineHeight: 1.08, margin: "0 0 14px", letterSpacing: "-.01em" }}
              >
                {banner.title}
              </h2>
            )}
            {banner.description && (
              <p className="marketing-banner-description" style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.92, margin: "0 0 22px", maxWidth: 460 }}>
                {banner.description}
              </p>
            )}
            {banner.ctaLabel && (
              <Link
                href={href}
                className="btn-plum"
                style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
              >
                {banner.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function BannerImage({ banner, alt }: { banner: MarketingBannerData; alt: string }) {
  // No `priority`: unlike the hero carousel (always the first, guaranteed
  // above-the-fold element), this section's position is CMS-configurable —
  // marking both the desktop and mobile variant priority would preload one
  // image the CSS breakpoint hides no matter the viewport, competing with
  // the hero's own priority images for the browser's early-preload budget
  // for a section that may not even be above the fold.
  return (
    <>
      <CloudinaryImage preset="marketing"
        src={banner.img}
        alt={alt}
        fill
        sizes="(max-width: 767px) 100vw, 1280px"
        className={banner.imgMobile ? "hero-desktop-img" : undefined}
        style={{ objectFit: "cover" }}
      />
      {banner.imgMobile && <CloudinaryImage preset="marketing" src={banner.imgMobile} alt={alt} fill sizes="100vw" className="hero-mobile-img" style={{ objectFit: "cover" }} />}
    </>
  );
}

function BannerBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        position: "absolute",
        top: "clamp(14px,2vw,20px)",
        right: "clamp(14px,2vw,20px)",
        zIndex: 2,
        background: "var(--pdh-sale)",
        color: "#fff",
        fontFamily: "var(--font-raleway)",
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
