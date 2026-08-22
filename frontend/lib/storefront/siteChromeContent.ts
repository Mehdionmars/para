// Server-only: live DRAFT Site Chrome + Theme content for the Storefront
// Builder's preview mode (Next Draft Mode) — same pattern as
// lib/storefront/homeContent.ts's fetchLiveHomeContent, kept in its own file
// since chrome/theme are separate Payload globals from Home.
//
// headerActions.icon stays a plain string name here too (see
// scripts/sync-cms.mjs's note on HEADER_ACTIONS) — this return value flows
// from app/(site)/layout.tsx (a Server Component) as a prop into Header (a
// Client Component), and a resolved lucide-react component can't cross
// that boundary; Header.tsx resolves the name to a component itself.
import { type ChromeAppearance, toChromeAppearance } from "@/lib/chromeAppearance";
import { CMS_URL } from "@/lib/dashboard/constants";
import { routes } from "@/lib/routes";
import { resolveMediaUrl, type PayloadMediaRef } from "@/lib/storefront/products";
import type { FooterColumn, HeaderAction, HeaderSearchConfig, Logo, TopBarConfig } from "@/data/siteChrome";
import type { Theme } from "@/data/theme";
import type { MegaMenuContent, NavAnimationType, NavBadge, NavItem } from "@/data/nav";

type RawTopBar = { enabled?: boolean; messages?: { text: string; active?: boolean }[]; marqueeSpeedSec?: number; mobileMessage?: string };
type RawLogo = { image?: PayloadMediaRef; wordmark?: string; href?: string };
type RawHeaderSearch = { enabled?: boolean; placeholder?: string };
type RawHeaderAction = { key: string; label: string; icon?: string; href?: string; visible?: boolean };
type RawFooterLink = { label: string; href: string; visible?: boolean };
type RawFooterColumn = { title: string; visible?: boolean; links?: RawFooterLink[] };

export type LiveSiteChrome = {
  topBar: TopBarConfig;
  logo: Logo;
  headerSearch: HeaderSearchConfig;
  headerActions: HeaderAction[];
  footerColumns: FooterColumn[];
  /** Operator colour overrides. Every field optional and normally unset —
   * see lib/chromeAppearance.ts for why nothing here has a default. */
  appearance: ChromeAppearance;
};

