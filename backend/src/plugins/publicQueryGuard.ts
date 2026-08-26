import type { CollectionConfig, Config, PayloadRequest } from 'payload'

import { STAFF_ROLES, userHasRole, type Role } from '../access/roles'

/**
 * Caps what an anonymous caller can ask Payload's REST/GraphQL API to do in
 * one request.
 *
 * Several collections are `read: () => true` because the storefront has no
 * session — Products, Brands, Categories, Media, Services, Stores,
 * ShippingRules, InstagramPosts. That is correct, but it also means the query
 * string is under the visitor's control, and Payload takes it literally:
 *
 *   GET /api/products?limit=0     -> `limit: 0` means *no limit* in Payload,
 *                                    so this dumps the entire catalogue in
 *                                    one response.
 *   GET /api/products?depth=10    -> ten levels of relationship population,
 *                                    a fan-out of joins per returned row.
 *
 * Neither is something the storefront ever sends (its own fetches are all
 * bounded), so clamping them costs nothing and removes a free amplification
 * factor: one cheap request that turns into an arbitrarily expensive query.
 *
 * Staff are left alone — the admin UI legitimately asks for deeper
 * population — and so is the Local API, which arrives with
 * `overrideAccess: true` and is trusted server code by definition.
 */

/** A page of 100 is more than any storefront view renders; the catalogue's
 * own grid asks for 24. */
export const MAX_PUBLIC_LIMIT = 100

/** The deepest the storefront goes is the product detail page, at 2. */
export const MAX_PUBLIC_DEPTH = 2

type FindArgs = {
  depth?: number
  limit?: number
  req?: PayloadRequest
  [key: string]: unknown
}

function isTrustedCaller(req: PayloadRequest | undefined, overrideAccess: boolean | undefined): boolean {
  if (overrideAccess) return true
  return userHasRole(req?.user as { roles?: Role[] | null } | null | undefined, ...STAFF_ROLES)
}

function clamp(args: FindArgs): FindArgs | undefined {
  const limit = Number(args.limit)
  const depth = Number(args.depth)

  // `limit: 0` is Payload's "unbounded" sentinel, so it has to be treated as
  // over the cap rather than under it.
  const needsLimit = !Number.isFinite(limit) || limit <= 0 || limit > MAX_PUBLIC_LIMIT
  const needsDepth = Number.isFinite(depth) && depth > MAX_PUBLIC_DEPTH

  if (!needsLimit && !needsDepth) return undefined

  return {
    ...args,
    ...(needsDepth ? { depth: MAX_PUBLIC_DEPTH } : {}),
    ...(needsLimit ? { limit: MAX_PUBLIC_LIMIT } : {}),
  }
}

/**
 * Injects the clamp as a `beforeOperation` hook on every collection.
 *
 * `beforeOperation` is the only hook that can still change `limit`/`depth`:
 * `findOperation` reassigns its own `args` from the hook's return value and
 * destructures both out of it immediately afterwards
 * (`node_modules/payload/dist/collections/operations/find.js:26-33`).
 */
export function publicQueryGuard(incomingConfig: Config): Config {
  const collections: CollectionConfig[] = (incomingConfig.collections ?? []).map((collection) => ({
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeOperation: [
        ...(collection.hooks?.beforeOperation ?? []),
        (({
          args,
          operation,
          overrideAccess,
          req,
        }: {
          args: FindArgs
          operation: string
          overrideAccess?: boolean
          req: PayloadRequest
        }) => {
          // Only reads carry a limit/depth worth capping; writes are already
          // gated by access control and their own payload-size limits.
          if (operation !== 'read') return
          if (isTrustedCaller(req, overrideAccess)) return
          return clamp(args)
        }) as NonNullable<CollectionConfig['hooks']>['beforeOperation'] extends (infer H)[] | undefined ? H : never,
      ],
    },
  }))

  return { ...incomingConfig, collections }
}
