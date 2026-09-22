import { notFound } from "next/navigation";

/**
 * Gives a mistyped storefront URL the shop's own 404 — chrome included.
 *
 * `app/(site)/not-found.tsx` only answers a `notFound()` raised from inside a
 * page that is already rendering, so /shop/<inconnu> and /blog/<inconnu> got
 * the header, the nav and the footer, while /page-qui-nexiste-pas fell
 * through to the *root* app/not-found.tsx: branded, but a bare document with
 * no navigation out except two buttons. Measured before this file existed —
 * 19 KB and no <header>/<footer>, against 63 KB with them.
 *
 * Matching the URL here is what gives (site)/not-found.tsx something to
 * answer. It is the same fix, and the same reasoning, as
 * app/dashboard/(app)/[...unmatched]/page.tsx.
 *
 * Static and dynamic segments both win over a catch-all, so every real route
 * — /catalogue, /produit/[slug], /dashboard, and the metadata files
 * robots.txt and sitemap.xml — is matched before this is consulted.
 *
 * The root app/not-found.tsx stays, and is still reached: /produit/<slug>
 * sets `dynamicParams = false`, so an unknown product slug is rejected during
 * routing and never enters this segment at all.
 */
export default function UnmatchedSiteRoute(): never {
  notFound();
}
