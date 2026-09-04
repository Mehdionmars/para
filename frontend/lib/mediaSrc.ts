/** Payload's own disk storage, used whenever Cloudinary is not configured. */
const CMS_FILE_PREFIX = "/api/media/file/";

/**
 * A browser-usable src for a URL the CMS reported.
 *
 * Payload returns relative URLs for files it stores itself, and there were two
 * wrong ways to turn those into something a browser could load, both of them
 * in the codebase:
 *
 *   - prefixing with CMS_URL, which is a *server-side* address. Locally that
 *     is http://localhost:3001 and the browser can reach it; in containers it
 *     becomes http://backend:3001, a name only the Docker network resolves.
 *   - handing the relative URL through untouched, which resolves against
 *     whichever app is rendering — where no such route exists.
 *
 * Both produced broken images while the page around them rendered perfectly,
 * and neither shows up in local development. This routes them through the
 * /api/cms-media proxy instead, which keeps media same-origin on the shop, the
 * dashboard, and anything else that renders them.
 *
 * Absolute URLs (Cloudinary, the Instagram CDN) are already public and are
 * returned untouched.
 *
 * Deliberately dependency-free so both a Server Component and a "use client"
 * module can import it.
 */
export function mediaSrc(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith(CMS_FILE_PREFIX)) {
    return `/api/cms-media/${url.slice(CMS_FILE_PREFIX.length)}`;
  }
  return url;
}
