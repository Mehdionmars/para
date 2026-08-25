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
      style={{
        maxWidth: "min(1280px,100%)",
        margin: "0 auto",
        padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
        gap: "clamp(14px,2vw,24px)",
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
          <div className="overlay-card-scrim" aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(47,31,61,.55),transparent 62%)" }} />
          <div className="overlay-card-content" style={{ position: "relative", zIndex: 3, padding: 32, color: "var(--pdh-cream)", maxWidth: "min(320px,56%)" }}>
            <div className="overlay-card-eyebrow" style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.85 }}>
              {tile.eyebrow}
            </div>
            <div className="overlay-card-title" style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(23px,2.8vw,32px)", lineHeight: 1.1, margin: "8px 0 16px" }}>
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
