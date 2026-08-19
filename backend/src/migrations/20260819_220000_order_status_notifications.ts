import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Order status machine, status history, notifications and push subscriptions.
//
// Hand-written for the same reason as the coupons migration: `migrate:create`
// stops on interactive rename prompts against this schema.
//
// The status change is a *rename*, not an add-and-backfill:
//   paid       -> confirmed
//   processing -> preparing
// ALTER TYPE ... RENAME VALUE rewrites the label in place, so every existing
// order keeps its meaning and no row has to be touched. Adding new values and
// migrating data would have left the old labels in the enum forever, where
// they would eventually be selected again by mistake.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_orders_status" RENAME VALUE 'paid' TO 'confirmed';
    EXCEPTION WHEN invalid_parameter_value THEN null; END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_orders_status" RENAME VALUE 'processing' TO 'preparing';
    EXCEPTION WHEN invalid_parameter_value THEN null; END $$;
  `)

  // ------------------------------------------------------- status history
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "order_status_history" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer NOT NULL,
      "from_status" "public"."enum_orders_status",
      "to_status" "public"."enum_orders_status" NOT NULL,
      "changed_by_id" integer,
      "changed_by_email" varchar,
      "reason" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- ON DELETE set null, not cascade: removing a staff account must not
    -- erase the record of what they did. changed_by_email keeps the trace.
    DO $$ BEGIN
      ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_user_fk"
        FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id");
    CREATE INDEX IF NOT EXISTS "order_status_history_created_at_idx" ON "order_status_history" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "order_status_history_updated_at_idx" ON "order_status_history" USING btree ("updated_at");
  `)

  // -------------------------------------------------------- notifications
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_notifications_type" AS ENUM(
        'ORDER_CREATED','ORDER_CONFIRMED','ORDER_PREPARING','ORDER_SHIPPED',
        'ORDER_DELIVERED','ORDER_CANCELLED','ORDER_RETURNED','ORDER_REFUNDED');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_notifications_channel" AS ENUM('email','whatsapp','push','internal');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_notifications_status" AS ENUM('pending','sent','failed','read');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer,
      "customer_email" varchar,
      "type" "public"."enum_notifications_type" NOT NULL,
      "channel" "public"."enum_notifications_channel" NOT NULL,
      "status" "public"."enum_notifications_status" DEFAULT 'pending' NOT NULL,
      "title" varchar,
      "message" varchar,
      "metadata" jsonb,
      "sent_at" timestamp(3) with time zone,
      "read_at" timestamp(3) with time zone,
      "error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- THE idempotency key: orderId + event + channel. This unique index is
    -- what makes running the status hook twice produce one message instead
    -- of two; the service claims a row with ON CONFLICT DO NOTHING and sends
    -- only if it won. Application-level checks cannot provide this because
    -- two concurrent transactions would both read "nothing sent yet".
    CREATE UNIQUE INDEX IF NOT EXISTS "notifications_idempotency_idx"
      ON "notifications" USING btree ("order_id", "type", "channel");

    CREATE INDEX IF NOT EXISTS "notifications_customer_email_idx" ON "notifications" USING btree ("customer_email");
    CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");
    CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  `)

  // --------------------------------------------------- push subscriptions
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "push_subscriptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_email" varchar,
      "endpoint" varchar NOT NULL,
      "p256dh" varchar NOT NULL,
      "auth" varchar NOT NULL,
      "user_agent" varchar,
      "last_used_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");
    CREATE INDEX IF NOT EXISTS "push_subscriptions_customer_email_idx" ON "push_subscriptions" USING btree ("customer_email");
    CREATE INDEX IF NOT EXISTS "push_subscriptions_created_at_idx" ON "push_subscriptions" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "push_subscriptions_updated_at_idx" ON "push_subscriptions" USING btree ("updated_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "push_subscriptions" CASCADE;
    DROP TABLE IF EXISTS "notifications" CASCADE;
    DROP TABLE IF EXISTS "order_status_history" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_notifications_status";
    DROP TYPE IF EXISTS "public"."enum_notifications_channel";
    DROP TYPE IF EXISTS "public"."enum_notifications_type";
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_orders_status" RENAME VALUE 'confirmed' TO 'paid';
    EXCEPTION WHEN invalid_parameter_value THEN null; END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_orders_status" RENAME VALUE 'preparing' TO 'processing';
    EXCEPTION WHEN invalid_parameter_value THEN null; END $$;
  `)
}
