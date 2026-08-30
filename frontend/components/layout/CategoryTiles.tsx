import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { DEFAULT_CATEGORY_CHIPS } from "@/lib/storefront/categoryStripDefaults";
import { routes } from "@/lib/routes";
import type { MobileCategoryStrip as StripConfig } from "@/lib/storefront/siteChromeContent";

/** A configured chip, plus the synthetic "Tout" entry this file prepends. */
type Tile = StripConfig["items"][number] & { isAll?: boolean };

/**
 * The category browser that opens the home page, above the hero.
 *
 * ## Shape
 *
 * A wrapping, centred row of circular cards with the label beneath each —
 * the pattern a shopper scans rather than reads. It wraps instead of
 * scrolling horizontally: a scroller hides whatever does not fit behind an
 * affordance people miss, and the whole point here is that every aisle is
 * visible at a glance. Centring means four chips and eleven chips both look
 * deliberate, with no empty grid tracks trailing off to the right.
 *
 * ## Every width, now
 *
 * This used to be phones-only, on the reasoning that the main menu already
 * carries the same links from tablet up. It is shown everywhere now because
 * a row of photographs is a different instrument from a text menu: it sells
 * the range, where the menu only lists it. The duplication is deliberate.
 *
 * ## The circle always has something in it
 *
 * In priority: the chip's own image, then the grid mark for "Tout", then a
 * monogram taken from the label. The monogram matters — no product image is
 * ever invented to fill a gap, and nothing in this project can supply one
 * automatically: chips point at routes rather than at a category or brand
 * record, `Categories` carries no image (only an unused icon name), and the
 * merchant may not have uploaded anything yet. A letter drawn from the label
 * is real data; a stock photograph standing in for "Solaire" would not be.
 */
export function CategoryTiles({ strip }: { strip: StripConfig }) {
  // An unconfigured strip falls back to the default aisles rather than
  // rendering nothing: the shop should ship with its sections reachable.
  const configured = strip.enabled && strip.items.length > 0;
  const items = configured ? strip.items : DEFAULT_CATEGORY_CHIPS;

  const tiles: Tile[] =
    configured && strip.showAllChip
      ? [{ href: routes.catalogue(), label: strip.allChipLabel, isAll: true }, ...items]
      : items;

  if (tiles.length === 0) return null;

  return (
    <nav aria-label="Catégories" className="cat-tiles">
      <ul className="cat-tiles-row">
        {tiles.map((tile) => (
          <li key={`${tile.label}-${tile.href}`}>
            <Link className="cat-tile" href={tile.href}>
              <span className="cat-tile-disc">
                {tile.image ? (
                  // Decorative: the link's own text names the destination, so
                  // announcing the picture again would only add noise.
                  <CloudinaryImage
                    alt=""
                    className="cat-tile-img"
                    fill
                    preset="productThumbnail"
                    sizes="128px"
                    src={tile.image}
                    style={{ objectFit: "cover" }}
                  />
                ) : tile.isAll ? (
                  <LayoutGrid aria-hidden="true" className="cat-tile-mark" size={24} strokeWidth={1.5} />
                ) : (
                  <span aria-hidden="true" className="cat-tile-monogram">
                    {monogram(tile.label)}
                  </span>
                )}
              </span>
              <span className="cat-tile-label">{tile.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * One or two letters from the label — "Soin visage" reads SV, "Solaire"
 * reads S. Words like "et"/"de" are skipped so "Bébé et Maman" gives BM
 * rather than BE.
 */
function monogram(label: string): string {
  const skip = new Set(["et", "de", "du", "la", "le", "les", "des", "à", "aux", "&"]);
  const words = label
    .trim()
    .split(/[\s-]+/)
    .filter((w) => w && !skip.has(w.toLowerCase()));
  if (words.length === 0) return label.trim().charAt(0).toUpperCase();
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
