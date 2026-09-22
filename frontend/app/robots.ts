import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/storefront/seo";

/**
 * /robots.txt — which did not exist.
 *
 * Every crawler asks for it first, and every request was answering 404 with
 * the shop's own HTML 404 page (13 KB of markup for a file meant to be three
 * lines). The rules below are the ones this app already enforces elsewhere:
 * the dashboard is private, and next.config.ts sends it
 * `Cache-Control: private, no-store` for the same reason.
 *
 * /panier, /favoris and /suivi-commande are disallowed as crawl targets, not
 * as secrets: they are per-visitor states with nothing stable to index, and
 * letting a crawler spend its budget on them costs the catalogue.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/dashboard/", "/api/", "/panier", "/favoris", "/suivi-commande", "/preview"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
