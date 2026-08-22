import { navBadgeColors } from "@/lib/navStyle";
import type { NavItem } from "@/data/nav";

/**
 * A nav item's visible label plus its optional badge pill.
 *
 * Exists so the desktop navbar and the mobile drawer render the badge
 * identically — the drawer previously showed no badge at all, which meant a
 * "Nouveau"/"-40%" pill configured in Payload silently disappeared on
 * phones, where most of this storefront's traffic is.
 */
// Minimal structural shape rather than NavItem: mega-menu links carry the
// same label + badge and must render through this one component.
export function NavItemLabel({
  item,
  badgeScale = 1,
}: {
  item: Pick<NavItem, "label" | "badge">;
  badgeScale?: number;
}) {
  return (
    <>
      {item.label}
      {item.badge && (
        <span
          style={{
            marginLeft: 7,
            padding: `${2 * badgeScale}px ${7 * badgeScale}px`,
            borderRadius: 999,
            fontSize: 9.5 * badgeScale,
            fontWeight: 600,
            letterSpacing: ".04em",
            verticalAlign: "middle",
            whiteSpace: "nowrap",
            ...navBadgeColors(item.badge),
          }}
        >
          {item.badge.label}
        </span>
      )}
    </>
  );
}
