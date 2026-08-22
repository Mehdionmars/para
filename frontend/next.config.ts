import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Brand pages moved from /shop/brand(s) to /marques — permanent redirects
  // so old bookmarked/indexed/shared links keep working. Product URLs moved
  // from a numeric id to a slug, but that migration is handled inside
  // app/(site)/produit/[slug]/page.tsx itself (it needs a DB lookup to know
  // the id -> slug mapping, which a static redirects() entry can't do).
  async redirects() {
    return [
      { source: "/shop/brands", destination: "/marques", permanent: true },
      { source: "/shop/brand/:slug", destination: "/marques/:slug", permanent: true },
    ];
  },
  images: {
    // Trimmed from Next's defaults (which top out at 2048/3840): every entry
    // here becomes a real derived asset in Cloudinary the first time it's
    // requested, and nothing in this storefront lays out an image wider than
    // ~1600px. Keeping the set small keeps both the derivative count and the
    // CDN cache hit rate sane across thousands of SKUs.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [32, 48, 64, 96, 128, 160, 256, 384],
    remotePatterns: [
      // Cloudinary-hosted media once the backend has real credentials.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // The Payload dev server's local-disk media fallback.
      { protocol: "http", hostname: "localhost", port: "3001" },
      // Instagram Graph API media URLs (synced posts) — hostnames vary by
      // CDN shard (scontent-xxN-N.cdninstagram.com) and account region.
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
    ],
    // Only needed for the localhost:3001 fallback above, never for Cloudinary URLs.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    // Needed for /assets/product-placeholder.svg (the "no photo yet" card
    // fallback) — a single locally-authored file, not user-uploaded content,
    // so the usual SVG/XSS risk this flag guards against doesn't apply here.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;

// Dev-only Cloudflare bindings emulation (spawns a local workerd process) —
// must never run during `next build`: unconditional, it also fires there,
// and the production Docker build has no workerd binary available, crashing
// the build with an unrelated-looking ENOENT.
if (process.env.NODE_ENV !== "production") {
  import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
}
