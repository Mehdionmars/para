// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Ce qui se passe quand le même checkout part deux fois.
 *
 * Aucun comportement n'est inventé ici : ces tests documentent l'état actuel,
 * pour qu'une décision métier se prenne sur des faits. Le constat est que
 * /api/checkout n'a aucune protection contre le doublon — ni clé
 * d'idempotence, ni référence unique par tentative, ni contrainte en base qui
 * ferait échouer la seconde écriture.
 *
 * Le numéro de commande ne joue pas ce rôle : `PDH-AAMMJJ-XXXX` est tiré au
 * hasard à chaque appel (collections/Orders.ts), donc deux soumissions
 * identiques reçoivent deux numéros différents et coexistent.
 *
 * Ce que le système protège déjà :
 *   - l'interface désactive le bouton pendant l'envoi (`disabled={submitting}`)
 *   - les notifications, elles, ont bien une clé d'idempotence (`dedupeKey`,
 *     index unique) — le motif est connu du projet, il n'est simplement pas
 *     appliqué au checkout
 *
 * Ce qu'il ne protège pas :
 *   - un renvoi réseau après expiration côté client
 *   - un double appui avant le re-rendu
 *   - un appel direct à l'API
 *
 * Conséquence mesurée plus bas : deux commandes, et le stock décrémenté deux
 * fois pour un seul achat.
 *
 * Seules les frontières sont simulées (pool pg, SDK Payload, notifications) ;
 * l'orchestration de la route est le vrai code testé.
 */

type Query = { params: unknown[]; sql: string }
type PricingFn = (...args: unknown[]) => Promise<unknown>

const h = vi.hoisted(() => ({
  evaluateCoupon: null as unknown as PricingFn,
  payload: null as unknown as Record<string, unknown>,
  resolveShipping: null as unknown as PricingFn,
}))