export async function fetchLiveSiteChrome(): Promise<LiveSiteChrome> {
  const res = await fetch(`${CMS_URL}/api/globals/site-chrome?draft=true&depth=1`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch draft site-chrome content (${res.status})`);
  const chrome = await res.json();
  const rawTopBar = (chrome.topBar || {}) as RawTopBar;

  return {
    appearance: toChromeAppearance(chrome),
    topBar: {
      enabled: rawTopBar.enabled !== false,
      messages: (rawTopBar.messages || []).filter((m) => m.active !== false).map((m) => m.text),
      marqueeSpeedSec: rawTopBar.marqueeSpeedSec || 34,
      mobileMessage: rawTopBar.mobileMessage || "Livraison offerte dès 399 MAD",
    },
    logo: {
      img: resolveMediaUrl((chrome.logo as RawLogo)?.image) || "/assets/logo.png",
      wordmark: (chrome.logo as RawLogo)?.wordmark || "PARA D'HIVER",
      href: (chrome.logo as RawLogo)?.href || "/",
    },
    headerSearch: {
      enabled: (chrome.headerSearch as RawHeaderSearch)?.enabled !== false,
      placeholder: (chrome.headerSearch as RawHeaderSearch)?.placeholder || "Rechercher un produit, une marque…",
    },
    headerActions: ((chrome.headerActions || []) as RawHeaderAction[])
      .filter((a) => a.visible !== false)
      .map((a) => ({ key: a.key, label: a.label, icon: a.icon || "Heart", href: a.href || "" })),
    footerColumns: ((chrome.footerColumns || []) as RawFooterColumn[])
      .filter((c) => c.visible !== false)
      .map((c) => ({
        title: c.title,
        links: (c.links || []).filter((l) => l.visible !== false).map((l) => ({ label: l.label, href: l.href })),
      })),
  };
}

type RelRef = { id?: number; name?: string; slug?: string } | number | null | undefined;
const relField = (ref: RelRef, field: "name" | "slug"): string => (ref && typeof ref === "object" ? ref[field] || "" : "");

type RawAppearance = {
  color?: string;
  hoverColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontWeight?: string;
  opacity?: number | null;
};

type RawAnimation = {
  enabled?: boolean;
  type?: string;
  duration?: number;
  delay?: number;
  iterationCount?: string;
};

/** Styling is on the *link* shape, not only the top-level item, because
 * mega-menu column links now carry the same fields. */
type RawNavLink = {
  label: string;
  visible?: boolean;
  type?: "category" | "brand" | "collection" | "page" | "custom";
  category?: RelRef;
  brand?: RelRef;
  collectionRoute?: string;
  pageRoute?: string;
  customUrl?: string;
  openInNewTab?: boolean;
  badgeLabel?: string;
  badgeColor?: "none" | "plum" | "teal" | "sale";
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  appearance?: RawAppearance;
  animation?: RawAnimation;
};
type RawNavItem = RawNavLink & {
  megaMenuEnabled?: boolean;
  megaMenu?: {
    subtitle?: string;
    columns?: { title: string; links?: RawNavLink[] }[];
    promo?: { image?: PayloadMediaRef; title?: string; description?: string; ctaLabel?: string; ctaUrl?: string };
  };
};

function resolveLiveNavHref(item: RawNavLink): string {
  switch (item.type) {
    case "category": {
      const slug = relField(item.category, "slug");
      return slug ? routes.category(slug) : routes.catalogue();
    }
    case "brand": {
      const slug = relField(item.brand, "slug");
      return slug ? routes.brand(slug) : routes.brands();
    }
    case "collection":
      return item.collectionRoute || "/catalogue";
    case "page":
      return item.pageRoute || "/";
    default:
      return item.customUrl || "/catalogue";
  }
}

/**
 * Extracts the presentation fields shared by top-level items and mega-menu
 * links.
 *
 * Every branch returns `undefined` when nothing is configured rather than an
 * empty object: navStyle only emits a CSS variable for values that are
 * present, so an untouched link produces no inline style and keeps rendering
 * with the theme exactly as before.
 *
 * This mapping is why a colour change in Payload reaches the storefront with
 * no rebuild — the live fetch previously dropped these fields on the floor
 * and only the generated snapshot carried them.
 */
function navPresentation(raw: RawNavLink): Pick<NavItem, "badge" | "appearance" | "animation"> {
  const a = raw.appearance;
  const hasAppearance =
    !!a && (a.color || a.hoverColor || a.activeColor || a.backgroundColor || a.borderColor || a.fontWeight || typeof a.opacity === "number");

  const anim = raw.animation;
  const animationOn = !!anim?.enabled && !!anim.type && anim.type !== "none";

  // Free hex wins over the named palette; the palette entry "none" means the
  // editor never picked one.
  const customBadge = raw.badgeLabel && (raw.badgeBackgroundColor || raw.badgeTextColor);
  const paletteBadge = raw.badgeLabel && raw.badgeColor && raw.badgeColor !== "none";

  return {
    animation: animationOn
      ? {
          delay: anim!.delay ?? 0,
          duration: anim!.duration ?? 2,
          iterationCount: anim!.iterationCount || "infinite",
          type: anim!.type as NavAnimationType,
        }
      : undefined,
    appearance: hasAppearance
      ? {
          activeColor: a!.activeColor || undefined,
          backgroundColor: a!.backgroundColor || undefined,
          borderColor: a!.borderColor || undefined,
          color: a!.color || undefined,
          fontWeight: a!.fontWeight || undefined,
          hoverColor: a!.hoverColor || undefined,
          opacity: typeof a!.opacity === "number" ? a!.opacity : undefined,
        }
      : undefined,
    badge: customBadge
      ? ({
          bgColor: raw.badgeBackgroundColor,
          color: "custom",
          label: raw.badgeLabel!,
          textColor: raw.badgeTextColor,
        } as NavBadge)
      : paletteBadge
        ? ({ color: raw.badgeColor, label: raw.badgeLabel! } as NavBadge)
        : undefined,
  };
}

export type LiveNavigation = { navItems: NavItem[]; megaMenu: Record<string, MegaMenuContent> };

/** Cache tag the CMS invalidates when the Site Chrome global is saved. */
export const SITE_CHROME_TAG = "site-chrome";

/**
 * The *published* chrome appearance, for ordinary visitors.
 *
 * Only the colours. The rest of the chrome — messages, logo, footer columns —
 * still comes from the generated `data/siteChrome.ts` snapshot outside preview
 * mode, and deliberately so: changing where that content is sourced is a
 * different job with a different blast radius. What this fixes is narrower and
 * was outright broken: the layout fetched site chrome only in preview, so a
 * colour saved in the dashboard reached the previewer and nobody else.
 *
 * Tagged rather than `no-store`: the response is cached and shared across
 * visitors — the CMS is not hit once per page view — and the tag is purged the
 * moment Site Chrome is saved (see the global's afterChange hook). The
 * one-hour window is only the fallback for a missed purge.
 */
export async function fetchPublishedChromeAppearance(): Promise<ChromeAppearance> {
  const res = await fetch(`${CMS_URL}/api/globals/site-chrome?depth=0`, {
    next: { revalidate: 3600, tags: [SITE_CHROME_TAG] },
  });
  if (!res.ok) throw new Error(`Failed to fetch site chrome (${res.status})`);
  return toChromeAppearance(await res.json());
}

/** Cache tag the CMS invalidates when the Navigation global is saved. */
export const NAVIGATION_TAG = "navigation";

/**
 * The *published* navigation, for ordinary visitors.
 *
 * This is what makes an editor's change appear without a rebuild. The layout
 * previously read the generated `NAV_ITEMS` snapshot for everyone except
 * preview sessions, so a colour or label edited in Payload only reached the
 * storefront after `sync-cms` and a redeploy.
 *
 * Tagged rather than `no-store`: the response is cached and shared across
 * visitors — so the CMS is not hit once per page view — and the tag is purged
 * the moment Navigation is saved (see the global's afterChange hook). The
 * one-hour window is only the fallback for a missed purge.
 */
export async function fetchPublishedNavigation(): Promise<LiveNavigation> {
  const res = await fetch(`${CMS_URL}/api/globals/navigation?depth=1`, {
    next: { revalidate: 3600, tags: [NAVIGATION_TAG] },
  });
  if (!res.ok) throw new Error(`Failed to fetch navigation (${res.status})`);
  return mapNavigation(await res.json());
}

export async function fetchLiveNavigation(): Promise<LiveNavigation> {
  const res = await fetch(`${CMS_URL}/api/globals/navigation?draft=true&depth=1`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch draft navigation content (${res.status})`);
  return mapNavigation(await res.json());
}

