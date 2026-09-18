import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./dashboard.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// No `icons` here on purpose. app/favicon.ico is a root-segment file
// convention, so Next already injects it into every root layout including this
// one; re-declaring an icon would emit a second <link rel="icon"> in the admin
// <head> — and the 220 KB /assets/logo.png it used to point at was a worse tab
// icon than the 15 KB multi-resolution .ico anyway.
export const metadata: Metadata = {
  title: "Tableau de bord — Para d'Hiver",
};

/** Independent root layout: the admin dashboard is its own app (Tailwind,
 * no storefront Header/Footer/cart) sharing only the Next.js project and the
 * Payload backend with the public site. See app/(site)/layout.tsx for that one. */
export default function DashboardRootLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    // suppressHydrationWarning is required, not defensive: next-themes writes
    // class="dark" onto <html> from a blocking inline script before React
    // hydrates, so the server's markup and the client's first read of the DOM
    // genuinely differ on this one element. Without it React logs a mismatch
    // on every admin page load. Scoped to <html>, so a real mismatch anywhere
    // inside the tree is still reported.
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* The theme is stored per browser under its own key. The storefront is
            light-only and lives in a separate root layout, so an admin who
            prefers dark does not darken the shop they are editing.

            disableTransitionOnChange stops every colour-carrying element from
            animating at once when the theme flips — with ~40 tokens changing
            in the same frame, the crossfade reads as a stutter rather than a
            transition. */}
        {/* enableSystem is deliberately off. With it on, an operator whose OS
            is set to dark was opted into the dark theme on first load without
            ever touching the toggle — and the theme is only finished on the
            surfaces swept so far, so they would meet a checkerboard of white
            panels on a near-black shell having asked for nothing. Dark stays
            available to anyone who picks it deliberately; it just stops being
            applied on their behalf. Restore `enableSystem` once the remaining
            hardcoded utilities are on tokens. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="pdh-admin-theme"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
