import configPromise from '@payload-config'
import { getPayload } from 'payload'

// Rest args so dynamic segments work too: Next passes a `{ params }` context
// as the second argument to /api/notifications/[id]/read and friends, and it
// has to reach the handler untouched.
type RouteHandler<Args extends unknown[] = []> = (request: Request, ...args: Args) => Promise<Response>

async function logRequest(path: string, method: string, statusCode: number, durationMs: number) {
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
 * Wraps the handful of custom route handlers that live outside Payload's
 * collection/global hook system (so `apiMonitoringPlugin` can't see them) —
 * times the call and writes the same shape of row to `api-request-logs`.
 */
export function withApiLog<Args extends unknown[] = []>(
  path: string,
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return async (request: Request, ...args: Args) => {
    const start = Date.now()
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
