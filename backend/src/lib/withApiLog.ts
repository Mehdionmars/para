import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { checkRateLimit, clientIp, RATE_LIMITS, rateLimitedResponse } from './rateLimit'

// Rest args so dynamic segments work too: Next passes a `{ params }` context
// as the second argument to /api/notifications/[id]/read and friends, and it
// has to reach the handler untouched.
type RouteHandler<Args extends unknown[] = []> = (request: Request, ...args: Args) => Promise<Response>

/**
 * How much traffic is recorded.
 *
 * `withApiLog` and `apiMonitoringPlugin` together used to write one row per
 * request *and* one per Payload operation — including every product read the
 * storefront makes. That doubles the database's write load at exactly the
 * moment read traffic peaks, and grows an unbounded table while doing it: the
 * monitoring feature was the thing most likely to fall over first under the
 * load it exists to measure.
 *
 * Errors and writes are always kept — they are what anyone actually looks at,
 * and they are rare. Successful reads are sampled, because the hundredth
 * identical `GET /api/products 200 in 40ms` tells you nothing the first
 * did not.
 */
const SAMPLE_RATE = (() => {
  const raw = Number(process.env.API_LOG_SAMPLE_RATE)
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.05
})()

function shouldLog(method: string, statusCode: number): boolean {
  if (statusCode >= 400) return true
  if (method !== 'GET' && method !== 'HEAD') return true
  return Math.random() < SAMPLE_RATE
}

async function logRequest(path: string, method: string, statusCode: number, durationMs: number) {
  if (!shouldLog(method, statusCode)) return
  try {
    const payload = await getPayload({ config: configPromise })
    await payload.create({
      collection: 'api-request-logs',
      data: { durationMs, method, path, statusCode },
      depth: 0,
      disableTransaction: true,
      overrideAccess: true,
    })
  } catch {
    // Logging must never break the real request.
  }
}

/**
 * Wraps the custom route handlers that live outside Payload's collection/
 * global hook system (so `apiMonitoringPlugin` can't see them): applies the
 * route's rate limit, times the call, and records the result.
 *
 * Rate limiting lives here rather than in each handler because this wrapper
 * is already the one thing every custom route has in common — adding it per
 * route is how a route eventually ships without one. A route with no entry in
 * RATE_LIMITS is passed straight through, so wrapping is not the same as
 * limiting.
 */
export function withApiLog<Args extends unknown[] = []>(
  path: string,
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return async (request: Request, ...args: Args) => {
    const start = Date.now()

    if (RATE_LIMITS[path]) {
      try {
        const payload = await getPayload({ config: configPromise })
        const verdict = await checkRateLimit({
          identifier: clientIp(request.headers),
          payload,
          route: path,
        })
        if (!verdict.allowed) {
          void logRequest(path, request.method, 429, Date.now() - start)
          return rateLimitedResponse(verdict.retryAfterSeconds)
        }
      } catch {
        // Same fail-open contract as checkRateLimit itself: if the limiter
        // cannot run at all, the request still gets served.
      }
    }

    try {
      const response = await handler(request, ...args)
      void logRequest(path, request.method, response.status, Date.now() - start)
      return response
    } catch (err) {
      void logRequest(path, request.method, 500, Date.now() - start)
      throw err
    }
  }
}
