"use client";

import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { DEFAULT_CATEGORY_CHIPS } from "@/lib/storefront/categoryStripDefaults";
import { routes } from "@/lib/routes";
import { hasProductsBehind } from "@/lib/storefront/shopTaxonomy";
import type { Category } from "@/data/products";
import type { MobileCategoryStrip as StripConfig } from "@/lib/storefront/siteChromeContent";

/** A configured chip, plus the synthetic "Tout" entry this file prepends. */
type Tile = StripConfig["items"][number] & { isAll?: boolean };

/**
 * The category browser that opens the home page, above the hero.
 *
 * ## Shape
 *
 * One row of circular cards with the label beneath each — the pattern a
 * shopper scans rather than reads. It is centred while the aisles fit and
 * scrolls sideways once they do not, so four chips and eleven chips both
 * look deliberate.
 *
 * This used to wrap, on the argument that a scroller hides what does not
 * fit behind an affordance people miss. What wrapping actually produced on
 * a phone was five aisles and a sixth stranded alone on a second row, which
 * reads as a mistake rather than as a continuation — and a tile cut in half
 * at the right edge says "there is more" more plainly than that ever did.
 *
 * The layout is in globals.css (.cat-tiles-row), where `justify-content:
 * safe center` is what lets one rule do both: plain `center` on a scroller
 * that overflows puts the first chip off the left edge, unreachable.
 *
 * ## Only while there is no menu bar
 *
 * It was shown at every width for a while, on the reasoning that a row of
 * photographs is a different instrument from a text menu: it sells the range
 * where the menu only lists it. That duplication is no longer wanted, so
 * `.cat-tiles` is hidden from 1024px up — the width at which `.nav-desktop`
 * stops being `display: none` and takes the job over.
 *
 * The cut is at 1024 rather than the 767px this project usually calls mobile
 * because the menu bar does not appear at 768: a tablet hidden at 767 would
 * have had neither navigation on screen. See globals.css `.cat-tiles`.
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
export function CategoryTiles({
  strip,
  categoryCounts,
}: {
  strip: StripConfig;
  /** How many products each broad category holds. Omitted (or empty) means
   * "unknown", and every chip is shown — see hasProductsBehind. */
  categoryCounts?: Map<Category, number>;
}) {
  const scroller = useRef<HTMLUListElement>(null);

  // An unconfigured strip falls back to the default aisles rather than
  // rendering nothing: the shop should ship with its sections reachable.
  const configured = strip.enabled && strip.items.length > 0;
  const items = configured ? strip.items : DEFAULT_CATEGORY_CHIPS;

  const all: Tile[] =
    configured && strip.showAllChip
      ? [{ href: routes.catalogue(), label: strip.allChipLabel, isAll: true }, ...items]
      : items;

  // A chip pointing at a shelf with nothing on it is worse than a missing
  // chip. Measured on the live shop: three of the six tiles rendered here
  // lead to "0 produits" — Bébé & Maman, Maquillage, Compléments — because
  // five of the nine broad categories have no published product behind them.
  // For a first-time visitor deciding whether this is a real parapharmacie,
  // a coin-flip chance of landing on an empty page is the most expensive
  // thing on the page.
  //
  // Only a *known* empty category is dropped: an aisle link, a brand link or
  // a category whose count could not be fetched all stay, so a failed facets
  // request degrades to today's behaviour instead of blanking the browser.
  const counts = categoryCounts ?? new Map<Category, number>();
  const tiles = all.filter((tile) => tile.isAll || hasProductsBehind(tile.href, counts));

  if (tiles.length === 0) return null;

  // Two rows only once there are enough chips to fill them. Four chips laid
  // out two-and-two reads as a broken grid; four chips in a line reads as a
  // menu, which is what it is.
  const rows = tiles.length >= 8 ? 2 : 1;

  function page(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ behavior: "smooth", left: direction * el.clientWidth * 0.8 });
  }

  return (
    <nav aria-label="Catégories" className="cat-tiles" data-rows={rows}>
      <button aria-label="Catégories précédentes" className="cat-tiles-nav" onClick={() => page(-1)} type="button">
        <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.8} />
      </button>
      <ul className="cat-tiles-row" ref={scroller}>
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
      <button aria-label="Catégories suivantes" className="cat-tiles-nav" onClick={() => page(1)} type="button">
        <ChevronRight aria-hidden="true" size={18} strokeWidth={1.8} />
      </button>
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
