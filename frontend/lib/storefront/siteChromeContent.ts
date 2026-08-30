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

export type PromoModalContent = {
  enabled: boolean;
  badge: string;
  expiryLabel: string;
  title: string;
  subtitle: string;
  description: string;
  code: string;
  ctaLabel: string;
  conditions: string[];
  image: string;
  delaySeconds: number;
};

export type LiveSiteChrome = {
  topBar: TopBarConfig;
  logo: Logo;
  headerSearch: HeaderSearchConfig;
  headerActions: HeaderAction[];
  footerColumns: FooterColumn[];
  promoModal: PromoModalContent;
  /** Operator colour overrides. Every field optional and normally unset —
   * see lib/chromeAppearance.ts for why nothing here has a default. */
  appearance: ChromeAppearance;
};

/** Preview reads the unpublished draft; everyone else reads the published
 * global (see fetchPublishedSiteChrome). Both map through this one function. */
export const fetchLiveSiteChrome = () => fetchSiteChrome({ draft: true });

export async function fetchSiteChrome({ draft }: { draft: boolean }): Promise<LiveSiteChrome> {
  const res = draft
    ? await fetch(`${CMS_URL}/api/globals/site-chrome?draft=true&depth=1`, { cache: "no-store" })
    : await fetch(`${CMS_URL}/api/globals/site-chrome?depth=1`, {
        next: { revalidate: 3600, tags: [SITE_CHROME_TAG] },
      });
  if (!res.ok) throw new Error(`Failed to fetch ${draft ? "draft " : ""}site-chrome content (${res.status})`);
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
    promoModal: mapPromoModal(chrome.promoModal as RawPromoModal | undefined),
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

  // What decides whether there is a badge is the *label*: `badgeLabel` is the
  // pill, `badgeColor` only styles it. "none" is that select's defaultValue
  // and means "no palette entry picked", not "no badge" — so a label typed in
  // the builder without touching the colour used to save fine and then render
  // nothing at all, silently. A label with no colour now falls back to the
  // brand pill (--pdh-badge-* already defaults to plum), which is what the
  // editor saw in the builder preview.
  //
  // Free hex still wins over the named palette when both are set.
  const customBadge = raw.badgeLabel && (raw.badgeBackgroundColor || raw.badgeTextColor);
  const paletteBadge = raw.badgeLabel && raw.badgeColor && raw.badgeColor !== "none";
  const defaultBadge = raw.badgeLabel && !customBadge && !paletteBadge;

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
        : defaultBadge
          ? ({ color: "plum", label: raw.badgeLabel! } as NavBadge)
          : undefined,
  };
}

/** One chip in the mobile category strip. Deliberately just a label and a
 * resolved href: the strip is a shortcut bar, not a second navigation system
 * with its own styling model. */
export type CategoryChip = {
  label: string;
  href: string;
  /** Optional round thumbnail. Chips without one stay text-only, so a strip
   * that is half-illustrated does not render as half a design. */
  image?: string;
};

export type MobileCategoryStrip = {
  enabled: boolean;
  showAllChip: boolean;
  allChipLabel: string;
  items: CategoryChip[];
};

export type LiveNavigation = {
  navItems: NavItem[];
  megaMenu: Record<string, MegaMenuContent>;
  categoryStrip: MobileCategoryStrip;
};

/** Cache tag the CMS invalidates when the Site Chrome global is saved. */
type RawPromoModal = {
  enabled?: boolean;
  badge?: string;
  expiryLabel?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  code?: string;
  ctaLabel?: string;
  conditions?: { text?: string }[];
  image?: PayloadMediaRef;
  delaySeconds?: number;
};

/**
 * `enabled` is opt-in (`=== true`), like the category strip: a popup is the
 * most intrusive thing on a storefront, and a mapper does not get to switch
 * one on for a shop whose document predates the field. A modal with no code
 * has nothing to offer, so that counts as off too.
 */
