import type { Metadata } from "next";
import { draftMode } from "next/headers";
import localFont from "next/font/local";
import { Cairo, Poppins } from "next/font/google";
import { StoreProvider } from "@/context/store-provider";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromoModal } from "@/components/layout/PromoModal";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Toast } from "@/components/layout/Toast";
import { FloatingActions } from "@/components/floating-actions/FloatingActions";
import { FOOTER_COLUMNS, HEADER_ACTIONS, HEADER_SEARCH, LOGO, TOPBAR_CONFIG } from "@/data/siteChrome";
import { chromeAppearanceCss } from "@/lib/chromeAppearance";
import { SITE_DIR, SITE_LOCALE } from "@/lib/locale";
import { THEME } from "@/data/theme";
import { MEGA_MENU, NAV_ITEMS } from "@/data/nav";
import {
  fetchLiveNavigation,
  fetchLiveSiteChrome,
  fetchLiveTheme,
  fetchPublishedSiteChrome,
  fetchPublishedTheme,
  fetchPublishedNavigation,
} from "@/lib/storefront/siteChromeContent";
import "./globals.css";

/**
 * Alta — the brand's primary typeface, self-hosted.
 *
 * It replaces Jost, which had been standing in for it: same geometric,
 * high-waisted character, but Jost is not the approved face and the
 * closest available font is a substitute, not a choice.
 *
 * Two files, declared as weight *ranges* rather than single values. The
 * family ships only Light and Regular (measured stems of 35 and 71 units
 * per 1000 — exactly double), while the storefront asks for 200, 300, 400
 * and 500 across 58 declarations. Ranges let each existing declaration
 * resolve to the right file with no call-site edits, and — more importantly
 * — stop the browser synthesising a fake bold for 500, which is what a bare
 * `weight: "400"` would have invited.
 *
 * Alta Caption, the third file supplied, is deliberately not shipped: it is
 * Regular with ~5% looser spacing for small sizes, and every Alta role here
 * is display. Loading an unused 14 KB face to be thorough is not thorough.
 *
 * One caveat lives in the font itself: Light has no ellipsis glyph (U+2026).
 * Nothing set in Alta uses one today — the storefront's ellipses are all in
 * body copy and placeholders, which are Poppins — but a heading written with
 * "…" would fall back mid-word.
 */
const alta = localFont({
  src: [
    { path: "../fonts/Alta_light.woff2", weight: "200 300", style: "normal" },
    { path: "../fonts/Alta_regular.woff2", weight: "400 500", style: "normal" },
  ],
  variable: "--font-alta",
  display: "swap",
  // Alta's lowercase runs nearly as tall as its caps, so the default metric
  // fallback overshoots badly. Arial is the closest of the adjustable set
  // and keeps the swap from reflowing headings.
  adjustFontFallback: "Arial",
  fallback: ["Century Gothic", "system-ui", "sans-serif"],
});

/**
 * Cairo — the brand's third face, for Arabic.
 *
 * Requested with the arabic subset only, which makes next/font emit a
 * @font-face scoped by unicode-range. A browser fetches it the first time an
 * Arabic glyph is actually painted and never otherwise, so this costs a
 * French-only page nothing at all — the reason it can ship before a single
 * string has been translated. `preload: false` keeps it out of the document
 * head for the same reason: preloading a font no current page renders would
 * be spending a request on a promise.
 *
 * It sits after Poppins in the stack rather than replacing it: Cairo has no
 * Latin design of its own worth imposing on French copy, and the fallback
 * chain hands it only the characters Poppins cannot draw.
 */
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["300", "400", "600", "700"],
  preload: false,
});

