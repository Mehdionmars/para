
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/storefront/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/api/",
        "/panier",
        "/favoris",
        "/suivi-commande",
        "/preview",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}