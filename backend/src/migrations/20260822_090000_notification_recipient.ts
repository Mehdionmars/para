import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Gives a notification an explicit recipient.
//
// Until now the table had no notion of *who* a notification was for. One
// column, `customer_email`, served two opposite purposes: the address an
// email was sent to, and a stray label on the in-app row that the shop's own
// team reads. A single ORDER_CONFIRMED wrote four rows all tagged with the
// customer's address, including the one destined for staff.
//
// `recipient_type` + `recipient_ref` make it explicit and polymorphic. Not a
// user foreign key: there are no customer accounts and no vendor role, and a
// supplier is an external contact — a (type, ref) pair covers all three
// without inventing entities.
//
// Purely additive. `customer_email` is left untouched so nothing reading it
// breaks; the new columns become the source of truth going forward.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_notifications_recipient_type" AS ENUM('staff', 'customer', 'supplier');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "notifications"
      ADD COLUMN IF NOT EXISTS "recipient_type" "public"."enum_notifications_recipient_type";
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "recipient_ref" varchar;
  `)

  // Backfill from what each row actually was, not from a blanket default.
  //
  // The internal channel is the shop's shared inbox — always staff, and with
  // no individual addressee, so `recipient_ref` stays null. Every external
  // channel on an order event went to the customer at `customer_email`.
  // External channels on a stock event went to the team's alert address.
  await db.execute(sql`
    UPDATE "notifications"
       SET recipient_type = 'staff', recipient_ref = NULL
     WHERE recipient_type IS NULL AND channel = 'internal';
  `)

  await db.execute(sql`
    UPDATE "notifications"
       SET recipient_type = 'customer', recipient_ref = customer_email
     WHERE recipient_type IS NULL AND order_id IS NOT NULL AND customer_email IS NOT NULL;
  `)

  // Stock alerts and anything else external: the team, at whatever address
  // was recorded (null when STOCK_ALERT_EMAIL was never configured).
  await db.execute(sql`
    UPDATE "notifications"
       SET recipient_type = 'staff', recipient_ref = customer_email
     WHERE recipient_type IS NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "notifications" ALTER COLUMN "recipient_type" SET DEFAULT 'staff';
    CREATE INDEX IF NOT EXISTS "notifications_recipient_type_idx"
      ON "notifications" USING btree ("recipient_type");
    -- Answers "everything addressed to this person", which is what a customer
    -- notification list will need.
    CREATE INDEX IF NOT EXISTS "notifications_recipient_idx"
      ON "notifications" USING btree ("recipient_type", "recipient_ref");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "notifications_recipient_idx";
    DROP INDEX IF EXISTS "notifications_recipient_type_idx";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "recipient_ref";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "recipient_type";
    DROP TYPE IF EXISTS "public"."enum_notifications_recipient_type";
  `)
}