/**
 * Poppins now carries two roles: body copy, as before, and the small
 * uppercase labels that used to be Raleway — eyebrows, badges, buttons and
 * brand lines at 9–14px with 0.06–0.16em tracking.
 *
 * Raleway was never in the brand system. Folding its 42 uses in here means
 * one fewer family over the wire and one fewer face to keep in sync, and
 * Poppins already carried the 500/600 weights those labels ask for.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Para d'Hiver — Parapharmacie en ligne",
  description:
    "Parapharmacie en ligne au Maroc : soins dermocosmétiques, conseils de pharmaciens et livraison partout au Maroc.",
  openGraph: {
    siteName: "Para d'Hiver",
    locale: "fr_MA",
    type: "website",
  },
};

// Belt-and-suspenders: the Theme global already validates each color is a
// hex string server-side (backend/src/globals/Theme.ts), but this is also
// the one place a color value gets concatenated into a raw <style> tag — a
// string that failed validation and slipped through some other write path
// (a direct API call, a future admin change) must never reach the response
// unescaped. Re-checking here, right before interpolation, is what actually
// makes that safe rather than assumed.
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
function safeHex(value: string, fallback: string): string {
  return HEX_COLOR_RE.test(value) ? value : fallback;
}
// Same belt-and-suspenders reasoning as safeHex — these also get
// concatenated into the raw <style> tag below.
function safeNumber(value: number, fallback: number, min: number, max: number): number {
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const isPreview = (await draftMode()).isEnabled;
  // Preview reads the unpublished drafts; everyone else reads the published
  // globals, so an editor's change is visible without sync-cms or a redeploy.
  // Both are tag-cached, not per-request, so the CMS still isn't hit once per
  // page view. The generated data/*.ts snapshots remain the fallback for when
  // the CMS is unreachable — a CMS outage must never blank the header.
  const [chrome, theme, navigation] = isPreview
    ? await Promise.all([fetchLiveSiteChrome().catch(() => null), fetchLiveTheme().catch(() => null), fetchLiveNavigation().catch(() => null)])
    : await Promise.all([
        fetchPublishedSiteChrome().catch(() => null),
        fetchPublishedTheme().catch(() => null),
        fetchPublishedNavigation().catch(() => null),
      ]);

  const topBarConfig = chrome?.topBar ?? TOPBAR_CONFIG;
  const logo = chrome?.logo ?? LOGO;
  const headerSearch = chrome?.headerSearch ?? HEADER_SEARCH;
  const headerActions = chrome?.headerActions ?? HEADER_ACTIONS;
  const footerColumns = chrome?.footerColumns ?? FOOTER_COLUMNS;
  // Off unless the CMS says otherwise — a popup nobody configured must not appear.
  const promoModal = chrome?.promoModal;
  const navItems = navigation?.navItems ?? NAV_ITEMS;
  const megaMenu = navigation?.megaMenu ?? MEGA_MENU;
  // The mobile category strip used to render here, under the header on every
  // page. It belongs to the home page now — above the hero, which is the only
  // place it was ever meant to sit in front of — so it is fetched there.
  const t = theme ?? THEME;

  const themeStyle = `:root{--pdh-plum:${safeHex(t.colorPrimary, THEME.colorPrimary)};--pdh-teal:${safeHex(t.colorSecondary, THEME.colorSecondary)};--pdh-accent:${safeHex(t.colorAccent, THEME.colorAccent)};--pdh-sale:${safeHex(t.colorSale, THEME.colorSale)};--pdh-ink:${safeHex(t.colorTextPrimary, THEME.colorTextPrimary)};--pdh-muted:${safeHex(t.colorTextMuted, THEME.colorTextMuted)};--pdh-cream:${safeHex(t.colorBackgroundSecondary, THEME.colorBackgroundSecondary)};--pdh-btn-bg:${safeHex(t.buttonBg, THEME.buttonBg)};--pdh-btn-text:${safeHex(t.buttonText, THEME.buttonText)};--pdh-btn-hover-bg:${safeHex(t.buttonHoverBg, THEME.buttonHoverBg)};--pdh-btn-hover-text:${safeHex(t.buttonHoverText, THEME.buttonHoverText)};--pdh-btn-radius:${safeNumber(t.buttonRadius, THEME.buttonRadius, 0, 999)}px;--pdh-btn-weight:${safeNumber(t.buttonFontWeight, THEME.buttonFontWeight, 100, 900)};--pdh-btn-tracking:${safeNumber(t.buttonLetterSpacing, THEME.buttonLetterSpacing, 0, 1)}em;--pdh-badge-bg:${safeHex(t.badgeBg, THEME.badgeBg)};--pdh-badge-text:${safeHex(t.badgeText, THEME.badgeText)};--pdh-badge-font-size:${safeNumber(t.badgeFontSize, THEME.badgeFontSize, 8, 16)}px;--pdh-badge-weight:${safeNumber(t.badgeFontWeight, THEME.badgeFontWeight, 100, 900)};--pdh-badge-tracking:${safeNumber(t.badgeLetterSpacing, THEME.badgeLetterSpacing, 0, 1)}em;--pdh-badge-radius:${safeNumber(t.badgeRadius, THEME.badgeRadius, 0, 999)}px;--pdh-badge-padding-x:${safeNumber(t.badgePaddingX, THEME.badgePaddingX, 0, 30)}px;--pdh-badge-padding-y:${safeNumber(t.badgePaddingY, THEME.badgePaddingY, 0, 20)}px;--pdh-badge-gap:${safeNumber(t.badgeGap, THEME.badgeGap, 0, 20)}px;}`;

  // Appended to the same rule rather than a second <style>: this block is the
  // one place a colour is concatenated into raw CSS, which is why it is also
  // the one place the hex gate is enforced. Empty when nothing is configured,
  // and then the chrome keeps every colour it has today.
  const chromeCss = chromeAppearanceCss(chrome?.appearance ?? null);
  const rootStyle = chromeCss ? `${themeStyle}:root{${chromeCss}}` : themeStyle;

  return (
    <html dir={SITE_DIR} lang={SITE_LOCALE} className={`${alta.variable} ${poppins.variable} ${cairo.variable}`}>
      <body style={{ minHeight: "100vh", overflowX: "hidden" }}>
        {/* Values are hex/number-validated above (safeHex, chromeAppearanceCss),
            never raw operator text. */}
        <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
        <StoreProvider>
          <TopBar config={topBarConfig} />
          <Header logo={logo} headerSearch={headerSearch} headerActions={headerActions} navItems={navItems} megaMenu={megaMenu} />
          <main>{children}</main>
          <Footer columns={footerColumns} />
          <CartDrawer />
          <Toast />
          <FloatingActions />
          {promoModal && <PromoModal config={promoModal} />}
        </StoreProvider>
      </body>
    </html>
  );
}
