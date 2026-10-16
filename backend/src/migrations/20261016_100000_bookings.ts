import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Bookings: service appointments, which until now were never stored — the
// booking page announced "Réservation confirmée" and sent nothing anywhere.
//
// Beside the table Payload expects for the collection:
//
// - `bookings_slot_held_idx`, a partial unique index on (service, date, time)
//   over the statuses that hold a slot. It is what stops two customers
//   booking the same slot in the same instant: both inserts reach the
//   database, one wins, the other gets a unique violation that
//   POST /api/booking-requests turns into "créneau déjà pris". Cancelled and done
//   rows fall outside the index, so a cancelled slot can be booked again.
//
// - BOOKING_REQUESTED on the notifications type enum, for the staff alert.
//
// - `bookings_id` on payload_locked_documents_rels: every update and delete
//   joins that table on one column per collection, and a collection without
//   its column breaks saving anything (see 20261013_110000_pages_posts_faqs).
//
// Safe to run twice: every statement is IF NOT EXISTS or guarded.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_bookings_status" AS ENUM('pending', 'confirmed', 'cancelled', 'done');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "bookings" (
      "id" serial PRIMARY KEY NOT NULL,
      "service_id" integer,
      "service_title" varchar,
      "date" varchar NOT NULL,
      "time" varchar NOT NULL,
      "status" "enum_bookings_status" DEFAULT 'pending' NOT NULL,
      "customer_name" varchar NOT NULL,
      "customer_phone" varchar NOT NULL,
      "customer_email" varchar,
      "note" varchar,
      "staff_note" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk"
        FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "bookings_service_idx" ON "bookings" USING btree ("service_id");
    CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "bookings_date_idx" ON "bookings" USING btree ("date");
    CREATE INDEX IF NOT EXISTS "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "bookings_slot_held_idx" ON "bookings" ("service_id", "date", "time")
      WHERE "status" IN ('pending', 'confirmed');

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bookings_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk"
        FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");

    ALTER TYPE "public"."enum_notifications_type" ADD VALUE IF NOT EXISTS 'BOOKING_REQUESTED';
  `)
}

// The enum value is left in place: Postgres cannot drop a value from an enum,
// and an unused one is harmless.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bookings_id";
    DROP TABLE IF EXISTS "bookings" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_bookings_status";
  `)
}
