import { CMS_URL } from "@/lib/dashboard/constants";

/**
 * Serves CMS-stored media from this app's own origin.
 *
 * When Cloudinary is not configured, Payload stores uploads on its own disk
 * and reports them as relative URLs (`/api/media/file/x.png`). Those were
 * resolved against `CMS_URL` and handed straight to the browser — which works
 * locally, where CMS_URL is `http://localhost:3001`, and breaks the moment the
 * two run as containers: CMS_URL becomes `http://backend:3001`, a name that
 * only exists inside the Docker network, and every image 404s in the browser
 * while the page around it renders perfectly.
 *
 * Proxying makes media same-origin, which also sidesteps two problems that
 * would otherwise arrive with it: next/image needs no `remotePatterns` entry
 * per deployment host, and a self-signed certificate on the CMS origin cannot
 * silently block the images (a browser lets you click through a certificate
 * warning for a page, never for a subresource).
 *
 * A route handler rather than a `rewrites()` entry on purpose: rewrite
 * destinations are baked when `next build` runs, and CMS_URL is injected at
 * container start. A rewrite would freeze whatever the build host happened to
 * have — usually nothing.
 */
export async function GET(request: Request) {
  const { pathname, search } = new URL(request.url);
  const file = pathname.replace(/^\/cms-media\//, "");

  // Path traversal would let a crafted URL reach any CMS route, not just the
  // media directory.
  if (!file || file.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${CMS_URL}/api/media/file/${file}${search}`, {
      // The CMS is the cache authority for its own files; this hop should not
      // hold a second, staler copy of them.
      cache: "no-store",
    });
  } catch {
    return new Response("Media unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  const type = upstream.headers.get("content-type");
  const length = upstream.headers.get("content-length");
  if (type) headers.set("content-type", type);
  if (length) headers.set("content-length", length);

  // An hour, not a year: these filenames are not content-hashed, so replacing
  // an image in the CMS reuses its URL. `stale-while-revalidate` keeps the
  // page fast without pinning a replaced image for a day.
  headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");

  return new Response(upstream.body, { headers, status: 200 });
}
