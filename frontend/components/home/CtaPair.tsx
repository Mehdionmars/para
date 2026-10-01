import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { framingToObjectPosition, toCtaAlign, type CardLayoutOptions } from "@/lib/storefront/cardLayout";

/** `ctaUrl` is read from the live CMS ahead of the next `sync-cms`, so it is
 * optional: a tile saved before the field existed still renders, pointing at
 * the catalogue exactly as every tile did before. */
export type CtaTile = { eyebrow: string; title: string; bg: string; img: string; ctaUrl?: string } & CardLayoutOptions;

/** Where a tile leads when the CMS has no destination for it. */
const DEFAULT_TILE_HREF = "/catalogue";

/**
 * "Offres spéciales" — square picture links to products and selections.
 *
 * ## What this block used to be
 *
 * Two wide banners with `href="/catalogue"` hardcoded on both, and no heading
 * of their own: a visitor met two large pictures that could only ever lead to
 * the whole catalogue, whatever they showed. The shape said "decoration", and
 * the link confirmed it.
 *
 * ## What changed
 *
 * It is a section now, with a title, and the tiles are square. A square is
 * the shape a product photograph wants, and it is what lets the row grow: two
 * tiles or six, the arrangement holds (see .cta-square-grid, which caps each
 * track at 300px rather than letting two tiles become two 630px squares).
 *
 * Each tile carries its own destination. `ctaUrl` comes from the CMS, so an
 * editor points a tile at a product, a category or a curated selection
 * without a deploy — and until that field is migrated, every tile keeps the
 * catalogue link it already had.
 *
 * The previous four-or-more "mosaic" arrangement is gone with the rectangles
 * it was made of: its whole rhythm was pairs plus a full-width tile, which is
 * the opposite of a uniform square shelf.
 */
export function CtaPair({ tiles, title = "Offres spéciales" }: { tiles: CtaTile[]; title?: string }) {
  if (tiles.length === 0) return null;

  return (
    <section
      style={{
        maxWidth: "min(1280px,100%)",
        margin: "0 auto",
        padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))",
      }}
    >
      {/* Same heading plumbing as every other home section (PromotionsGrid,
          RailSection): .sec-title, centred, so this block reads as one of
          them rather than as a new kind of thing. */}
      <div style={{ textAlign: "center", marginBottom: "clamp(18px,2.4vw,30px)" }}>
        <h2 className="sec-title">{title}</h2>
      </div>

      <div className="cta-square-grid">
        {tiles.map((tile) => (
          <Link
            key={tile.title || tile.img}
            href={tile.ctaUrl?.trim() || DEFAULT_TILE_HREF}
            className="tile-hover overlay-card-tile"
            style={{
              position: "relative",
              // Square, and no minHeight: the ratio is what makes every tile
              // in the row the same size no matter how much copy it carries.
              aspectRatio: "1 / 1",
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
              sizes="(max-width: 767px) 50vw, 300px"
              style={{ objectFit: "cover", objectPosition: framingToObjectPosition(tile.imageFraming) }}
            />
            {/* Bottom-up, not side-on: the copy sits across the foot of a
                square instead of in its left half, so a side scrim would
                darken the wrong edge. */}
            <div className="overlay-card-scrim scrim-bottom" aria-hidden="true" style={{ position: "absolute", inset: 0 }} />
            <div
              className="overlay-card-content"
              style={{ position: "relative", zIndex: 3, padding: 22, color: "var(--pdh-cream)", width: "100%" }}
            >
              {tile.eyebrow && (
                <div
                  style={{
                    fontFamily: "var(--font-poppins)",
                    fontSize: 10,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                    opacity: 0.85,
                    marginBottom: 7,
                  }}
                >
                  {tile.eyebrow}
                </div>
              )}
              <div className="overlay-card-title" style={{ marginBottom: 14 }}>
                {tile.title}
              </div>
              {/* The tile itself is the link, so this stays a <span>: a real
                  <a> here would nest one control inside another. */}
              <div className="overlay-card-actions" data-cta-align={toCtaAlign(tile.ctaAlign)}>
                <span
                  className="btn-plum overlay-card-cta"
                  style={{ display: "inline-block", padding: "10px 22px", fontSize: 11, textTransform: "uppercase" }}
                >
                  Découvrir
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
