import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Services → priceList + sortOrder.
//
// The institute's printed price list has ~90 prestations in eight families
// (Cheveux, Ongles, Épilation…). Each family is one Service, and `priceList`
// holds its lines: label, price in MAD, and whether the price is a floor
// ("À partir de"). A line with no price reads "À demander".
//
// `sortOrder` fixes the order of the cards on /services, which until now
// followed creation order.
//
// Services is not versioned, so there is no `_services_v` twin. Additive and
// safe to run twice.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "sort_order" numeric;

    CREATE TABLE IF NOT EXISTS "services_price_list" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "price" numeric,
      "from_price" boolean DEFAULT false
    );

    DO $$ BEGIN
      ALTER TABLE "services_price_list" ADD CONSTRAINT "services_price_list_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "services_price_list_order_idx" ON "services_price_list" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "services_price_list_parent_id_idx" ON "services_price_list" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "services_price_list" CASCADE;
    ALTER TABLE "services" DROP COLUMN IF EXISTS "sort_order";
  `)
}