/** Shared by the draft and published fetchers so the two can never map the
 * same document differently. */
function mapNavigation(nav: { items?: RawNavItem[] }): LiveNavigation {
  const items = ((nav.items || []) as RawNavItem[]).filter((i) => i.visible !== false);

  const navItems: NavItem[] = items.map((item) => ({
    href: resolveLiveNavHref(item),
    label: item.label,
    megaKey: item.megaMenuEnabled ? item.label : undefined,
    openInNewTab: item.openInNewTab || undefined,
    ...navPresentation(item),
  }));

  const megaMenu: Record<string, MegaMenuContent> = {};
  for (const item of items) {
    if (!item.megaMenuEnabled) continue;
    const mm = item.megaMenu || {};
    megaMenu[item.label] = {
      subtitle: mm.subtitle || "",
      columns: (mm.columns || []).map((col) => ({
        title: col.title,
        links: (col.links || [])
          .filter((l) => l.visible !== false)
          .map((l) => ({ href: resolveLiveNavHref(l), label: l.label, ...navPresentation(l) })),
      })),
      promo: mm.promo?.title
        ? {
            img: resolveMediaUrl(mm.promo.image),
            title: mm.promo.title,
            description: mm.promo.description || "",
            ctaLabel: mm.promo.ctaLabel || "",
            ctaUrl: mm.promo.ctaUrl || "/catalogue",
          }
        : null,
    };
  }

  return { navItems, megaMenu };
}

export async function fetchLiveTheme(): Promise<Theme> {
  const res = await fetch(`${CMS_URL}/api/globals/theme?draft=true&depth=0`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch draft theme content (${res.status})`);
  const theme = await res.json();
  return {
    preset: theme.preset || "parad-hiver",
    colorPrimary: theme.colorPrimary || "#5E4074",
    colorSecondary: theme.colorSecondary || "#008AA5",
    colorAccent: theme.colorAccent || "#5FBE00",
    colorSale: theme.colorSale || "#FF514D",
    colorTextPrimary: theme.colorTextPrimary || "#373020",
    colorTextMuted: theme.colorTextMuted || "#757D86",
    colorBackgroundSecondary: theme.colorBackgroundSecondary || "#F7EEE5",
    buttonBg: theme.buttonBg || "#5E4074",
    buttonText: theme.buttonText || "#FFFFFF",
    buttonHoverBg: theme.buttonHoverBg || "#432951",
    buttonHoverText: theme.buttonHoverText || "#FFFFFF",
    buttonRadius: typeof theme.buttonRadius === "number" ? theme.buttonRadius : 999,
    buttonFontWeight: typeof theme.buttonFontWeight === "number" ? theme.buttonFontWeight : 600,
    buttonLetterSpacing: typeof theme.buttonLetterSpacing === "number" ? theme.buttonLetterSpacing : 0.08,
    badgeBg: theme.badgeBg || "#5E4074",
    badgeText: theme.badgeText || "#FFFFFF",
    badgeFontSize: typeof theme.badgeFontSize === "number" ? theme.badgeFontSize : 10.5,
    badgeFontWeight: typeof theme.badgeFontWeight === "number" ? theme.badgeFontWeight : 600,
    badgeLetterSpacing: typeof theme.badgeLetterSpacing === "number" ? theme.badgeLetterSpacing : 0.06,
    badgeRadius: typeof theme.badgeRadius === "number" ? theme.badgeRadius : 999,
    badgePaddingX: typeof theme.badgePaddingX === "number" ? theme.badgePaddingX : 11,
    badgePaddingY: typeof theme.badgePaddingY === "number" ? theme.badgePaddingY : 5,
    badgeGap: typeof theme.badgeGap === "number" ? theme.badgeGap : 6,
  };
}
