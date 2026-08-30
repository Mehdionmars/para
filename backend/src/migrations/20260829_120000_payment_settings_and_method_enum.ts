import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payment methods, made real.
 *
 * Two things ship together because one depends on the other:
 *
 * 1. `payment_settings` — the new global holding which methods are offered
 *    and the bank coordinates for a transfer. No `_v` table: this is
 *    operational configuration, not editorial copy, so it has no drafts.
 *    Every bank column starts NULL on purpose. Inventing a RIB here, even a
 *    placeholder one, would put a wrong account number in front of paying
 *    customers the moment someone switched the method on — which is why
 *    `bank_transfer_enabled` also defaults to false and the global refuses
 *    to be enabled until the details are filled in.
 *
 * 2. `orders.payment_method` — varchar to enum.
 *
 * ## Why the second half is not cosmetic
 *
 * The column held the *display string* 'À la livraison' on all 323 existing
 * orders, written by a hardcoded literal in /api/checkout. The dashboard
 * meanwhile keys its label map on 'cod' / 'cmi', so it never matched a row
 * and fell through to printing the stored French text — the wording had
 * quietly become the data, and re-labelling the UI would have rewritten the
 * meaning of past orders.
 *
 * The conversion maps that one known string onto `cash_on_delivery`, which
 * is what those orders factually were: the shop has never had another way to
 * pay. Anything unrecognised is coerced to the same value rather than
 * throwing, because a migration that aborts halfway through a deploy is a
 * worse failure than a mislabelled legacy row — and `to_regclass` confirmed
 * there is no `_orders_v` shadow copy to keep in step.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payment_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "cod_enabled" boolean DEFAULT true,
      "cod_description" varchar DEFAULT 'Payez en espèces lors de la réception de votre commande.',
      "bank_transfer_enabled" boolean DEFAULT false,
      "bank_transfer_description" varchar DEFAULT 'Effectuez un virement bancaire avant l''expédition de votre commande.',
      "bank_beneficiary" varchar,
      "bank_bank_name" varchar,
      "bank_rib" varchar,
      "bank_iban" varchar,
      "bank_bic" varchar,
      "bank_instructions" varchar,
      "updated_at" timestamp with time zone,
      "created_at" timestamp with time zone
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_orders_payment_method" AS ENUM ('cash_on_delivery', 'bank_transfer');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  // Normalise before the type change: the cast below fails on any value that
  // is not already a member of the enum, so every legacy string has to be
  // mapped first.
  await db.execute(sql`
    UPDATE "orders"
    SET "payment_method" = 'cash_on_delivery'
    WHERE "payment_method" IS NOT NULL
      AND "payment_method" NOT IN ('cash_on_delivery', 'bank_transfer');
  `)

  await db.execute(sql`
    ALTER TABLE "orders"
      ALTER COLUMN "payment_method" DROP DEFAULT;
    ALTER TABLE "orders"
      ALTER COLUMN "payment_method" TYPE "enum_orders_payment_method"
      USING "payment_method"::"enum_orders_payment_method";
    ALTER TABLE "orders"
      ALTER COLUMN "payment_method" SET DEFAULT 'cash_on_delivery';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Back to varchar with the codes intact rather than the old French string:
  // the label belongs to the UI, and restoring it here would re-create the
  // bug this migration removed.
  await db.execute(sql`
    ALTER TABLE "orders"
      ALTER COLUMN "payment_method" DROP DEFAULT;
    ALTER TABLE "orders"
      ALTER COLUMN "payment_method" TYPE varchar USING "payment_method"::text;
  `)
  await db.execute(sql`DROP TYPE IF EXISTS "enum_orders_payment_method";`)
  await db.execute(sql`DROP TABLE IF EXISTS "payment_settings";`)
}
