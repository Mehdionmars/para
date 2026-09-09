import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createProbeDatabase, serverReachable, type ProbeDatabase } from '../support/probeDatabase'

/**
 * Les contraintes d'intégrité, exécutées contre un vrai PostgreSQL.
 *
 * Une migration qui contient `ADD CONSTRAINT` ne prouve rien : ce qui compte
 * est que la base refuse effectivement l'écriture fautive. Chaque invariant
 * est donc éprouvé dans les deux sens — une valeur invalide doit être rejetée,
 * une valeur valide (y compris NULL là où la colonne est optionnelle) doit
 * passer.
 *
 * Le SQL testé est extrait du fichier de migration lui-même, pas recopié :
 * une contrainte retirée de la migration fait tomber ces tests.
 *
 * Tout se passe dans une base jetable, créée puis supprimée. La base de
 * développement n'est jamais ouverte.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATION = path.resolve(dirname, '../../src/migrations/20260823_140000_integrity_constraints.ts')

/** Récupère les blocs sql`…` d'une migration, dans l'ordre, pour `up`/`down`. */
function migrationSql(direction: 'up' | 'down'): string[] {
  const source = readFileSync(MIGRATION, 'utf8')
  const start = source.indexOf(`export async function ${direction}(`)
  if (start === -1) throw new Error(`bloc ${direction} introuvable dans la migration`)
  const end = direction === 'up' ? source.indexOf('export async function down(') : source.length
  const section = source.slice(start, end === -1 ? source.length : end)

  const blocks = [...section.matchAll(/sql`([\s\S]*?)`\s*\)/g)].map((m) => m[1])
  if (blocks.length === 0) throw new Error(`aucun bloc sql dans ${direction}`)
  return blocks
}

const reachable = await serverReachable()
let db: ProbeDatabase | null = null
let c: Client | null = null

/** Le schéma minimal que la migration touche, avec les mêmes types. */
const SCHEMA = `
  CREATE TABLE products (
    id serial PRIMARY KEY,
    stock numeric NOT NULL DEFAULT 0,
    price numeric NOT NULL DEFAULT 0,
    old_price numeric
  );
  CREATE TABLE products_variants (
    id serial PRIMARY KEY,
    stock numeric NOT NULL DEFAULT 0,
    price numeric
  );
  CREATE TABLE orders_items (
    id serial PRIMARY KEY,
    quantity numeric NOT NULL DEFAULT 1,
    price numeric NOT NULL DEFAULT 0
  );
  CREATE TABLE coupons (
    id serial PRIMARY KEY,
    usage_count numeric DEFAULT 0
  );
  CREATE TABLE coupon_redemptions (
    id serial PRIMARY KEY,
    coupon_id integer NOT NULL,
    discount_amount numeric NOT NULL DEFAULT 0
  );
`

beforeAll(async () => {
  if (!reachable) return
  db = await createProbeDatabase('para_constraints_probe')
  c = await db.connect()
  await c.query(SCHEMA)
  for (const block of migrationSql('up')) await c.query(block)
}, 60_000)

afterAll(async () => {
  await c?.end().catch(() => {})
  if (reachable && db) await db.drop()
}, 60_000)

/** Exécute et renvoie l'erreur, en exigeant que PostgreSQL ait refusé. */
async function refuse(sql: string, params: unknown[] = []): Promise<Error> {
  let caught: Error | null = null
  try {
    await c!.query(sql, params)
  } catch (err) {
    caught = err as Error
  }
  if (!caught) throw new Error(`PostgreSQL aurait dû refuser : ${sql}`)
  return caught
}

