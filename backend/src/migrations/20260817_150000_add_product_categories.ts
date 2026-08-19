import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Products.CATEGORY_OPTIONS grew from 5 to 9 values (Maquillage,
// Bucco-Dentaire, Compléments alimentaires, Hygiène added) — Payload
// generates one Postgres enum type per field occurrence, so all four
// places that reuse CATEGORY_OPTIONS (products.category, the home page's
// rail-by-category filter x2 for drafts/published, and the catalogue
// page's tag-to-category mapping) each get their own enum extended here.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_products_category" ADD VALUE IF NOT EXISTS 'Maquillage';
  ALTER TYPE "public"."enum_products_category" ADD VALUE IF NOT EXISTS 'Bucco-Dentaire';
  ALTER TYPE "public"."enum_products_category" ADD VALUE IF NOT EXISTS 'Compléments alimentaires';
  ALTER TYPE "public"."enum_products_category" ADD VALUE IF NOT EXISTS 'Hygiène';

  ALTER TYPE "public"."enum_home_rails_category" ADD VALUE IF NOT EXISTS 'Maquillage';
  ALTER TYPE "public"."enum_home_rails_category" ADD VALUE IF NOT EXISTS 'Bucco-Dentaire';
  ALTER TYPE "public"."enum_home_rails_category" ADD VALUE IF NOT EXISTS 'Compléments alimentaires';
  ALTER TYPE "public"."enum_home_rails_category" ADD VALUE IF NOT EXISTS 'Hygiène';

  ALTER TYPE "public"."enum__home_v_version_rails_category" ADD VALUE IF NOT EXISTS 'Maquillage';
  ALTER TYPE "public"."enum__home_v_version_rails_category" ADD VALUE IF NOT EXISTS 'Bucco-Dentaire';
  ALTER TYPE "public"."enum__home_v_version_rails_category" ADD VALUE IF NOT EXISTS 'Compléments alimentaires';
  ALTER TYPE "public"."enum__home_v_version_rails_category" ADD VALUE IF NOT EXISTS 'Hygiène';

  ALTER TYPE "public"."enum_catalogue_page_tag_to_category_category" ADD VALUE IF NOT EXISTS 'Maquillage';
  ALTER TYPE "public"."enum_catalogue_page_tag_to_category_category" ADD VALUE IF NOT EXISTS 'Bucco-Dentaire';
  ALTER TYPE "public"."enum_catalogue_page_tag_to_category_category" ADD VALUE IF NOT EXISTS 'Compléments alimentaires';
  ALTER TYPE "public"."enum_catalogue_page_tag_to_category_category" ADD VALUE IF NOT EXISTS 'Hygiène';`)
}

// Postgres has no `ALTER TYPE ... DROP VALUE` — reverting means recreating
// each enum with only the original 5 values and re-casting the column onto
// it. This fails (by design) if any row still holds one of the 4 removed
// categories — a clean rollback requires migrating those rows off first.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_products_category" RENAME TO "enum_products_category_old";
  CREATE TYPE "public"."enum_products_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  ALTER TABLE "products" ALTER COLUMN "category" TYPE "public"."enum_products_category" USING "category"::text::"public"."enum_products_category";
  DROP TYPE "public"."enum_products_category_old";

  ALTER TYPE "public"."enum_home_rails_category" RENAME TO "enum_home_rails_category_old";
  CREATE TYPE "public"."enum_home_rails_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  ALTER TABLE "home_rails" ALTER COLUMN "category" TYPE "public"."enum_home_rails_category" USING "category"::text::"public"."enum_home_rails_category";
  DROP TYPE "public"."enum_home_rails_category_old";

  ALTER TYPE "public"."enum__home_v_version_rails_category" RENAME TO "enum__home_v_version_rails_category_old";
  CREATE TYPE "public"."enum__home_v_version_rails_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  ALTER TABLE "_home_v_version_rails" ALTER COLUMN "category" TYPE "public"."enum__home_v_version_rails_category" USING "category"::text::"public"."enum__home_v_version_rails_category";
  DROP TYPE "public"."enum__home_v_version_rails_category_old";

  ALTER TYPE "public"."enum_catalogue_page_tag_to_category_category" RENAME TO "enum_catalogue_page_tag_to_category_category_old";
  CREATE TYPE "public"."enum_catalogue_page_tag_to_category_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  ALTER TABLE "catalogue_page_tag_to_category" ALTER COLUMN "category" TYPE "public"."enum_catalogue_page_tag_to_category_category" USING "category"::text::"public"."enum_catalogue_page_tag_to_category_category";
  DROP TYPE "public"."enum_catalogue_page_tag_to_category_category_old";`)
}