vi.mock('payload', () => ({ getPayload: async () => h.payload }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/notifications/service', () => ({ notifyOrderEvent: async () => {} }))
vi.mock('@/lib/notifications/stock', () => ({ notifyStockChange: async () => {} }))
vi.mock('@/lib/pricing', () => ({
  evaluateCoupon: (...args: unknown[]) => h.evaluateCoupon(...args),
  resolveShipping: (...args: unknown[]) => h.resolveShipping(...args),
}))

const { POST } = await import('@/app/api/checkout/route')

/**
 * Un environnement où le stock est réellement suivi d'un appel à l'autre : la
 * question posée est justement de savoir combien de fois il est décrémenté.
 */
function makeEnv(initialStock: number) {
  const queries: Query[] = []
  const created: { collection: string; data?: Record<string, unknown> }[] = []
  const stock = { value: initialStock }

  const answer = async (sql: string, params: unknown[]) => {
    queries.push({ params, sql })

    if (/FROM products WHERE id/.test(sql)) {
      return {
        rowCount: 1,
        rows: [
          {
            brand_id: null,
            category: 'visage',
            discontinued: false,
            has_variants: false,
            id: Number(params[0]),
            is_published: true,
            low_stock_threshold: 0,
            name: 'Crème',
            price: 100,
            sku: 'SKU-7',
            stock: stock.value,
            variant_option_type: null,
            variant_pricing_mode: 'same-price',
          },
        ],
      }
    }
    if (/UPDATE products SET stock = stock - /.test(sql)) {
      const [qty] = params as [number]
      // La garde du vrai SQL : refuse si le stock ne couvre pas la quantité.
      if (stock.value < qty) return { rowCount: 0, rows: [] }
      stock.value -= qty
      return { rowCount: 1, rows: [{ stock: stock.value }] }
    }
    if (/UPDATE products SET stock = stock \+ /.test(sql)) {
      const [qty] = params as [number]
      stock.value += qty
      return { rowCount: 1, rows: [] }
    }
    return { rowCount: 0, rows: [] }
  }

  const pool = {
    connect: async () => ({ query: answer, release: () => {} }),
    query: answer,
  }

  h.payload = {
    create: async ({ collection, data }: { collection: string; data?: Record<string, unknown> }) => {
      created.push({ collection, data })
      return { id: created.length, orderNumber: (data?.orderNumber as string) ?? `PDH-GEN-${created.length}` }
    },
    db: { pool },
    find: async () => ({ docs: [], totalDocs: 0 }),
    logger: { error: () => {}, info: () => {}, warn: () => {} },
  }

  return { created, queries, stock }
}

const body = () => ({
  address: '12 rue Test',
  city: 'Casablanca',
  email: 'shopper@example.com',
  lines: [{ id: 7, qty: 1 }],
  name: 'Test Shopper',
  phone: '0600000000',
})

const post = (payload: unknown) =>
  POST(new Request('http://localhost/api/checkout', { body: JSON.stringify(payload), method: 'POST' }))

const orders = (created: { collection: string }[]) => created.filter((c) => c.collection === 'orders')
const decrements = (queries: Query[]) => queries.filter((q) => /SET stock = stock - /.test(q.sql))

beforeEach(() => {
  h.evaluateCoupon = vi.fn(async () => ({ code: 'X', couponId: 1, discount: 0, eligibleSubtotal: 0, ok: true }))
  h.resolveShipping = vi.fn(async () => ({ cost: 25, freeFrom: null, label: 'Livraison', ruleId: 1 }))
})

describe('le même panier soumis deux fois', () => {
  it('crée deux commandes et prend le stock deux fois', async () => {
    // Le comportement réel aujourd'hui, épinglé pour qu'un changement soit
    // une décision et non une surprise : rien ne relie les deux requêtes.
    const env = makeEnv(5)

    const first = await post(body())
    const second = await post(body())

    expect(first.status).toBeLessThan(400)
    expect(second.status).toBeLessThan(400)
    expect(orders(env.created)).toHaveLength(2)
    expect(decrements(env.queries)).toHaveLength(2)
    expect(env.stock.value).toBe(3) // 5 - 1 - 1, pour un seul achat voulu
  })

  it("n'envoie aucun identifiant qui permettrait de rapprocher les deux requêtes", async () => {
    // La route ne fournit pas de numéro de commande : c'est la collection qui
    // en attribue un, via `defaultValue: generateOrderNumber` — donc un tirage
    // aléatoire neuf à chaque écriture. Son `unique: true` protège d'une
    // collision fortuite, pas d'un doublon : deux soumissions du même panier
    // reçoivent deux numéros différents et coexistent sans conflit.
    const env = makeEnv(5)

    await post(body())
    await post(body())

    for (const o of orders(env.created)) {
      const data = (o as { data?: Record<string, unknown> }).data ?? {}
      // Rien dans ce que la route écrit ne rattache la commande à *cette*
      // tentative précise plutôt qu'à une autre.
      for (const champ of ['orderNumber', 'idempotencyKey', 'requestId', 'clientReference']) {
        expect(data).not.toHaveProperty(champ)
      }
    }
    expect(orders(env.created)).toHaveLength(2)
  })

  it("n'exige ni ne lit la moindre clé d'idempotence", async () => {
    // Un client qui *voudrait* se protéger n'a aucun moyen de le faire : le
    // champ est simplement ignoré, il n'existe pas de contrat côté serveur.
    const env = makeEnv(5)

    await post({ ...body(), idempotencyKey: 'abc-123' })
    await post({ ...body(), idempotencyKey: 'abc-123' })

    expect(orders(env.created)).toHaveLength(2)
    for (const o of orders(env.created)) {
      expect((o as { data?: Record<string, unknown> }).data).not.toHaveProperty('idempotencyKey')
    }
  })

  it('deux envois simultanés se comportent comme deux envois successifs', async () => {
    // Le cas du double appui ou du renvoi réseau : aucune sérialisation ne les
    // départage, les deux aboutissent.
    const env = makeEnv(5)

    const [a, b] = await Promise.all([post(body()), post(body())])

    expect(a.status).toBeLessThan(400)
    expect(b.status).toBeLessThan(400)
    expect(orders(env.created)).toHaveLength(2)
    expect(env.stock.value).toBe(3)
  })
})

describe('ce que le stock protège malgré tout', () => {
  it('un doublon ne peut pas faire passer le stock sous zéro', async () => {
    // La garde `AND stock >= $1` tient même sans idempotence : le doublon
    // coûte une unité de trop, il ne crée pas de stock négatif.
    const env = makeEnv(1)

    const first = await post(body())
    const second = await post(body())

    expect(first.status).toBeLessThan(400)
    expect(second.status).toBe(409) // stock insuffisant
    expect(orders(env.created)).toHaveLength(1)
    expect(env.stock.value).toBe(0)
    expect(env.stock.value).toBeGreaterThanOrEqual(0)
  })
})
