// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { MAX_ATTEMPTS, retryNotificationDelivery } from '@/lib/notifications/retry'

vi.setConfig({ hookTimeout: 90_000, testTimeout: 60_000 })

let payload: Payload
const KEY = 'retry-test'

/** Inserts a delivery row directly; the retry path must work on any existing
 * notification regardless of which service created it. */
async function seed(opts: {
  channel: string
  status: string
  attempts?: number
  email?: string | null
  suffix: string
}): Promise<number> {
  const res = await payload.db.pool.query(
    `INSERT INTO notifications
       (type, channel, status, title, message, customer_email, attempts, dedupe_key, updated_at, created_at)
     VALUES ('ORDER_CREATED', $1::"enum_notifications_channel", $2::"enum_notifications_status",
             'Test', 'Corps du message', $3, $4, $5, now(), now())
     RETURNING id`,
    [
      opts.channel,
      opts.status,
      // `??` would swallow an explicit null (it triggers on null too), which
      // is exactly the case the "no recipient" test needs.
      opts.email === undefined ? 'retry@paradhiver.test' : opts.email,
      opts.attempts ?? 0,
      `${KEY}-${opts.suffix}`,
    ],
  )
  return Number(res.rows[0].id)
}

async function read(id: number) {
  const res = await payload.db.pool.query(
    'SELECT status, attempts, error, sent_at, dedupe_key FROM notifications WHERE id = $1',
    [id],
  )
  return res.rows[0] as { attempts: string; dedupe_key: string; error: string | null; sent_at: string | null; status: string }
}

/**
 * Counts only this suite's own rows.
 *
 * A global `count(*)` was flaky: vitest runs the spec files in parallel and
 * the stock suite inserts into the same table, so "the total is unchanged"
 * failed whenever the two overlapped. Scoping to the dedupe prefix measures
 * what this test actually asserts — that a retry creates nothing.
 */
async function countOwn(): Promise<number> {
  const res = await payload.db.pool.query(
    `SELECT count(*)::int AS n FROM notifications WHERE dedupe_key LIKE '${KEY}-%'`,
  )
  return res.rows[0].n
}

describe('Relance de livraison', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await payload.db.pool.query(`DELETE FROM notifications WHERE dedupe_key LIKE '${KEY}-%'`)
  })

  it('ne crée jamais une seconde notification', async () => {
    const id = await seed({ channel: 'email', status: 'failed', suffix: 'no-dup' })
    const before = await countOwn()

    await retryNotificationDelivery({ id, payload })

    // Le nombre total est inchangé : la relance porte sur la ligne existante.
    expect(await countOwn()).toBe(before)
  })

  it('conserve le même id et la même dedupeKey', async () => {
    const id = await seed({ channel: 'email', status: 'failed', suffix: 'same-key' })
    await retryNotificationDelivery({ id, payload })

    const row = await read(id)
    expect(row.dedupe_key).toBe(`${KEY}-same-key`)
  })

  it('incrémente les tentatives', async () => {
    const id = await seed({ attempts: 0, channel: 'email', status: 'failed', suffix: 'attempts' })

    const first = await retryNotificationDelivery({ id, payload })
    expect('attempts' in first ? first.attempts : 0).toBe(1)
    expect(Number((await read(id)).attempts)).toBe(1)

    await retryNotificationDelivery({ id, payload })
    expect(Number((await read(id)).attempts)).toBe(2)
  })

  it(`refuse au-delà de ${MAX_ATTEMPTS} tentatives`, async () => {
    const id = await seed({ attempts: MAX_ATTEMPTS, channel: 'email', status: 'failed', suffix: 'capped' })

    const result = await retryNotificationDelivery({ id, payload })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('max-attempts')
    // Le compteur ne bouge pas quand la relance est refusée.
    expect(Number((await read(id)).attempts)).toBe(MAX_ATTEMPTS)
  })

  it('refuse de relancer une notification déjà envoyée', async () => {
    const id = await seed({ channel: 'email', status: 'sent', suffix: 'already' })
    const result = await retryNotificationDelivery({ id, payload })
    expect(!result.ok && result.reason).toBe('already-sent')
  })

  it('refuse le canal interne — il n’y a rien à relancer', async () => {
    const id = await seed({ channel: 'internal', status: 'pending', suffix: 'internal' })
    const result = await retryNotificationDelivery({ id, payload })
    expect(!result.ok && result.reason).toBe('internal-channel')
  })

  it('refuse sans destinataire', async () => {
    const id = await seed({ channel: 'email', email: null, status: 'failed', suffix: 'no-recipient' })
    const result = await retryNotificationDelivery({ id, payload })
    expect(!result.ok && result.reason).toBe('no-recipient')
  })

  it('sans provider configuré : reste « pending », jamais « sent »', async () => {
    const id = await seed({ channel: 'email', status: 'failed', suffix: 'no-provider' })
    const result = await retryNotificationDelivery({ id, payload })

    expect(result.ok).toBe(false)
    const row = await read(id)
    expect(row.status).toBe('pending')
    expect(row.status).not.toBe('sent')
    expect(row.sent_at).toBeNull()
    // La raison est explicite pour le dashboard, pas un échec silencieux.
    expect(row.error).toMatch(/non configuré/i)
  })

  it('une notification introuvable est signalée sans effet de bord', async () => {
    const before = await countOwn()
    const result = await retryNotificationDelivery({ id: 999_999_999, payload })
    expect(!result.ok && result.reason).toBe('not-found')
    expect(await countOwn()).toBe(before)
  })

  it('la notification survit à un échec de livraison', async () => {
    const id = await seed({ channel: 'email', status: 'failed', suffix: 'survives' })
    await retryNotificationDelivery({ id, payload })

    const row = await read(id)
    // Toujours présente, avec son titre et son message intacts.
    expect(row).toBeDefined()
    const full = await payload.db.pool.query('SELECT title, message FROM notifications WHERE id = $1', [id])
    expect(full.rows[0].title).toBe('Test')
    expect(full.rows[0].message).toBe('Corps du message')
  })
})
