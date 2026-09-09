// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { claimPaymentEvent, hashPayload } from '@/lib/paymentEvents'

/**
 * A payment webhook delivered more than once.
 *
 * Every provider retries — at-least-once is the delivery guarantee they all
 * offer, which means duplicates are the normal case and not the incident. A
 * confirmation processed twice sends two emails, writes two invoices and can
 * move stock a second time, and none of that can be taken back afterwards.
 *
 * The guard is a UNIQUE index on (provider, provider_event_id) plus an
 * `INSERT … ON CONFLICT DO NOTHING`. These tests exercise the two shapes that
 * fail differently:
 *
 *   - sequential redelivery -> the second insert conflicts and returns no row
 *   - simultaneous burst    -> N inserts race, exactly one wins
 *
 * The second is the one a `SELECT` then `INSERT` implementation would fail,
 * and it is the reason the claim is a single statement.
 */

let payload: Payload
const createdEventIds: number[] = []
const EVENT_PREFIX = `evt_test_${Date.now()}`

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  for (const id of createdEventIds) {
    await payload.delete({ collection: 'payment-events', id, overrideAccess: true }).catch(() => {})
  }
})

async function claim(eventId: string, rawBody = '{"amount":24900}') {
  const result = await claimPaymentEvent({
    eventType: 'payment.succeeded',
    payload,
    provider: 'cmi',
    providerEventId: eventId,
    rawBody,
  })
  if (result.outcome === 'claimed') createdEventIds.push(result.eventId)
  return result
}

describe('payment webhook deduplication', () => {
  it('claims a first delivery and refuses the two that follow', async () => {
    const eventId = `${EVENT_PREFIX}_seq`

    const first = await claim(eventId)
    const second = await claim(eventId)
    const third = await claim(eventId)

    expect(first.outcome).toBe('claimed')
    expect(second.outcome).toBe('duplicate')
    expect(third.outcome).toBe('duplicate')

    // One row, not three. This is what stops the side effects.
    const { totalDocs } = await payload.find({
      collection: 'payment-events',
      overrideAccess: true,
      where: { providerEventId: { equals: eventId } },
    })
    expect(totalDocs).toBe(1)
  })

  it('lets exactly one of a simultaneous burst through', async () => {
    const eventId = `${EVENT_PREFIX}_burst`

    const results = await Promise.all(Array.from({ length: 8 }, () => claim(eventId)))

    const claimed = results.filter((r) => r.outcome === 'claimed')
    const duplicates = results.filter((r) => r.outcome === 'duplicate')

    expect(claimed).toHaveLength(1)
    expect(duplicates).toHaveLength(7)
  })

  it('does not confuse two providers using the same event id', async () => {
    // Providers are under no obligation to namespace their ids against each
    // other, so the uniqueness has to be scoped by provider or a CMI event
    // would silently suppress an identically-numbered one from elsewhere.
    const eventId = `${EVENT_PREFIX}_shared`

    const cmi = await claimPaymentEvent({ payload, provider: 'cmi', providerEventId: eventId })
    const other = await claimPaymentEvent({ payload, provider: 'other', providerEventId: eventId })

    if (cmi.outcome === 'claimed') createdEventIds.push(cmi.eventId)
    if (other.outcome === 'claimed') createdEventIds.push(other.eventId)

    expect(cmi.outcome).toBe('claimed')
    expect(other.outcome).toBe('claimed')
  })

  it('records the outcome without storing the provider payload', async () => {
    const eventId = `${EVENT_PREFIX}_processed`
    const rawBody = '{"amount":24900,"card":"4111111111111111","holder":"Jean Test"}'

    const result = await claim(eventId, rawBody)
    expect(result.outcome).toBe('claimed')
    if (result.outcome !== 'claimed') return

    await result.markProcessed()

    const doc = await payload.findByID({
      collection: 'payment-events',
      id: result.eventId,
      overrideAccess: true,
    })

    expect(doc.status).toBe('processed')
    expect(doc.processedAt).toBeTruthy()
    expect(doc.payloadHash).toBe(hashPayload(rawBody))

    // The decisive assertion. A webhook log is exactly the table that gets
    // exported to debug something and then forgotten in a bucket, so nothing
    // out of the provider's body may be in it.
    const serialised = JSON.stringify(doc)
    expect(serialised).not.toContain('4111111111111111')
    expect(serialised).not.toContain('Jean Test')
  })

  it('marks a failed event without releasing the claim', async () => {
    const eventId = `${EVENT_PREFIX}_failed`

    const result = await claim(eventId)
    expect(result.outcome).toBe('claimed')
    if (result.outcome !== 'claimed') return

    await result.markFailed('Commande introuvable pour cet événement.')

    // Failure does not free the id: a redelivery of an event we already tried
    // and could not handle must not re-enter the same work. It is surfaced in
    // the admin as `failed` and dealt with once, by a human.
    const redelivered = await claim(eventId)
    expect(redelivered.outcome).toBe('duplicate')

    const doc = await payload.findByID({
      collection: 'payment-events',
      id: result.eventId,
      overrideAccess: true,
    })
    expect(doc.status).toBe('failed')
  })
})
