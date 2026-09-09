import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import {
  type CardLayoutOptions,
  framingToObjectPosition,
  toCtaAlign,
} from "@/lib/storefront/cardLayout";

export type CtaTile = { eyebrow: string; title: string; bg: string; img: string } & CardLayoutOptions;

/** Two-up promotional tiles linking to the catalogue. Used twice on the home page. */
export function CtaPair({ tiles, height }: { tiles: CtaTile[]; height: number }) {
  return (
    <section
      className="cta-pair-grid"
      style={{
        maxWidth: "min(1280px,100%)",
        margin: "0 auto",
        padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))",
        // `display`, the columns and the gap all live in globals.css
        // (.cta-pair-grid). `display` moved there when the section had to be
        // hidden on phones: an inline `display: grid` outranks any stylesheet
        // rule short of !important, so the media query could not turn it off.
      }}
    >
      {tiles.map((tile) => (
        <Link
          key={tile.title}
          href="/catalogue"
          className="tile-hover overlay-card-tile"
          style={{
            position: "relative",
            height,
            borderRadius: 20,
            overflow: "hidden",
            background: tile.bg,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <CloudinaryImage
            preset="editorial"
            src={tile.img}
            alt=""
            fill
            sizes="620px"
            style={{ objectFit: "cover", objectPosition: framingToObjectPosition(tile.imageFraming) }}
          />
          {/* Left-to-right on desktop, where the copy sits in the left half.
              On phones the copy block spans the card, so the scrim is turned
              bottom-up in CSS to sit under it instead. */}
          <div className="overlay-card-scrim scrim-side" aria-hidden="true" style={{ position: "absolute", inset: 0 }} />
          <div className="overlay-card-content" style={{ position: "relative", zIndex: 3, padding: 32, color: "var(--pdh-cream)", maxWidth: "min(320px,56%)" }}>
            <div className="overlay-card-title" style={{ marginBottom: 16 }}>
              {tile.title}
            </div>
            {/* The tile itself is the link, so this stays a <span>: a real
                <a> here would nest one control inside another. */}
            <div className="overlay-card-actions" data-cta-align={toCtaAlign(tile.ctaAlign)}>
              <span className="btn-plum overlay-card-cta" style={{ display: "inline-block", padding: "11px 24px", fontSize: 11.5, textTransform: "uppercase" }}>
                Découvrir
              </span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}
