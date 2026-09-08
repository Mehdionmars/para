import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
