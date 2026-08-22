import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { Jost, Poppins, Raleway } from "next/font/google";
import { StoreProvider } from "@/context/store-provider";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Toast } from "@/components/layout/Toast";
import { FloatingActions } from "@/components/floating-actions/FloatingActions";
import { FOOTER_COLUMNS, HEADER_ACTIONS, HEADER_SEARCH, LOGO, TOPBAR_CONFIG } from "@/data/siteChrome";
import { chromeAppearanceCss } from "@/lib/chromeAppearance";
import { THEME } from "@/data/theme";
import { MEGA_MENU, NAV_ITEMS } from "@/data/nav";
import {
  fetchLiveNavigation,
  fetchLiveSiteChrome,
  fetchLiveTheme,
  fetchPublishedChromeAppearance,
  fetchPublishedNavigation,
} from "@/lib/storefront/siteChromeContent";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
  // Preview reads the unpublished draft; everyone else reads the published
  // navigation live, so an editor's colour/label/order change is visible
  // without sync-cms or a redeploy. It is tag-cached, not per-request, so the
  // CMS still isn't hit once per page view. The generated NAV_ITEMS snapshot
  // remains the fallback if the CMS is unreachable.
  const [chrome, theme, navigation] = isPreview
    ? await Promise.all([fetchLiveSiteChrome().catch(() => null), fetchLiveTheme().catch(() => null), fetchLiveNavigation().catch(() => null)])
    : [null, null, await fetchPublishedNavigation().catch(() => null)];

  // Outside preview the layout reads no site chrome at all, so the colours
  // would have reached the previewer and nobody else. This fetches the one
  // piece a visitor needs — cached by tag, purged on save — without changing
  // where the rest of the chrome comes from.
  const publishedAppearance = isPreview ? null : await fetchPublishedChromeAppearance().catch(() => null);

  const topBarConfig = chrome?.topBar ?? TOPBAR_CONFIG;
  const logo = chrome?.logo ?? LOGO;
  const headerSearch = chrome?.headerSearch ?? HEADER_SEARCH;
  const headerActions = chrome?.headerActions ?? HEADER_ACTIONS;
  const footerColumns = chrome?.footerColumns ?? FOOTER_COLUMNS;
  const navItems = navigation?.navItems ?? NAV_ITEMS;
  const megaMenu = navigation?.megaMenu ?? MEGA_MENU;
  const t = theme ?? THEME;

  const themeStyle = `:root{--pdh-plum:${safeHex(t.colorPrimary, THEME.colorPrimary)};--pdh-teal:${safeHex(t.colorSecondary, THEME.colorSecondary)};--pdh-accent:${safeHex(t.colorAccent, THEME.colorAccent)};--pdh-sale:${safeHex(t.colorSale, THEME.colorSale)};--pdh-ink:${safeHex(t.colorTextPrimary, THEME.colorTextPrimary)};--pdh-muted:${safeHex(t.colorTextMuted, THEME.colorTextMuted)};--pdh-cream:${safeHex(t.colorBackgroundSecondary, THEME.colorBackgroundSecondary)};--pdh-btn-bg:${safeHex(t.buttonBg, THEME.buttonBg)};--pdh-btn-text:${safeHex(t.buttonText, THEME.buttonText)};--pdh-btn-hover-bg:${safeHex(t.buttonHoverBg, THEME.buttonHoverBg)};--pdh-btn-hover-text:${safeHex(t.buttonHoverText, THEME.buttonHoverText)};--pdh-btn-radius:${safeNumber(t.buttonRadius, THEME.buttonRadius, 0, 999)}px;--pdh-btn-weight:${safeNumber(t.buttonFontWeight, THEME.buttonFontWeight, 100, 900)};--pdh-btn-tracking:${safeNumber(t.buttonLetterSpacing, THEME.buttonLetterSpacing, 0, 1)}em;--pdh-badge-bg:${safeHex(t.badgeBg, THEME.badgeBg)};--pdh-badge-text:${safeHex(t.badgeText, THEME.badgeText)};--pdh-badge-font-size:${safeNumber(t.badgeFontSize, THEME.badgeFontSize, 8, 16)}px;--pdh-badge-weight:${safeNumber(t.badgeFontWeight, THEME.badgeFontWeight, 100, 900)};--pdh-badge-tracking:${safeNumber(t.badgeLetterSpacing, THEME.badgeLetterSpacing, 0, 1)}em;--pdh-badge-radius:${safeNumber(t.badgeRadius, THEME.badgeRadius, 0, 999)}px;--pdh-badge-padding-x:${safeNumber(t.badgePaddingX, THEME.badgePaddingX, 0, 30)}px;--pdh-badge-padding-y:${safeNumber(t.badgePaddingY, THEME.badgePaddingY, 0, 20)}px;--pdh-badge-gap:${safeNumber(t.badgeGap, THEME.badgeGap, 0, 20)}px;}`;

  // Appended to the same rule rather than a second <style>: this block is the
  // one place a colour is concatenated into raw CSS, which is why it is also
  // the one place the hex gate is enforced. Empty when nothing is configured,
  // and then the chrome keeps every colour it has today.
  const chromeCss = chromeAppearanceCss(chrome?.appearance ?? publishedAppearance);
  const rootStyle = chromeCss ? `${themeStyle}:root{${chromeCss}}` : themeStyle;

  return (
    <html lang="fr" className={`${jost.variable} ${poppins.variable} ${raleway.variable}`}>
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
        </StoreProvider>
      </body>
    </html>
  );
}
