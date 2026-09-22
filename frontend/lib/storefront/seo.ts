import type { Metadata } from "next";
import { fetchInstitutionalPage, isPageEmpty, type InstitutionalSlug } from "@/lib/storefront/institutional";

/**
 * The origin the storefront is served from, for canonicals and Open Graph.
 *
 * NEXT_PUBLIC_SITE_URL is already how this app knows its own address — but it
 * cannot be trusted blindly here. `frontend/.env.local` sets it to
 * http://localhost:3000, and docker-compose.yml passes that same file to the
 * frontend service as its `env_file`, so a deployed container reads
 * "localhost" as its public origin. That is harmless for the uses it had
 * before (nothing rendered it into the page) and actively damaging for these:
 * a canonical or a sitemap <loc> pointing at localhost tells Google the real
 * URL does not exist.
 *
 * So a loopback origin is refused in production and the real domain is used
 * instead. In development localhost is exactly right and passes through.
 */
const CONFIGURED_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
const PRODUCTION_SITE_URL = "https://paradhiver.ma";

const isLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(CONFIGURED_SITE_URL);

export const SITE_URL =
  !CONFIGURED_SITE_URL || (isLoopback && process.env.NODE_ENV === "production")
    ? PRODUCTION_SITE_URL
    : CONFIGURED_SITE_URL;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Metadata for an institutional page, driven by what the CMS actually holds.
 *
 * The important part is the robots rule. These pages answer 200 whether or not
 * the pharmacy has written them, because a 404 on /cgv is worse than a page
 * saying the document is coming. But an unwritten page must not be indexed —
 * so `noindex` is set exactly while the document is empty, and lifts by itself
 * on the first publish. Nothing to remember, nothing to undo.
 *
 * Legal pages carry no Open Graph image and no promotional description on
 * purpose: they are documents, not landing pages.
 */
export async function institutionalMetadata(
  slug: InstitutionalSlug,
  fallbackTitle: string,
  path: string,
  fallbackDescription?: string,
): Promise<Metadata> {
  const page = await fetchInstitutionalPage(slug);
  const empty = isPageEmpty(page);

  const title = page?.seo.metaTitle || `${page?.title || fallbackTitle} — Para d'Hiver`;
  const description = page?.seo.metaDescription || page?.intro || fallbackDescription || "";
  const url = absoluteUrl(path);

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      siteName: "Para d'Hiver",
      locale: "fr_MA",
      type: "article",
    },
    robots: empty ? { index: false, follow: true } : { index: true, follow: true },
  };
}
