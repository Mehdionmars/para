import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import {
  type CardLayoutOptions,
  framingToObjectPosition,
  toCtaAlign,
} from "@/lib/storefront/cardLayout";

export type CtaTile = { eyebrow: string; title: string; bg: string; img: string } & CardLayoutOptions;

/**
 * Promotional tiles linking to the catalogue.
 *
 * ## Two, or a mosaic
 *
 * It was strictly two-up. The CMS field behind it has always been a plain
 * `array` with no row cap — "exactly 2 tiles" was only ever the admin
 * description — so an editor could already store five and get five squeezed
 * into a two-column grid.
 *
 * Now the layout follows the count. Two or three tiles keep the row they had.
 * Four or more become a mosaic: pairs, with every third tile running the full
 * width, which is what gives the block its rhythm instead of a uniform grid
 * of equal rectangles. Nothing about the data changed and no migration was
 * needed — an editor adds a tile in the Storefront Builder and the
 * arrangement follows.
 *
 * `height` becomes a floor rather than a fixed value in mosaic mode: a
 * full-width tile at a card's height is a letterbox, so the wide ones are
 * given room in CSS and the prop sets the minimum for the paired ones.
 */
export function CtaPair({ tiles, height }: { tiles: CtaTile[]; height: number }) {
  const mosaic = tiles.length >= 4;

  return (
    <section
      className={mosaic ? "cta-pair-grid cta-mosaic" : "cta-pair-grid"}
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
      {tiles.map((tile, i) => {
        // Every third tile spans both columns. Counting from the third rather
        // than the first is what produces 2-2-1 for five tiles — the shape the
        // reference uses — instead of leading with the wide one and burying
        // the pairs under it.
        const wide = mosaic && (i + 1) % 3 === 0;

        return (
        <Link
          key={tile.title}
          href="/catalogue"
          data-wide={wide ? "true" : undefined}
          className="tile-hover overlay-card-tile"
          style={{
            position: "relative",
            // Left to the stylesheet on a wide tile, and this is the whole
            // reason the branch exists: an inline `minHeight` outranks any
            // rule short of !important, so `[data-wide] { min-height: ... }`
            // never applied. Measured before the fix — the wide tile came out
            // 280px on desktop where the rule asks for 340, and on a phone the
            // inline 150 let its own copy push it to 463, twice its
            // neighbours. Same trap as .cta-pair-grid's `display` above.
            minHeight: wide ? undefined : height,
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
            <div className="overlay-card-eyebrow" style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.85 }}>
              {tile.eyebrow}
            </div>
            <div className="overlay-card-title" style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(23px,2.8vw,32px)", lineHeight: 1.1, margin: "8px 0 16px" }}>
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
        );
      })}
    </section>
  );
}
