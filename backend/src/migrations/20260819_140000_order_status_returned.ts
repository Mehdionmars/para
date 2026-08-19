import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds "returned" to the order lifecycle, between delivered and refunded:
// goods physically came back, which is a distinct operational state from
// "we gave the money back" and releases stock on its own.
//
// Additive only — every existing order keeps its current status.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_status" ADD VALUE IF NOT EXISTS 'returned';
  `)
}

// Postgres cannot drop an enum value. Rolling back would require recreating
// the type and would fail against any order already marked returned, so the
// value is left in place; nothing reads it once the code is reverted.
export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally a no-op — see above.
}
