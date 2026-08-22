import type { CSSProperties } from "react";
import type { NavItem } from "@/data/nav";

/**
 * Turns one Payload nav item's `appearance`/`animation` config into the
 * inline CSS variables and class names the .nav-link / .nav-anim rules in
 * globals.css consume.
 *
 * Kept out of the components so the desktop navbar and the mobile drawer
 * render an item identically — the two used to duplicate their styling, and
 * that's exactly where per-item colours would have drifted apart.
 *
 * Everything is optional by design: an item with no configuration produces
 * no variables at all and falls through to the theme defaults baked into the
 * CSS fallbacks, so pre-existing navigation renders unchanged.
 */

/** CSS custom properties aren't in React's CSSProperties type. */
type StyleWithVars = CSSProperties & Record<`--${string}`, string | undefined>;

/** Anything that can be styled: a top-level nav item or a mega-menu link.
 * One shape means one implementation for both, which is what stops the two
 * surfaces from drifting apart. */
export type StyleableNavLink = Pick<NavItem, "appearance" | "animation"> & Partial<Pick<NavItem, "openInNewTab">>;

export function navItemStyle(item: StyleableNavLink): StyleWithVars {
  const a = item.appearance;
  const anim = item.animation;

  const style: StyleWithVars = {};
  if (a?.color) style["--nav-color"] = a.color;
  if (a?.hoverColor) style["--nav-hover-color"] = a.hoverColor;
  if (a?.activeColor) style["--nav-active-color"] = a.activeColor;
  if (a?.backgroundColor) style["--nav-bg"] = a.backgroundColor;
  if (a?.borderColor) style["--nav-border-color"] = a.borderColor;
  if (a?.fontWeight) style["--nav-font-weight"] = a.fontWeight;
  // Written only when set, so an item with no opacity configured inherits
  // the CSS fallback of 1 rather than being pinned to an explicit value.
  if (typeof a?.opacity === "number") style["--nav-opacity"] = String(a.opacity);

  if (anim) {
    style["--nav-anim-duration"] = `${anim.duration}s`;
    style["--nav-anim-delay"] = `${anim.delay}s`;
    style["--nav-anim-iterations"] = anim.iterationCount;
  }

  return style;
}

/** `className` for a nav link: the base hook plus, when configured, the
 * animation classes. Caller appends its own layout classes if any. */
export function navItemClassName(item: StyleableNavLink): string {
  const classes = ["nav-link"];
  if (item.animation) classes.push("nav-anim", `nav-anim--${item.animation.type}`);
  return classes.join(" ");
}

/** Anchor attributes for "open in new tab", including the security rel that
 * must accompany target=_blank. */
export function navItemLinkProps(item: Pick<NavItem, "openInNewTab">): { target?: string; rel?: string } {
  return item.openInNewTab ? { rel: "noopener noreferrer", target: "_blank" } : {};
}

const BADGE_COLOR_VAR: Record<string, string> = {
  plum: "var(--pdh-plum)",
  sale: "var(--pdh-sale)",
  teal: "var(--pdh-teal)",
};

/** Resolves a nav badge's colours: a "custom" badge carries its own hex
 * pair, a named one maps to a theme variable. */
export function navBadgeColors(badge: NonNullable<NavItem["badge"]>): { background: string; color: string } {
  if (badge.color === "custom") {
    return { background: badge.bgColor || "var(--pdh-plum)", color: badge.textColor || "#fff" };
  }
  return { background: BADGE_COLOR_VAR[badge.color] || "var(--pdh-plum)", color: "#fff" };
}
