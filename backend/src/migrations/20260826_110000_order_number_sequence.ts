import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * A real sequence behind `orderNumber`.
 *
 * It was `PDH-YYMMDD-` plus four random base36 characters, on a column with a
 * UNIQUE constraint. That is 36^4 = 1 679 616 values per day, and by the
 * birthday bound a collision becomes likely far sooner than that suggests:
 * around 1 500 orders in one day there is roughly a 50% chance that two of
 * them draw the same suffix. The loser does not get a retry — the unique
 * index rejects the INSERT and the shopper gets a 500 *after* their stock has
 * already been decremented and committed.
 *
 * A sequence cannot collide. It is also monotonic, which means order numbers
 * sort chronologically — something the back office reasonably assumed was
 * already true.
 *
 * The counter starts above the highest existing order id so historical
 * numbers keep their shape and no new number can look like an old one.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "order_number_seq" AS bigint START WITH 1000 INCREMENT BY 1;`)

  // Start clear of anything already issued, so a fresh sequence on an
  // existing database can never produce a suffix that is already taken.
  await db.execute(sql`
    SELECT setval('order_number_seq', GREATEST(1000, (SELECT COALESCE(MAX(id), 0) * 10 FROM "orders")));
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SEQUENCE IF EXISTS "order_number_seq";`)
}
