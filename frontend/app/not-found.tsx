import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import { LOGO } from "@/data/siteChrome";
import { THEME } from "@/data/theme";
import { routes } from "@/lib/routes";

// Global 404. Reached whenever no route matches at all, and — importantly —
// for a `/produit/<slug>` that isn't a real product: that route sets
// `dynamicParams = false`, so an unknown slug is rejected during routing and
// never enters the (site) segment, which is what makes it return a true HTTP
// 404 rather than a 200 with not-found content. Because this project has no
// root app/layout.tsx (the (site) and dashboard groups each supply their own
// <html>/<body>), this file must provide its own document shell.
//
// (site)/not-found.tsx still handles `notFound()` calls raised from inside a
// rendered site page (e.g. /shop/[slug]) and keeps the full header/footer
// chrome there.

// Declared again here rather than shared: this file is its own document
// shell (the project has no root layout), so it cannot inherit the (site)
// group's font variables. Same two files, same weight ranges.
const alta = localFont({
  src: [
    { path: "./fonts/Alta_light.woff2", weight: "200 300", style: "normal" },
    { path: "./fonts/Alta_regular.woff2", weight: "400 500", style: "normal" },
  ],
  variable: "--font-alta",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Century Gothic", "system-ui", "sans-serif"],
});
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "Page introuvable — Para d'Hiver",
  robots: { index: false, follow: true },
};

const linkBase: React.CSSProperties = {
  display: "inline-block",
  padding: "13px 28px",
  borderRadius: 999,
  fontFamily: "var(--font-poppins)",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textDecoration: "none",
};

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={`${alta.variable} ${poppins.variable}`}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "clamp(24px,6vw,64px)",
          textAlign: "center",
          background: THEME.colorBackgroundSecondary,
          color: THEME.colorTextPrimary,
          fontFamily: "var(--font-poppins), system-ui, sans-serif",
        }}
      >
        <Link href={routes.home()} style={{ marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {LOGO.img ? (
            <Image src={LOGO.img} alt={LOGO.wordmark} width={44} height={44} style={{ objectFit: "contain" }} unoptimized />
          ) : null}
          <span
            style={{
              fontFamily: "var(--font-alta)",
              fontSize: 20,
              fontWeight: 400,
              letterSpacing: "0.18em",
              color: THEME.colorPrimary,
            }}
          >
            {LOGO.wordmark}
          </span>
        </Link>

        <p
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: THEME.colorSecondary,
            margin: "0 0 12px",
          }}
        >
          Erreur 404
        </p>

        <h1
          style={{
            fontFamily: "var(--font-alta)",
            fontWeight: 300,
            fontSize: "clamp(28px,4.6vw,46px)",
            lineHeight: 1.18,
            color: THEME.colorPrimary,
            margin: "0 0 16px",
          }}
        >
          Cette page est introuvable
        </h1>

        <p style={{ maxWidth: 520, fontSize: 15, lineHeight: 1.7, opacity: 0.72, margin: "0 0 32px" }}>
          Le produit ou la page que vous cherchez n&apos;existe pas, ou n&apos;est plus disponible. Parcourez notre
          catalogue pour trouver le soin qu&apos;il vous faut.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link href={routes.catalogue()} style={{ ...linkBase, background: THEME.buttonBg, color: THEME.buttonText }}>
            Voir le catalogue
          </Link>
          <Link href={routes.home()} style={{ ...linkBase, border: "1px solid rgba(94,64,116,.28)", color: THEME.colorPrimary }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
