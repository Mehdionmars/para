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
  /** 0–90: how much of `bg` is laid over the photograph as a veil. */
  overlayOpacity?: number;
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

  const bgColor = copy.bg || "var(--pdh-cream)";
  const photo = copy.bgImage?.trim();
  // Artwork, not wallpaper: a background picked here is usually a composed
  // banner that already carries its own products and copy, and cropping it to
  // whatever height the text happened to need cut it in half. When the CMS
  // reports the file's dimensions the band takes that shape and shows the
  // whole picture; the copy still has its own minimum height underneath.
  const artRatio = photo && copy.bgImageWidth && copy.bgImageHeight ? copy.bgImageWidth / copy.bgImageHeight : null;
  // The veil is the band's own colour over the photograph, so the text and
  // button colours an editor already tuned against `bg` stay readable.
  const veil = Math.min(90, Math.max(0, copy.overlayOpacity ?? 55)) / 100;

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: bgColor,
        color: copy.textColor || "var(--pdh-ink)",
        padding: "clamp(48px,7vw,88px) var(--sec-pad-x)",
        marginBottom: "var(--sec-y)",
        // A ratio as a floor, not a fixed height: long copy grows the band
        // rather than spilling out of it. The image is centred in what is
        // left, so it is never stretched either.
        ...(artRatio ? { minHeight: `min(${100 / artRatio}vw, 62vh)` } : {}),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {photo && (
        <>
          <CloudinaryImage
            preset={artRatio ? "marketing" : "hero"}
            src={photo}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: artRatio ? "contain" : "cover" }}
          />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: bgColor, opacity: veil }} />
        </>
      )}
      <div
        style={{
          position: "relative",
          maxWidth: "min(40em,100%)",
          margin: "0 auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(12px,1.6vw,18px)",
        }}
      >
        {copy.title?.trim() && <h2 className="sec-title sec-title--feature">{copy.title}</h2>}

        {copy.description?.trim() && (
          /* The one place --fs-body earns its size over --fs-deck: this is a
             centred invitation the visitor is meant to read, not a caption
             introducing a rail. `text-wrap: pretty` stays — it is the last
             line of a centred paragraph that a widow would spoil. */
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
    </section>
  );
}
