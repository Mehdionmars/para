import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../shadcn.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Statistics — Para d'Hiver",
};

/**
 * Root layout for the shadcn block route.
 *
 * Required, not optional: this project deliberately has no app/layout.tsx, so
 * every top-level segment is its own root and must supply <html> and <body>
 * itself — the same arrangement app/(site)/layout.tsx and
 * app/dashboard/layout.tsx already use. Without this file the page below has
 * no root layout at all and cannot render.
 *
 * It imports app/shadcn.css rather than the storefront's globals.css so the
 * block gets the shadcn token palette without inheriting, or disturbing, the
 * shop's theme.
 */
export default function StatisticsLayout({ children }: LayoutProps<"/statistics-02">) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
