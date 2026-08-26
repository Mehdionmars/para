import Link from "next/link";
import type { MobileCategoryStrip as StripConfig } from "@/lib/storefront/siteChromeContent";
import { routes } from "@/lib/routes";

/**
 * Horizontal quick-category strip, shown under the header on phones only.
 *
 * ## Why it exists
 *
 * On a phone every category lives behind the hamburger: the header is a
 * burger, a logo, a search icon and a bag, and nothing about the shop's range
 * is visible until you open a drawer. This puts the four or five destinations
 * that matter one tap away, which is the whole point — from tablet up the
 * same links are already in the main menu, so the strip is hidden rather than
 * duplicated.
 *
 * ## Server component, on purpose
 *
 * There is no state here. The chips come from Payload through the layout,
 * already resolved to hrefs, and scrolling is native overflow — nothing needs
 * a client bundle. `Link` handles prefetching as it does everywhere else.
 *
 * ## Styling
 *
 * Classes live in globals.css alongside the rest of the storefront rather
 * than as Tailwind utilities in the markup. Tailwind is available (it is
 * imported at the top of globals.css and the dashboard uses it), but no
 * storefront component uses utility classes, and the palette here has to be
 * `--pdh-*` tokens: those are re-themed at runtime from the Theme Builder, so
 * a hardcoded `bg-gray-100` would be the one chip bar in the shop that
 * ignores the merchant's chosen colours.
 */
export function MobileCategoryStrip({ strip }: { strip: StripConfig }) {
  if (!strip.enabled) return null;

  const chips = strip.showAllChip
    ? [{ href: routes.catalogue(), label: strip.allChipLabel }, ...strip.items]
    : strip.items;

  if (chips.length === 0) return null;

  return (
    <nav aria-label="Catégories rapides" className="cat-strip">
      {/* The scroller is the scrolling element and the list is its content:
          keeping them separate means the horizontal padding does not become
          part of the scrollable width, so the first chip starts flush with
          the page gutter and the last one still has room after it. */}
      <ul className="cat-strip-scroller">
        {chips.map((chip) => (
          <li key={`${chip.label}-${chip.href}`} className="cat-strip-item">
            <Link className="cat-strip-chip" href={chip.href}>
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
