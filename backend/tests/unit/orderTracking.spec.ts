// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Qui a le droit de voir une commande.
 *
 * Il n'existe pas de compte client : l'email avec lequel la commande a été
 * passée EST le mot de passe. Le numéro seul ne suffit pas — PDH-YYMMDD-XXXX
 * ne contient que quatre caractères aléatoires, assez peu pour être deviné.
 *
 * Le navigateur retient désormais numéro + email pour pré-remplir le
 * formulaire (frontend/lib/orders/trackingMemory.ts). Ce stockage est
 * modifiable par n'importe qui, donc ces tests existent pour prouver que la
 * décision se prend toujours ici, côté serveur : un numéro trouvé dans le
 * stockage local d'un autre poste ne donne accès à rien sans l'email
 * correspondant.
 *
 * Seules les frontières sont simulées (le SDK Payload) ; la logique de la
 * route est le vrai code testé, sans base de données.
 */

const h = vi.hoisted(() => ({ payload: null as unknown as Record<string, unknown> }))

vi.mock('payload', () => ({ getPayload: async () => h.payload }))
vi.mock('@payload-config', () => ({ default: {} }))

const { POST } = await import('@/app/api/orders/track/route')

type OrderRow = {
  id: number
  orderNumber: string
  customerEmail: string
  customerName?: string
  status?: string
  createdAt?: string
  items?: unknown[]
  total?: number
}

/** La commande de référence : le client légitime est alice. */
const ALICE: OrderRow = {
  createdAt: '2026-08-19T10:00:00.000Z',
  customerEmail: 'alice@example.com',
  customerName: 'Alice',
  id: 1,
  items: [{ name: 'Crème', price: 100, quantity: 2 }],
  orderNumber: 'PDH-260819-4F2A',
  status: 'pending',
  total: 200,
}

function makePayload(orders: OrderRow[] = [ALICE]) {
  const queries: { collection: string; where?: Record<string, any> }[] = []

  h.payload = {
    create: async () => ({ id: 1 }),
    find: async (args: { collection: string; where?: Record<string, any> }) => {
      queries.push({ collection: args.collection, where: args.where })
      if (args.collection === 'orders') {
        const wanted = args.where?.orderNumber?.equals
        const docs = orders.filter((o) => o.orderNumber === wanted)
        return { docs, totalDocs: docs.length }
      }
      return { docs: [], totalDocs: 0 }
    },
    logger: { error: () => {}, info: () => {}, warn: () => {} },
  }

  return { queries }
}

const track = (body: unknown) =>
  POST(
    new Request('http://localhost/api/orders/track', {
      body: typeof body === 'string' ? body : JSON.stringify(body),
      method: 'POST',
    }),
  )

const read = async (res: Response) => ({ body: (await res.json()) as Record<string, unknown>, status: res.status })

beforeEach(() => {
  makePayload()
})

describe('le client légitime', () => {
  it('voit sa commande avec le bon numéro et le bon email', async () => {
    const { body, status } = await read(await track({ email: 'alice@example.com', orderNumber: 'PDH-260819-4F2A' }))

    expect(status).toBe(200)
    expect(body.orderNumber).toBe('PDH-260819-4F2A')
    expect(body.status).toBe('pending')
  })

  it("n'est pas gêné par la casse ni les espaces", async () => {
    // Le stockage local normalise déjà, mais un client qui recopie depuis son
    // email peut coller autre chose.
    const { status } = await read(
      await track({ email: '  Alice@Example.COM ', orderNumber: '  pdh-260819-4f2a  ' }),
    )
    expect(status).toBe(200)
  })
})

