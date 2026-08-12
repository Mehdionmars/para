import configPromise from '@payload-config'
import { getPayload } from 'payload'

type RouteHandler = (request: Request) => Promise<Response>

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
export function withApiLog(path: string, handler: RouteHandler): RouteHandler {
  return async (request: Request) => {
    const start = Date.now()
    try {
      const response = await handler(request)
      void logRequest(path, request.method, response.status, Date.now() - start)
      return response
    } catch (err) {
      void logRequest(path, request.method, 500, Date.now() - start)
      throw err
    }
  }
}
