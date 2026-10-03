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
          <Link key={tile.title || tile.img} href={tile.ctaUrl?.trim() || DEFAULT_TILE_HREF} className="tile-hover" style={{ display: "block" }}>
            <div style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 20, overflow: "hidden", background: tile.bg }}>
              <CloudinaryImage
                preset="editorial"
                src={tile.img}
                alt=""
                fill
                sizes="(max-width: 767px) 50vw, 300px"
                style={{ objectFit: "cover", objectPosition: framingToObjectPosition(tile.imageFraming) }}
              />
            </div>
            {/* Copy sits under the picture, not on it: the photograph stays
                legible and the title needs no scrim. The tile itself is the
                link, so the call to action stays a <span>. */}
            <div style={{ padding: "14px 2px 0", textAlign: toCtaAlign(tile.ctaAlign), color: "var(--pdh-ink)" }}>
              {tile.eyebrow && (
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 6 }}>
                  {tile.eyebrow}
                </div>
              )}
              <div style={{ fontFamily: "var(--font-alta)", fontWeight: 300, fontSize: "clamp(19px,1.9vw,23px)", lineHeight: 1.15, textWrap: "balance" }}>
                {tile.title}
              </div>
              <span style={{ display: "inline-block", marginTop: 10, fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pdh-plum)" }}>
                Découvrir →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