function mapPromoModal(raw: RawPromoModal | undefined): PromoModalContent {
  const code = raw?.code?.trim() || "";
  return {
    enabled: raw?.enabled === true && code.length > 0,
    badge: raw?.badge?.trim() || "",
    expiryLabel: raw?.expiryLabel?.trim() || "",
    title: raw?.title?.trim() || "",
    subtitle: raw?.subtitle?.trim() || "",
    description: raw?.description?.trim() || "",
    code,
    ctaLabel: raw?.ctaLabel?.trim() || "Copier le code",
    conditions: (raw?.conditions || []).map((c) => c.text?.trim() || "").filter(Boolean),
    image: resolveMediaUrl(raw?.image) || "",
    delaySeconds: typeof raw?.delaySeconds === "number" ? Math.max(0, Math.min(60, raw.delaySeconds)) : 6,
  };
}

export const SITE_CHROME_TAG = "site-chrome";

/**
 * The *published* site chrome, for ordinary visitors.
 *
 * This used to fetch only the colours, and everything else on the header and
 * footer — top-bar messages, logo, search placeholder, header actions, footer
 * columns — came from the generated `data/siteChrome.ts` snapshot for anyone
 * not in preview. So a merchant editing those in the Storefront Builder saw
 * the change in preview and visitors kept the snapshot until the next
 * `sync-cms` and redeploy. Now the whole global is read live, the same way
 * navigation already was.
 *
 * Tagged rather than `no-store`: the response is cached and shared across
 * visitors — the CMS is not hit once per page view — and the tag is purged the
 * moment Site Chrome is saved (see the global's afterChange hook). The
 * one-hour window is only the fallback for a missed purge.
 */
export const fetchPublishedSiteChrome = () => fetchSiteChrome({ draft: false });

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
function mapNavigation(nav: { items?: RawNavItem[]; catStrip?: RawCategoryStrip }): LiveNavigation {
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

  return { categoryStrip: mapCategoryStrip(nav.catStrip), megaMenu, navItems };
}

type RawCategoryStrip = {
  enabled?: boolean;
  showAllChip?: boolean;
  allChipLabel?: string;
  items?: (RawNavLink & { label: string; visible?: boolean; image?: PayloadMediaRef })[];
};

/**
 * The mobile quick-category strip.
 *
 * Chips resolve through the same `resolveLiveNavHref` as every navbar and
 * mega-menu link, so a chip pointing at a category cannot drift into a
 * different URL from the menu entry pointing at the same one.
 *
 * `enabled` is treated as opt-in (`=== true`) rather than opt-out: the strip
 * is new UI, and a navigation document written before it existed has no such
 * field. Defaulting to "on" would make it appear on the live shop the moment
 * this deploys, which is not a decision a mapper gets to make.
 */
function mapCategoryStrip(raw: RawCategoryStrip | undefined): MobileCategoryStrip {
  const items = (raw?.items || [])
    .filter((item) => item.visible !== false && Boolean(item.label?.trim()))
    .map((item) => ({
      href: resolveLiveNavHref(item),
      label: item.label.trim(),
      image: resolveMediaUrl(item.image) || undefined,
    }));

  return {
    allChipLabel: raw?.allChipLabel?.trim() || "Tout",
    // A strip with no chips is not a strip. Rendering an empty bar would
    // leave a stray border under the header with nothing in it.
    enabled: raw?.enabled === true && items.length > 0,
    items,
    showAllChip: raw?.showAllChip !== false,
  };
}

/** Cache tag the CMS purges when the Theme global is saved. */
export const THEME_TAG = "theme";

/** Preview reads the unpublished draft; everyone else the published global.
 * Outside preview the layout used to fall back to the generated data/theme.ts
 * snapshot, so a palette chosen in the Builder's "Apparence" tab re-coloured
 * the preview and nothing else. */
export const fetchLiveTheme = () => fetchTheme({ draft: true });
export const fetchPublishedTheme = () => fetchTheme({ draft: false });

export async function fetchTheme({ draft }: { draft: boolean }): Promise<Theme> {
  const res = draft
    ? await fetch(`${CMS_URL}/api/globals/theme?draft=true&depth=0`, { cache: "no-store" })
    : await fetch(`${CMS_URL}/api/globals/theme?depth=0`, { next: { revalidate: 3600, tags: [THEME_TAG] } });
  if (!res.ok) throw new Error(`Failed to fetch ${draft ? "draft " : ""}theme content (${res.status})`);
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
