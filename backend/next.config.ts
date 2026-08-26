import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * Security headers for the CMS/API origin.
 *
 * Deliberately different from the storefront's: this host serves Payload's
 * admin UI and the REST/GraphQL API, never public marketing pages. Nothing
 * here may be framed, and nothing here may be cached by an intermediary —
 * every response is either an admin screen or an API answer scoped to the
 * caller's access rules.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // The admin URL carries document ids; no Referer leaves this origin.
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

/**
 * Public read endpoints whose answer does not depend on who is asking, so
 * Cloudflare may hold one copy for everyone. `stale-while-revalidate` keeps
 * the edge serving during a revalidation rather than stampeding the origin.
 *
 * Nothing transactional is listed: stock and price are re-read from Postgres
 * inside /api/checkout on every order, so a cached listing can never cause an
 * oversell — at worst a shopper sees an availability that is a minute old and
 * gets a 409 at checkout, which is the same outcome as any sold-out race.
 */
const PUBLIC_CACHEABLE = [
  // Identical for every visitor — the counts are over the whole sellable
  // catalogue, not the caller's filters.
  { source: '/api/catalogue/facets', value: 'public, s-maxage=120, stale-while-revalidate=600' },
  { source: '/api/search/suggest', value: 'public, s-maxage=30, stale-while-revalidate=60' },
  { source: '/api/homepage/best-selling', value: 'public, s-maxage=300, stale-while-revalidate=600' },
]

const nextConfig: NextConfig = {
  output: 'standalone',

  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      {
        // Default-deny for the whole API surface. Payload evaluates access
        // control per request against the caller's session, so a shared cache
        // holding one of these answers would hand it to the next caller.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
      },
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }] },
      // The three endpoints that are genuinely public and identical for every
      // visitor, re-opened after the blanket rule above. Next applies these in
      // order and the last match for a given key wins, so this is what
      // Cloudflare ends up seeing on them.
      ...PUBLIC_CACHEABLE.map(({ source, value }) => ({
        source,
        headers: [{ key: 'Cache-Control', value }],
      })),
    ]
  },

  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
