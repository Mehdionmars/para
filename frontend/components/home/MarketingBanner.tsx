import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { MARKETING_BANNERS } from "@/data/home";
import {
  type CardLayoutOptions,
  framingToObjectPosition,
  toCtaAlign,
} from "@/lib/storefront/cardLayout";

// data/home.ts is generated from the CMS and must not be hand-edited, so the
// two layout options are declared here as optional additions to the
// generated shape. Optional means a banner from either source — the live CMS
// or the snapshot — still satisfies this type with nothing to change.
export type MarketingBannerData = (typeof MARKETING_BANNERS)[number] &
  CardLayoutOptions & {
    /** The artwork's own dimensions, supplied by the live CMS. The offline
     * snapshot in data/home.ts predates them, hence optional. */
    imgWidth?: number;
    imgHeight?: number;
  };

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
  // Both default to the value that reproduces what this banner already
  // rendered, so a campaign saved before these controls existed is
  // untouched: the button on the left, the photograph centred in its crop.
  const ctaAlign = toCtaAlign(banner.ctaAlign);
  const objectPosition = framingToObjectPosition(banner.imageFraming);

  // `undefined` leaves .marketing-banner's own aspect-ratio in charge.
  const artRatio =
    imageOnly && banner.imgWidth && banner.imgHeight ? `${banner.imgWidth} / ${banner.imgHeight}` : undefined;

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
      {imageOnly ? (
        // An imageOnly banner is artwork with the offer, the products and the
        // copy already laid out inside it. .marketing-banner's fixed ratio —
        // 21:9 on desktop, 4:5 on phones — plus object-fit: cover then crops
        // that artwork to fit, which cuts the message in half: a 2.2:1 banner
        // in a 4:5 frame keeps about a third of its width.
        //
        // Nothing to crop once the frame takes the picture's own shape. The
        // stylesheet ratio stays as the fallback for a banner whose media
        // document did not resolve.
        <Link
          href={href}
          aria-label={wholeTileLabel}
          className="marketing-banner"
          style={{ display: "block", aspectRatio: artRatio }}
        >
          <BannerImage banner={banner} alt={altText} fit={artRatio ? "contain" : "cover"} objectPosition={objectPosition} />
          {banner.badgeLabel && <BannerBadge label={banner.badgeLabel} />}
        </Link>
      ) : (
        <div className="marketing-banner" style={{ display: "flex", alignItems: "flex-end" }}>
          <BannerImage banner={banner} alt="" fit="cover" objectPosition={objectPosition} />
          <div className="scrim-bottom" aria-hidden="true" style={{ position: "absolute", inset: 0 }} />
          {banner.badgeLabel && <BannerBadge label={banner.badgeLabel} />}

          <div className="overlay-card-content" style={{ position: "relative", zIndex: 2, padding: "clamp(24px,3.6vw,48px)", maxWidth: 560, color: "#fff" }}>
            {banner.title && (
              <h2 className="overlay-card-title overlay-card-title--feature">{banner.title}</h2>
            )}
            {banner.description && (
              /* The one overlay text that is not tinted from cream: this
                 banner's copy is #fff on an editor-chosen photograph, and
                 the scrim behind it is what carries the contrast. */
              <p className="overlay-card-text" style={{ color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
                {banner.description}
              </p>
            )}
            {banner.ctaLabel && (
              <div className="overlay-card-actions" data-cta-align={ctaAlign}>
                <Link
                  href={href}
                  className="btn-plum overlay-card-cta"
                  style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
                >
                  {banner.ctaLabel}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Cropping is right for a photograph the copy sits *on top of*, and wrong
 * for artwork the copy is baked *into*. */
function BannerImage({
  banner,
  alt,
  objectPosition,
  fit,
}: {
  fit: "cover" | "contain";
  banner: MarketingBannerData;
  alt: string;
  objectPosition: string;
}) {
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
        style={{ objectFit: fit, objectPosition }}
      />
      {banner.imgMobile && (
        <CloudinaryImage
          preset="marketing"
          src={banner.imgMobile}
          alt={alt}
          fill
          sizes="100vw"
          className="hero-mobile-img"
          style={{ objectFit: fit, objectPosition }}
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
