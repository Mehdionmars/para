import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Cloudflare sits in front in production and can add some of these itself,
 * but a header set at the origin also holds when a request reaches it
 * directly (a preview deploy, a health check, an origin URL that leaked) —
 * and it is the only place that survives a proxy misconfiguration.
 *
 * No Content-Security-Policy here on purpose: this storefront renders
 * CMS-authored inline colour variables, so a real CSP needs a nonce pipeline
 * through the layout. That is its own piece of work, tracked separately —
 * shipping a permissive `unsafe-inline` policy would only look like
 * protection.
 */
const SECURITY_HEADERS = [
  // Stops a browser from second-guessing a declared type — the mechanism
  // behind "upload a .png that sniffs as HTML".
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking. `frame-ancestors` is the modern form; X-Frame-Options is
  // kept for older browsers that ignore it.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  // Full URLs (which carry search terms and order numbers) stop leaking to
  // third-party origins in the Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Two years, subdomains included: admin.paradhiver.ma must never be
  // reachable over plain HTTP either.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  /**
   * `standalone` emits .next/standalone, which the Dockerfile copies into the
   * runner stage — without it that COPY fails and no image can be built.
   *
   * Vercel is the one platform that must NOT get it: it does its own tracing
   * and output packaging, and a standalone build is what destabilised the
   * deploy that removed this line. Keying off VERCEL (which Vercel always
   * sets) keeps that fix while letting every other build — Docker, local,
   * CI — produce the directory again. Only `next build` reads this; `next
   * dev` is unaffected either way.
   */
  output: process.env.VERCEL ? undefined : "standalone",
  /**
   * Hostnames the dev server accepts besides `localhost`.
   *
   * proxy.ts routes by host — `localhost` is the dashboard, anything else is
   * the shop — so developing or testing the storefront means reaching the dev
   * server under a different name. Without these listed, Next refuses the HMR
   * WebSocket for that origin and the dev client stalls before hydrating:
   * every page renders its server HTML and then nothing is interactive, which
   * looks exactly like an application bug and is not one.
   *
   * Development only; Next ignores this in a production build.
   */
  allowedDevOrigins: ["paradhiver.test", "admin.paradhiver.test", "127.0.0.1"],

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // The dashboard is not a public page and must never be cached by
      // Cloudflare or an intermediary — it renders per-session data.
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },

  // Brand pages moved from /shop/brand(s) to /marques — permanent redirects
  async redirects() {
    return [
      {
        source: "/shop/brands",
        destination: "/marques",
        permanent: true,
      },
      {
        source: "/shop/brand/:slug",
        destination: "/marques/:slug",
        permanent: true,
      },
    ];
  },

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [32, 48, 64, 96, 128, 160, 256, 384],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
    ],

    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;