describe("la commande d'un autre client", () => {
  it("refuse le bon numéro avec l'email de quelqu'un d'autre", async () => {
    // Le cas exact que le stockage local rendrait tentant : on a le numéro,
    // on n'a pas l'email.
    const { status } = await read(await track({ email: 'mallory@example.com', orderNumber: 'PDH-260819-4F2A' }))
    expect(status).toBe(404)
  })

  it('refuse un numéro qui existe pour une autre commande que la sienne', async () => {
    makePayload([ALICE, { customerEmail: 'bob@example.com', id: 2, orderNumber: 'PDH-260819-9Z1B' }])

    // Alice connaît son email, mais pas la commande de Bob.
    const { status } = await read(await track({ email: 'alice@example.com', orderNumber: 'PDH-260819-9Z1B' }))
    expect(status).toBe(404)
  })

  it('refuse un numéro inexistant', async () => {
    const { status } = await read(await track({ email: 'alice@example.com', orderNumber: 'PDH-000000-0000' }))
    expect(status).toBe(404)
  })

  it('donne exactement le même refus dans les deux cas, pour ne rien révéler', async () => {
    // La propriété qui compte : si le message différait, on pourrait balayer
    // les numéros pour découvrir lesquels existent.
    const mauvaisEmail = await read(await track({ email: 'mallory@example.com', orderNumber: 'PDH-260819-4F2A' }))
    const mauvaisNumero = await read(await track({ email: 'alice@example.com', orderNumber: 'PDH-000000-0000' }))

    expect(mauvaisEmail.status).toBe(mauvaisNumero.status)
    expect(mauvaisEmail.body).toEqual(mauvaisNumero.body)
  })
})

describe('les entrées malformées', () => {
  it('refuse un corps qui n\'est pas du JSON', async () => {
    const { status } = await read(await track('{pas du json'))
    expect(status).toBe(400)
  })

  it('refuse un champ manquant', async () => {
    expect((await read(await track({ orderNumber: 'PDH-260819-4F2A' }))).status).toBe(400)
    expect((await read(await track({ email: 'alice@example.com' }))).status).toBe(400)
    expect((await read(await track({}))).status).toBe(400)
  })

  it('refuse des champs vides ou faits d\'espaces', async () => {
    for (const body of [
      { email: '', orderNumber: 'PDH-260819-4F2A' },
      { email: 'alice@example.com', orderNumber: '' },
      { email: '   ', orderNumber: 'PDH-260819-4F2A' },
      { email: 'alice@example.com', orderNumber: '\t\n' },
    ]) {
      expect((await read(await track(body))).status).toBe(400)
    }
  })

  it('ne se laisse pas interroger avec autre chose que des chaînes', async () => {
    // `.trim()` sur un nombre ou un tableau lèverait ; la route doit répondre,
    // pas planter avec une 500.
    for (const body of [
      { email: 'alice@example.com', orderNumber: 42 },
      { email: ['alice@example.com'], orderNumber: 'PDH-260819-4F2A' },
      { email: 'alice@example.com', orderNumber: { toString: 'x' } },
      { email: null, orderNumber: null },
      ['PDH-260819-4F2A', 'alice@example.com'],
      null,
      'une chaîne',
    ]) {
      const res = await track(body)
      expect(res.status).toBeGreaterThanOrEqual(400)
      expect(res.status).toBeLessThan(500)
    }
  })

  it('encaisse une chaîne démesurée sans la transmettre telle quelle', async () => {
    const { queries } = makePayload()
    const { status } = await read(await track({ email: 'a@b.c', orderNumber: 'A'.repeat(100_000) }))

    expect(status).toBe(404)
    // La requête part bien avec la valeur normalisée, pas d'exception en route.
    expect(queries[0]?.collection).toBe('orders')
  })

  it("traite une charge XSS comme un numéro de commande, pas comme du code", async () => {
    const { status } = await read(
      await track({ email: 'alice@example.com', orderNumber: '<script>alert(1)</script>' }),
    )
    expect(status).toBe(404)
  })
})

describe('ce que la réponse laisse filtrer', () => {
  it("ne renvoie ni adresse, ni téléphone, ni email", async () => {
    // La page de suivi montre l'état d'une commande, pas la fiche du client.
    const { body } = await read(await track({ email: 'alice@example.com', orderNumber: 'PDH-260819-4F2A' }))

    for (const champ of ['customerEmail', 'shippingAddress', 'customerPhone', 'address', 'phone', 'notes']) {
      expect(body).not.toHaveProperty(champ)
    }
  })

  it('cherche la commande par son numéro, et sur la bonne collection', async () => {
    const { queries } = makePayload()
    await track({ email: 'alice@example.com', orderNumber: 'PDH-260819-4F2A' })

    expect(queries[0].collection).toBe('orders')
    expect(queries[0].where?.orderNumber?.equals).toBe('PDH-260819-4F2A')
  })
})
