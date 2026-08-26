import type { CollectionConfig, Config, GlobalConfig, Payload, PayloadRequest } from 'payload'

import { ApiRequestLogs } from '../collections/ApiRequestLogs'

/**
 * Payload only pairs before/after hooks that share one `req` — this map is
 * how `afterOperation`/`afterError`/`afterRead`/`afterChange` recover the
 * timestamp their `before*` counterpart stashed, to compute `durationMs`.
 */
const requestStartTimes = new WeakMap<PayloadRequest, number>()

function requestPath(req: Pick<PayloadRequest, 'url'>): string {
  try {
    return new URL(req.url ?? '', 'http://localhost').pathname
  } catch {
    return req.url ?? ''
  }
}

type LogEntry = {
  collectionSlug?: string
  durationMs?: number
  ip?: string
  method?: string
  operation?: string
  path: string
  statusCode?: number
  userEmail?: string
}

/**
 * How much traffic is recorded.
 *
 * This plugin hooks `afterOperation` on *every* collection, so before
 * sampling it wrote one `api-request-logs` INSERT for every Payload
 * operation — including each product read the storefront performs. Every
 * page view therefore became several extra writes, which doubles the
 * database's write load precisely when read traffic peaks, and grows an
 * unbounded table while doing it. The monitoring feature was the component
 * most likely to fail first under the load it exists to measure.
 *
 * Errors and writes are kept in full: they are rare and they are what anyone
 * actually reads. Successful reads are sampled — the hundredth identical
 * `read products 200` adds nothing the first did not.
 *
 * Mirrors lib/withApiLog.ts, which samples the custom routes the same way and
 * on the same environment variable.
 */
const SAMPLE_RATE = (() => {
  const raw = Number(process.env.API_LOG_SAMPLE_RATE)
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.05
})()

const READ_OPERATIONS = new Set(['read', 'count', 'countVersions', 'readDistinct'])

function shouldLog(entry: LogEntry): boolean {
  if ((entry.statusCode ?? 200) >= 400) return true
  if (!entry.operation || !READ_OPERATIONS.has(entry.operation)) return true
  return Math.random() < SAMPLE_RATE
}

/** Fire-and-forget: a logging failure must never break the real request. */
function logRequest(payload: Payload | undefined, entry: LogEntry): void {
  if (!payload) return
  if (!shouldLog(entry)) return
  payload
    .create({ collection: 'api-request-logs', data: entry, disableTransaction: true, depth: 0, overrideAccess: true })
    .catch(() => undefined)
}

function baseFields(req: PayloadRequest) {
  const start = requestStartTimes.get(req)
  requestStartTimes.delete(req)
  return {
    durationMs: start !== undefined ? Date.now() - start : undefined,
    ip: req.headers?.get?.('x-forwarded-for') ?? undefined,
    method: req.method,
    path: requestPath(req),
    userEmail: (req.user as { email?: string } | null | undefined)?.email,
  }
}

/**
 * Not a manually-registered collection — injects `ApiRequestLogs` plus
 * before/after hooks on every other collection and global so REST, GraphQL,
 * and local-API traffic all get logged the same way, without hand-wiring
 * hooks into each of the ~18 existing collection/global files.
 */
export function apiMonitoringPlugin(incomingConfig: Config): Config {
  const collections: CollectionConfig[] = (incomingConfig.collections ?? []).map((collection) => {
    if (collection.slug === ApiRequestLogs.slug) return collection
    return {
      ...collection,
      hooks: {
        ...collection.hooks,
        afterOperation: [
          ...(collection.hooks?.afterOperation ?? []),
          (async (arg: { operation: string; req: PayloadRequest; result: unknown }) => {
            logRequest(arg.req.payload, {
              ...baseFields(arg.req),
              collectionSlug: collection.slug,
              operation: arg.operation,
              statusCode: 200,
            })
            return arg.result
          }) as CollectionConfig['hooks'] extends { afterOperation?: (infer H)[] } ? H : never,
        ],
        beforeOperation: [
          ...(collection.hooks?.beforeOperation ?? []),
          (({ req }: { req: PayloadRequest }) => {
            requestStartTimes.set(req, Date.now())
          }) as CollectionConfig['hooks'] extends { beforeOperation?: (infer H)[] } ? H : never,
        ],
      },
    }
  })

  const globals: GlobalConfig[] = (incomingConfig.globals ?? []).map((global) => ({
    ...global,
    hooks: {
      ...global.hooks,
      afterChange: [
        ...(global.hooks?.afterChange ?? []),
        (({ doc, req }: { doc: unknown; req: PayloadRequest }) => {
          logRequest(req.payload, { ...baseFields(req), operation: 'update', statusCode: 200 })
          return doc
        }) as GlobalConfig['hooks'] extends { afterChange?: (infer H)[] } ? H : never,
      ],
      afterRead: [
        ...(global.hooks?.afterRead ?? []),
        (({ doc, req }: { doc: unknown; req: PayloadRequest }) => {
          logRequest(req.payload, { ...baseFields(req), operation: 'read', statusCode: 200 })
          return doc
        }) as GlobalConfig['hooks'] extends { afterRead?: (infer H)[] } ? H : never,
      ],
      beforeChange: [
        ...(global.hooks?.beforeChange ?? []),
        (({ data, req }: { data: unknown; req: PayloadRequest }) => {
          requestStartTimes.set(req, Date.now())
          return data
        }) as GlobalConfig['hooks'] extends { beforeChange?: (infer H)[] } ? H : never,
      ],
      beforeRead: [
        ...(global.hooks?.beforeRead ?? []),
        (({ doc, req }: { doc: unknown; req: PayloadRequest }) => {
          requestStartTimes.set(req, Date.now())
          return doc
        }) as GlobalConfig['hooks'] extends { beforeRead?: (infer H)[] } ? H : never,
      ],
    },
  }))

  return {
    ...incomingConfig,
    collections: [...collections, ApiRequestLogs],
    globals,
    hooks: {
      ...incomingConfig.hooks,
      afterError: [
        ...(incomingConfig.hooks?.afterError ?? []),
        (async ({ error, req, result }: { error: Error; req?: PayloadRequest; result?: { status?: number } }) => {
          if (!req) return
          logRequest(req.payload, { ...baseFields(req), statusCode: result?.status ?? 500 })
          void error
        }) as NonNullable<Config['hooks']>['afterError'] extends (infer H)[] | undefined ? H : never,
      ],
    },
  }
}