describe.skipIf(!reachable)('la migration est bien appliquée', () => {
  it('crée exactement les contraintes annoncées', async () => {
    const { rows } = await c!.query(
      `SELECT conname FROM pg_constraint WHERE contype IN ('c','f')
         AND connamespace = 'public'::regnamespace ORDER BY conname`,
    )
    const noms = rows.map((r) => r.conname as string)
    expect(noms).toEqual([
      'coupon_redemptions_coupon_id_fk',
      'coupon_redemptions_discount_non_negative',
      'coupons_usage_count_non_negative',
      'orders_items_price_non_negative',
      'orders_items_quantity_positive',
      'products_old_price_non_negative',
      'products_price_non_negative',
      'products_stock_non_negative',
      'products_variants_price_non_negative',
      'products_variants_stock_non_negative',
    ])
  })
})

describe.skipIf(!reachable)('le stock ne peut pas passer sous zéro', () => {
  it('refuse une insertion à stock négatif', async () => {
    const err = await refuse(`INSERT INTO products (stock) VALUES (-1)`)
    expect(err.message).toMatch(/products_stock_non_negative/)
  })

  it('refuse un décrément qui ferait passer sous zéro', async () => {
    // Le cas réel : la garde applicative `AND stock >= $1` absente ou
    // contournée, un UPDATE écrit à la main.
    await c!.query(`INSERT INTO products (id, stock) VALUES (900, 1)`)
    const err = await refuse(`UPDATE products SET stock = stock - 5 WHERE id = 900`)
    expect(err.message).toMatch(/products_stock_non_negative/)

    const { rows } = await c!.query(`SELECT stock FROM products WHERE id = 900`)
    expect(Number(rows[0].stock)).toBe(1) // inchangé
  })

  it('accepte zéro, qui est une rupture et non une erreur', async () => {
    await expect(c!.query(`INSERT INTO products (stock) VALUES (0)`)).resolves.toBeTruthy()
  })

  it('vaut aussi pour les variantes', async () => {
    const err = await refuse(`INSERT INTO products_variants (stock) VALUES (-1)`)
    expect(err.message).toMatch(/products_variants_stock_non_negative/)
  })
})

describe.skipIf(!reachable)('les prix', () => {
  it('refuse un prix négatif sur un produit et sur une variante', async () => {
    expect((await refuse(`INSERT INTO products (price) VALUES (-0.01)`)).message).toMatch(
      /products_price_non_negative/,
    )
    expect((await refuse(`INSERT INTO products_variants (price) VALUES (-1)`)).message).toMatch(
      /products_variants_price_non_negative/,
    )
  })

  it('refuse un prix barré négatif mais accepte son absence', async () => {
    expect((await refuse(`INSERT INTO products (old_price) VALUES (-1)`)).message).toMatch(
      /products_old_price_non_negative/,
    )
    // NULL veut dire « pas de prix barré » : une contrainte CHECK ne doit pas
    // transformer un champ optionnel en champ obligatoire.
    await expect(c!.query(`INSERT INTO products (old_price) VALUES (NULL)`)).resolves.toBeTruthy()
    await expect(c!.query(`INSERT INTO products_variants (price) VALUES (NULL)`)).resolves.toBeTruthy()
  })

  it('accepte la gratuité', async () => {
    await expect(c!.query(`INSERT INTO products (price) VALUES (0)`)).resolves.toBeTruthy()
  })
})

describe.skipIf(!reachable)('les lignes de commande', () => {
  it('refuse une quantité nulle ou négative', async () => {
    expect((await refuse(`INSERT INTO orders_items (quantity) VALUES (0)`)).message).toMatch(
      /orders_items_quantity_positive/,
    )
    expect((await refuse(`INSERT INTO orders_items (quantity) VALUES (-2)`)).message).toMatch(
      /orders_items_quantity_positive/,
    )
  })

  it('refuse un prix de ligne négatif', async () => {
    expect((await refuse(`INSERT INTO orders_items (quantity, price) VALUES (1, -5)`)).message).toMatch(
      /orders_items_price_non_negative/,
    )
  })

  it('accepte une ligne normale', async () => {
    await expect(c!.query(`INSERT INTO orders_items (quantity, price) VALUES (2, 242)`)).resolves.toBeTruthy()
  })
})

