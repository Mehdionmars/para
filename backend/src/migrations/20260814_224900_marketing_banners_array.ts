import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_image_id";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_image_mobile_id";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_eyebrow";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_title";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_description";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_cta_label";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_cta_url";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_badge_label";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_start_date";
  ALTER TABLE "home" DROP COLUMN IF EXISTS "marketing_banner_copy_end_date";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_image_id";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_image_mobile_id";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_eyebrow";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_title";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_description";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_cta_label";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_cta_url";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_badge_label";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_start_date";
  ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_marketing_banner_copy_end_date";

  CREATE TYPE "public"."enum_home_marketing_banners_image_mode" AS ENUM('overlay', 'imageOnly');
  CREATE TYPE "public"."enum__home_v_version_marketing_banners_image_mode" AS ENUM('overlay', 'imageOnly');

  CREATE TABLE "home_marketing_banners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"campaign" varchar,
  	"image_id" integer,
  	"image_mobile_id" integer,
  	"image_mode" "enum_home_marketing_banners_image_mode" DEFAULT 'overlay',
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar DEFAULT '/catalogue',
  	"badge_label" varchar,
  	"active" boolean DEFAULT true,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone
  );

  ALTER TABLE "home_marketing_banners" ADD CONSTRAINT "home_marketing_banners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_marketing_banners" ADD CONSTRAINT "home_marketing_banners_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_marketing_banners" ADD CONSTRAINT "home_marketing_banners_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_marketing_banners_order_idx" ON "home_marketing_banners" USING btree ("_order");
  CREATE INDEX "home_marketing_banners_parent_id_idx" ON "home_marketing_banners" USING btree ("_parent_id");
  CREATE INDEX "home_marketing_banners_image_idx" ON "home_marketing_banners" USING btree ("image_id");
  CREATE INDEX "home_marketing_banners_image_mobile_idx" ON "home_marketing_banners" USING btree ("image_mobile_id");

  CREATE TABLE "_home_v_version_marketing_banners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"campaign" varchar,
  	"image_id" integer,
  	"image_mobile_id" integer,
  	"image_mode" "enum__home_v_version_marketing_banners_image_mode" DEFAULT 'overlay',
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar DEFAULT '/catalogue',
  	"badge_label" varchar,
  	"active" boolean DEFAULT true,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"_uuid" varchar
  );

  ALTER TABLE "_home_v_version_marketing_banners" ADD CONSTRAINT "_home_v_version_marketing_banners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_marketing_banners" ADD CONSTRAINT "_home_v_version_marketing_banners_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_marketing_banners" ADD CONSTRAINT "_home_v_version_marketing_banners_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_home_v_version_marketing_banners_order_idx" ON "_home_v_version_marketing_banners" USING btree ("_order");
  CREATE INDEX "_home_v_version_marketing_banners_parent_id_idx" ON "_home_v_version_marketing_banners" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_marketing_banners_image_idx" ON "_home_v_version_marketing_banners" USING btree ("image_id");
  CREATE INDEX "_home_v_version_marketing_banners_image_mobile_idx" ON "_home_v_version_marketing_banners" USING btree ("image_mobile_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_marketing_banners" CASCADE;
  DROP TABLE "_home_v_version_marketing_banners" CASCADE;
  DROP TYPE "public"."enum_home_marketing_banners_image_mode";
  DROP TYPE "public"."enum__home_v_version_marketing_banners_image_mode";

  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_image_id" integer;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_image_mobile_id" integer;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_eyebrow" varchar;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_title" varchar;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_description" varchar;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_cta_label" varchar;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_cta_url" varchar DEFAULT '/catalogue';
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_badge_label" varchar;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_start_date" timestamp(3) with time zone;
  ALTER TABLE "home" ADD COLUMN "marketing_banner_copy_end_date" timestamp(3) with time zone;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_image_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_image_mobile_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_eyebrow" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_title" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_description" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_cta_label" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_cta_url" varchar DEFAULT '/catalogue';
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_badge_label" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_start_date" timestamp(3) with time zone;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_end_date" timestamp(3) with time zone;`)
}
