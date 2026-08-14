import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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
  ALTER TABLE "home" ADD CONSTRAINT "home_marketing_banner_copy_image_id_media_id_fk" FOREIGN KEY ("marketing_banner_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_marketing_banner_copy_image_mobile_id_media_id_fk" FOREIGN KEY ("marketing_banner_copy_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_marketing_banner_copy_marketing_banner_copy_image_idx" ON "home" USING btree ("marketing_banner_copy_image_id");
  CREATE INDEX "home_marketing_banner_copy_marketing_banner_copy_image_m_idx" ON "home" USING btree ("marketing_banner_copy_image_mobile_id");

  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_image_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_image_mobile_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_eyebrow" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_title" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_description" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_cta_label" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_cta_url" varchar DEFAULT '/catalogue';
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_badge_label" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_start_date" timestamp(3) with time zone;
  ALTER TABLE "_home_v" ADD COLUMN "version_marketing_banner_copy_end_date" timestamp(3) with time zone;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_marketing_banner_copy_image_id_media_id_fk" FOREIGN KEY ("version_marketing_banner_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_marketing_banner_copy_image_mobile_id_media_id_" FOREIGN KEY ("version_marketing_banner_copy_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_home_v_version_marketing_banner_copy_version_marketing__idx" ON "_home_v" USING btree ("version_marketing_banner_copy_image_id");
  CREATE INDEX "_home_v_version_marketing_banner_copy_version_marketin_1_idx" ON "_home_v" USING btree ("version_marketing_banner_copy_image_mobile_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_image_id";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_image_mobile_id";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_eyebrow";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_title";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_description";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_cta_label";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_cta_url";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_badge_label";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_start_date";
  ALTER TABLE "home" DROP COLUMN "marketing_banner_copy_end_date";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_image_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_image_mobile_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_eyebrow";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_title";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_description";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_cta_label";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_cta_url";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_badge_label";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_start_date";
  ALTER TABLE "_home_v" DROP COLUMN "version_marketing_banner_copy_end_date";`)
}