describe.skipIf(!reachable)('les coupons et leur registre', () => {
  it('refuse un compteur d’utilisation négatif, accepte son absence', async () => {
    expect((await refuse(`INSERT INTO coupons (usage_count) VALUES (-1)`)).message).toMatch(
      /coupons_usage_count_non_negative/,
    )
    await expect(c!.query(`INSERT INTO coupons (usage_count) VALUES (NULL)`)).resolves.toBeTruthy()
  })

  it('refuse une remise négative', async () => {
    await c!.query(`INSERT INTO coupons (id, usage_count) VALUES (500, 0)`)
    expect(
      (await refuse(`INSERT INTO coupon_redemptions (coupon_id, discount_amount) VALUES (500, -1)`)).message,
    ).toMatch(/coupon_redemptions_discount_non_negative/)
  })

  it('refuse une rédemption qui pointe vers un coupon inexistant', async () => {
    // C'est cette table que `evaluateCoupon` interroge pour compter les
    // utilisations par client : une référence pendante y fausserait le compte.
    const err = await refuse(`INSERT INTO coupon_redemptions (coupon_id, discount_amount) VALUES (999999, 10)`)
    expect(err.message).toMatch(/coupon_redemptions_coupon_id_fk|foreign key/i)
  })

  it('refuse de supprimer un coupon dont des remises ont été accordées', async () => {
    // RESTRICT et non CASCADE : le registre est la trace comptable des remises
    // consenties, supprimer le coupon ne doit pas effacer cet historique.
    await c!.query(`INSERT INTO coupons (id, usage_count) VALUES (501, 1)`)
    await c!.query(`INSERT INTO coupon_redemptions (coupon_id, discount_amount) VALUES (501, 25)`)

    const err = await refuse(`DELETE FROM coupons WHERE id = 501`)
    expect(err.message).toMatch(/coupon_redemptions|foreign key|violates/i)

    const { rows } = await c!.query(`SELECT count(*)::int AS n FROM coupon_redemptions WHERE coupon_id = 501`)
    expect(rows[0].n).toBe(1) // la trace est intacte
  })

  it('accepte une rédemption rattachée à un coupon existant', async () => {
    await c!.query(`INSERT INTO coupons (id, usage_count) VALUES (502, 0)`)
    await expect(
      c!.query(`INSERT INTO coupon_redemptions (coupon_id, discount_amount) VALUES (502, 30)`),
    ).resolves.toBeTruthy()
  })
})

describe.skipIf(!reachable)('le retour arrière', () => {
  it('retire les contraintes et laisse les données en place', async () => {
    // La migration doit être réversible sans perte : c'est ce qui permet de
    // revenir en arrière sur un déploiement sans restaurer une sauvegarde.
    const avant = await c!.query(`SELECT count(*)::int AS n FROM products`)

    for (const block of migrationSql('down')) await c!.query(block)

    const { rows } = await c!.query(
      `SELECT count(*)::int AS n FROM pg_constraint
        WHERE contype IN ('c','f') AND connamespace = 'public'::regnamespace`,
    )
    expect(rows[0].n).toBe(0)

    // Les lignes n'ont pas bougé…
    const apres = await c!.query(`SELECT count(*)::int AS n FROM products`)
    expect(apres.rows[0].n).toBe(avant.rows[0].n)

    // …et ce qui était refusé redevient possible, ce qui prouve que le retour
    // arrière a bien retiré la contrainte et pas seulement son nom.
    await expect(c!.query(`INSERT INTO products (stock) VALUES (-1)`)).resolves.toBeTruthy()

    // On remet la migration pour ne pas dépendre de l'ordre des tests.
    await c!.query(`DELETE FROM products WHERE stock < 0`)
    for (const block of migrationSql('up')) await c!.query(block)
  })
})
