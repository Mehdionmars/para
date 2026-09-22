import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";

export type CtaBannerCopy = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  bg: string;
  /** Optional photograph behind the band. */
  bgImage?: string;
  /** Its own dimensions. With them the band takes the picture's shape rather
   * than cropping it to a height of its own choosing. */
  bgImageWidth?: number;
  bgImageHeight?: number;
  textColor: string;
  ctaColor: string;
};

/**
 * A centred call to action: one headline, one supporting line, one button.
 *
 * Everything here serves the single decision. The column is capped near 40em
 * so the headline breaks into two or three lines a reader takes in at a
 * glance rather than one they scan across; the description is given lower
 * contrast so the eye lands on the title first and the button last; and there
 * is no second action, because a choice between two buttons is a slower
 * decision than a choice about one.
 *
 * Rendered as a full-bleed band rather than a rounded card: the block earns
 * its interruption by being unmissable, and a card floating in the page reads
 * as one more tile.
 */
export function CtaBanner({ copy }: { copy: CtaBannerCopy }) {
  const label = copy.ctaLabel?.trim();
  const href = copy.ctaUrl?.trim() || "/catalogue";

  // A CTA band with no headline and no button is an empty coloured stripe.
  // Hiding the section beats rendering the stripe: an editor who has cleared
  // the fields has effectively turned it off.
  if (!copy.title?.trim() && !label) return null;

  const photo = copy.bgImage?.trim();
  // Whether an editor wrote anything beside the picture.
  //
  // This decides the whole layout, because the two cases are different kinds
  // of block. With a headline and a line of copy, the picture illustrates an
  // argument and belongs beside it. Without them, the picture *is* the
  // argument: what is uploaded is composed artwork with its own eyebrow,
  // headline, product shots and button already laid out inside the file.
  const hasCopy = Boolean(copy.title?.trim() || copy.description?.trim());

  // The picture sits beside the copy, in its own frame at its own shape.
  //
  // It was a background first: composed artwork, cropped to whatever height
  // the text needed, with the headline landing on top of the headline already
  // inside the picture. Whole and beside the text, nothing is cut and nothing
  // overlaps. The CMS reports the file's dimensions; 4:3 is the fallback for a
  // media document that did not resolve.
  const artRatio = photo && copy.bgImageWidth && copy.bgImageHeight ? `${copy.bgImageWidth} / ${copy.bgImageHeight}` : "4 / 3";

  const copyBlock = (
    <div className="cta-band-copy">
      {copy.title?.trim() && <h2 className="sec-title sec-title--feature">{copy.title}</h2>}

      {copy.description?.trim() && (
        /* The one place --fs-body earns its size over --fs-deck: this is an
           invitation the visitor is meant to read, not a caption introducing a
           rail. `text-wrap: pretty` stays — it is the last line of a paragraph
           that a widow would spoil. */
        <p className="sec-deck" style={{ fontSize: "var(--fs-body)", margin: 0, maxWidth: "34em", textWrap: "pretty" }}>
          {copy.description}
        </p>
      )}

      {label && (
        <Link
          href={href}
          style={{
            marginTop: "clamp(6px,1vw,12px)",
            display: "inline-block",
            background: copy.ctaColor || "var(--pdh-plum)",
            color: "#FFFFFF",
            padding: "14px 34px",
            borderRadius: 999,
            fontFamily: "var(--font-poppins)",
            fontSize: 12,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          {label}
        </Link>
      )}
    </div>
  );

  // Artwork with no copy beside it: full width, at the picture's own shape.
  //
  // In the two-column grid below, this artwork was handed half the band and
  // the other half stood empty except for the button — a composed summer
  // banner, reduced to a tile, next to a cream void. It is the same mistake
  // MarketingBanner's `imageOnly` mode already exists to avoid: copy baked
  // into a picture must not be cropped to a frame chosen for it, and must not
  // be shrunk to sit beside a headline that was never written.
  //
  // `contain` with the file's own ratio is a no-op on the pixels; it is there
  // so a media document whose dimensions did not resolve letterboxes inside
  // the fallback ratio instead of being cropped by it.
  if (photo && !hasCopy) {
    const linkLabel = label || copy.eyebrow?.trim() || "Découvrir la sélection";

    return (
      <section
        style={{
          background: copy.bg || "var(--pdh-cream)",
          color: copy.textColor || "var(--pdh-ink)",
          padding: "clamp(28px,4vw,56px) var(--sec-pad-x)",
          marginBottom: "var(--sec-y)",
        }}
      >
        <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto" }}>
          <Link
            href={href}
            aria-label={linkLabel}
            style={{
              position: "relative",
              display: "block",
              width: "100%",
              aspectRatio: artRatio,
              overflow: "hidden",
              borderRadius: "clamp(14px,2vw,24px)",
            }}
          >
            {/* Decorative: the link's aria-label names the destination, and
                every word in the picture is drawn, not readable. */}
            <CloudinaryImage
              preset="editorial"
              src={photo}
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          </Link>

          {/* Kept, and below the artwork rather than removed: the picture
              carries its own drawn button, but this one is the real link and
              the only one a keyboard or a screen reader can reach. */}
          {label && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(18px,2.4vw,28px)" }}>
              <Link
                href={href}
                style={{
                  display: "inline-block",
                  background: copy.ctaColor || "var(--pdh-plum)",
                  color: "#FFFFFF",
                  padding: "14px 34px",
                  borderRadius: 999,
                  fontFamily: "var(--font-poppins)",
                  fontSize: 12,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        background: copy.bg || "var(--pdh-cream)",
        color: copy.textColor || "var(--pdh-ink)",
        padding: "clamp(48px,7vw,88px) var(--sec-pad-x)",
        marginBottom: "var(--sec-y)",
      }}
    >
      {photo ? (
        <div className="cta-band-grid">
          {copyBlock}
          <span className="cta-band-media" style={{ aspectRatio: artRatio }}>
            {/* Decorative: the heading beside it already says what this is. */}
            <CloudinaryImage preset="editorial" src={photo} alt="" fill sizes="(max-width: 767px) 92vw, 46vw" style={{ objectFit: "cover" }} />
          </span>
        </div>
      ) : (
        copyBlock
      )}
    </section>
  );
}
