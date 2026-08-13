import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_variant_option_type" AS ENUM('contenance', 'format', 'taille', 'couleur', 'parfum', 'pack', 'autre');
  ALTER TABLE "products" ADD COLUMN "has_variants" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "variant_option_type" "enum_products_variant_option_type" DEFAULT 'contenance';
  CREATE TABLE "products_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option_value" varchar,
  	"sku" varchar,
  	"barcode" varchar,
  	"price" numeric,
  	"old_price" numeric,
  	"stock" numeric DEFAULT 0,
  	"reserved_stock" numeric DEFAULT 0,
  	"low_stock_threshold" numeric DEFAULT 5,
  	"image_id" integer,
  	"active" boolean DEFAULT true
  );

  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_variants_order_idx" ON "products_variants" USING btree ("_order");
  CREATE INDEX "products_variants_parent_id_idx" ON "products_variants" USING btree ("_parent_id");
  CREATE INDEX "products_variants_image_idx" ON "products_variants" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_variants" CASCADE;
  ALTER TABLE "products" DROP COLUMN "has_variants";
  ALTER TABLE "products" DROP COLUMN "variant_option_type";
  DROP TYPE "public"."enum_products_variant_option_type";`)
}
