import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../shadcn.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Sidebar 08 — aperçu",
};

/**
 * Root layout for the shadcn sidebar-08 preview.
 *
 * `shadcn add sidebar-08` dropped its demo page at app/dashboard/page.tsx,
 * which resolves to the same /dashboard route as the real overview in
 * app/dashboard/(app)/page.tsx — a routing conflict that would have taken the
 * dashboard down. Moved here instead, alongside /statistics-02, so the block
 * stays available as a reference without owning a live route.
 */
export default function SidebarPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
