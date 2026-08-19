import type { Payload } from 'payload'

/**
 * Purges the storefront's cache for a set of tags after a CMS save.
 *
 * This is what closes the loop on "no rebuild": the storefront caches the
 * published navigation by tag, and this call drops that entry the instant an
 * editor saves, so the next visitor gets the new configuration.
 *
 * Deliberately fire-and-forget and never throwing: a storefront that is down,
 * slow, or simply not configured must not make a content save fail. The worst
 * case is that the cached copy lives out its normal expiry.
 */
export async function revalidateStorefront(payload: Payload, tags: string[]): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET?.trim()
  // STOREFRONT_INTERNAL_URL first: in Docker the storefront answers on its
  // service name, while FRONTEND_URL is the browser-facing origin used for
  // CORS/CSRF and would point this container at itself.
  const base = (process.env.STOREFRONT_INTERNAL_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  )

  if (!secret) {
    payload.logger.debug('REVALIDATE_SECRET absent — purge du cache storefront ignorée.')
    return
  }

  try {
    const res = await fetch(`${base}/api/revalidate`, {
      body: JSON.stringify({ tags }),
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) {
      payload.logger.warn(`Purge du cache storefront refusée (HTTP ${res.status}) pour ${tags.join(', ')}`)
    }
  } catch (err) {
    payload.logger.warn(
      { err },
      `Purge du cache storefront injoignable pour ${tags.join(', ')} — le cache expirera de lui-même.`,
    )
  }
}
