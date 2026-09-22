import type { MetadataRoute } from "next";
import { fetchPublishedPageSlugs } from "@/lib/storefront/institutional";
import { fetchPosts } from "@/lib/storefront/posts";
import { absoluteUrl } from "@/lib/storefront/seo";

/**
 * /sitemap.xml — which did not exist either.
 *
 * ## What is in it
 *
 * The storefront's stable entry points, the institutional pages the pharmacy
 * has actually published, and every published article.
 *
 * A page is listed only once it has content: `fetchPublishedPageSlugs`
 * returns published rows only, so /cgv stays out of the sitemap while it
 * still renders "document en cours de publication" — which is the same rule
 * the page's own `robots: noindex` applies. The two cannot disagree.
 *
 * ## What is deliberately not in it yet
 *
 * The catalogue: 222 products, 9 categories, 19 aisles and the brand pages.
 * They belong in a sitemap and are the highest-value URLs on the site, but
 * enumerating them means paging the CMS and deciding how to handle
 * unpublished and out-of-stock products — its own piece of work, and not the
 * footer audit this file came out of. Listing a partial catalogue would be
 * worse than listing none: it tells Google those are the products that exist.
 *
 * ## What is excluded on purpose
 *
 * /panier, /favoris, /suivi-commande and /dashboard — per-visitor states with
 * nothing stable to index. They are disallowed in robots.ts for the same
 * reason.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/catalogue"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/marques"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/collections"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/rituels"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];

  const [publishedSlugs, posts] = await Promise.all([fetchPublishedPageSlugs(), fetchPosts(200)]);

  const institutional: MetadataRoute.Sitemap = publishedSlugs.map((slug) => ({
    url: absoluteUrl(`/${slug}`),
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  const blog: MetadataRoute.Sitemap =
    posts.length > 0
      ? [
          { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
          ...posts.map((post) => ({
            url: absoluteUrl(`/blog/${post.slug}`),
            lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
            changeFrequency: "monthly" as const,
            priority: 0.5,
          })),
        ]
      : [];

  return [...staticRoutes, ...institutional, ...blog];
}
