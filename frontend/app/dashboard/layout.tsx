import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./dashboard.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tableau de bord — Para d'Hiver",
  icons: { icon: "/assets/logo.png" },
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
