import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'manager', 'editor', 'sales', 'stockManager', 'customer');
  CREATE TYPE "public"."enum_products_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  CREATE TYPE "public"."enum_services_icon" AS ENUM('Baby', 'Feather', 'Palette', 'ScanFace', 'Scissors', 'Droplet');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');
  CREATE TYPE "public"."enum_stock_movements_source" AS ENUM('import', 'manual', 'order', 'adjustment', 'restock');
  CREATE TYPE "public"."enum_instagram_posts_media_type" AS ENUM('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TYPE "public"."enum_home_hero_slides_align" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_home_rails_product_source" AS ENUM('manual', 'latest', 'featured', 'bestSelling', 'category', 'brand', 'promotion');
  CREATE TYPE "public"."enum_home_rails_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  CREATE TYPE "public"."enum_home_rails_sort_order" AS ENUM('newest', 'price-asc', 'price-desc', 'name-asc', 'rating-desc');
  CREATE TYPE "public"."enum_home_rails_badge_style" AS ENUM('none', 'new', 'rank', 'team');
  CREATE TYPE "public"."enum_home_summer_edit_copy_highlights_icon" AS ENUM('Sun', 'Droplet', 'Leaf', 'Sparkles', 'ShieldCheck');
  CREATE TYPE "public"."enum_home_trust_badges_icon" AS ENUM('Truck', 'ShieldCheck', 'BadgeCheck', 'Headset');
  CREATE TYPE "public"."enum_home_services_teaser_icon" AS ENUM('ScanLine', 'Truck', 'MessageCircleQuestion', 'LifeBuoy', 'ShieldCheck', 'BadgeCheck', 'Headset', 'Sparkles', 'Heart', 'Gift');
  CREATE TYPE "public"."enum_home_summer_edit_copy_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_home_summer_edit_copy_animation_speed" AS ENUM('slow', 'normal', 'fast');
  CREATE TYPE "public"."enum_home_coffrets_copy_layout" AS ENUM('carousel', 'grid');
  CREATE TYPE "public"."enum_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_version_hero_slides_align" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__home_v_version_rails_product_source" AS ENUM('manual', 'latest', 'featured', 'bestSelling', 'category', 'brand', 'promotion');
  CREATE TYPE "public"."enum__home_v_version_rails_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  CREATE TYPE "public"."enum__home_v_version_rails_sort_order" AS ENUM('newest', 'price-asc', 'price-desc', 'name-asc', 'rating-desc');
  CREATE TYPE "public"."enum__home_v_version_rails_badge_style" AS ENUM('none', 'new', 'rank', 'team');
  CREATE TYPE "public"."enum__home_v_version_summer_edit_copy_highlights_icon" AS ENUM('Sun', 'Droplet', 'Leaf', 'Sparkles', 'ShieldCheck');
  CREATE TYPE "public"."enum__home_v_version_trust_badges_icon" AS ENUM('Truck', 'ShieldCheck', 'BadgeCheck', 'Headset');
  CREATE TYPE "public"."enum__home_v_version_services_teaser_icon" AS ENUM('ScanLine', 'Truck', 'MessageCircleQuestion', 'LifeBuoy', 'ShieldCheck', 'BadgeCheck', 'Headset', 'Sparkles', 'Heart', 'Gift');
  CREATE TYPE "public"."enum__home_v_version_summer_edit_copy_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__home_v_version_summer_edit_copy_animation_speed" AS ENUM('slow', 'normal', 'fast');
  CREATE TYPE "public"."enum__home_v_version_coffrets_copy_layout" AS ENUM('carousel', 'grid');
  CREATE TYPE "public"."enum__home_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_catalogue_page_tag_to_category_category" AS ENUM('Visage', 'Corps', 'Cheveux', 'Solaire', 'Baby & Mom');
  CREATE TYPE "public"."enum_catalogue_page_needs_icon" AS ENUM('Droplets', 'Sparkles', 'Star', 'ListChecks');
  CREATE TYPE "public"."enum_site_chrome_header_actions_key" AS ENUM('services', 'contact', 'favoris', 'panier');
  CREATE TYPE "public"."enum_site_chrome_header_actions_icon" AS ENUM('MapPin', 'MessageCircle', 'Phone', 'Mail', 'HelpCircle', 'Heart', 'ShoppingBag');
  CREATE TYPE "public"."enum_site_chrome_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_chrome_v_version_header_actions_key" AS ENUM('services', 'contact', 'favoris', 'panier');
  CREATE TYPE "public"."enum__site_chrome_v_version_header_actions_icon" AS ENUM('MapPin', 'MessageCircle', 'Phone', 'Mail', 'HelpCircle', 'Heart', 'ShoppingBag');
  CREATE TYPE "public"."enum__site_chrome_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_theme_preset" AS ENUM('parad-hiver', 'minimal', 'botanical', 'soft-beauty', 'premium', 'ocean', 'custom');
  CREATE TYPE "public"."enum_theme_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__theme_v_version_preset" AS ENUM('parad-hiver', 'minimal', 'botanical', 'soft-beauty', 'premium', 'ocean', 'custom');
  CREATE TYPE "public"."enum__theme_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_navigation_items_mega_menu_columns_links_type" AS ENUM('category', 'brand', 'custom');
  CREATE TYPE "public"."enum_navigation_items_type" AS ENUM('category', 'brand', 'collection', 'page', 'custom');
  CREATE TYPE "public"."enum_navigation_items_collection_route" AS ENUM('/catalogue', '/marques', '/collections', '/shop/soldes', '/shop/nouveautes');
  CREATE TYPE "public"."enum_navigation_items_page_route" AS ENUM('/', '/services', '/contact');
  CREATE TYPE "public"."enum_navigation_items_badge_color" AS ENUM('none', 'plum', 'teal', 'sale');
  CREATE TYPE "public"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_version_items_mega_menu_columns_links_type" AS ENUM('category', 'brand', 'custom');
  CREATE TYPE "public"."enum__navigation_v_version_items_type" AS ENUM('category', 'brand', 'collection', 'page', 'custom');
  CREATE TYPE "public"."enum__navigation_v_version_items_collection_route" AS ENUM('/catalogue', '/marques', '/collections', '/shop/soldes', '/shop/nouveautes');
  CREATE TYPE "public"."enum__navigation_v_version_items_page_route" AS ENUM('/', '/services', '/contact');
  CREATE TYPE "public"."enum__navigation_v_version_items_badge_color" AS ENUM('none', 'plum', 'teal', 'sale');
  CREATE TYPE "public"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"parent_id" integer,
  	"order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"icon" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"brand_id" integer,
  	"category" "enum_products_category" NOT NULL,
  	"size" varchar,
  	"price" numeric NOT NULL,
  	"old_price" numeric,
  	"badge" varchar,
  	"rating" numeric DEFAULT 5,
  	"reviews" numeric DEFAULT 0,
  	"tint" varchar DEFAULT '#F2F2F2',
  	"description" varchar NOT NULL,
  	"image_id" integer,
  	"sku" varchar,
  	"barcode" varchar,
  	"stock" numeric DEFAULT 0,
  	"reserved_stock" numeric DEFAULT 0,
  	"low_stock_threshold" numeric DEFAULT 5,
  	"is_published" boolean DEFAULT true,
  	"featured" boolean DEFAULT false,
  	"discontinued" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "services_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"sub" varchar
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"subtitle" varchar,
  	"description" varchar NOT NULL,
  	"price" numeric DEFAULT 0,
  	"duration" varchar,
  	"expert" varchar,
  	"bg" varchar DEFAULT '#EFE6F3',
  	"icon" "enum_services_icon" NOT NULL,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stores_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar NOT NULL,
  	"hours" varchar NOT NULL
  );
  
  CREATE TABLE "stores" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"phone" varchar,
  	"email" varchar,
  	"map_url" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"name" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"quantity" numeric NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar,
  	"customer_name" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"customer_phone" varchar,
  	"shipping_address" varchar,
  	"subtotal" numeric NOT NULL,
  	"shipping" numeric DEFAULT 0,
  	"total" numeric NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending' NOT NULL,
  	"payment_status" "enum_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"payment_method" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "suppliers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"address" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inventory" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"batch_number" varchar,
  	"expiry_date" timestamp(3) with time zone,
  	"supplier_id" integer,
  	"quantity" numeric NOT NULL,
  	"received_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stock_movements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"previous_stock" numeric NOT NULL,
  	"new_stock" numeric NOT NULL,
  	"delta" numeric NOT NULL,
  	"source" "enum_stock_movements_source" DEFAULT 'manual' NOT NULL,
  	"reason" varchar,
  	"batch_number" varchar,
  	"expiry_date" timestamp(3) with time zone,
  	"supplier_id" integer,
  	"reference" varchar,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "instagram_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"instagram_id" varchar NOT NULL,
  	"permalink" varchar NOT NULL,
  	"image_url" varchar NOT NULL,
  	"thumbnail_url" varchar,
  	"caption" varchar,
  	"media_type" "enum_instagram_posts_media_type" NOT NULL,
  	"timestamp" timestamp(3) with time zone NOT NULL,
  	"username" varchar DEFAULT 'paradhiver',
  	"is_published" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'products' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar DEFAULT 'products' NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "api_request_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"method" varchar,
  	"path" varchar NOT NULL,
  	"collection_slug" varchar,
  	"operation" varchar,
  	"status_code" numeric,
  	"duration_ms" numeric,
  	"user_email" varchar,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"brands_id" integer,
  	"categories_id" integer,
  	"products_id" integer,
  	"services_id" integer,
  	"stores_id" integer,
  	"orders_id" integer,
  	"suppliers_id" integer,
  	"inventory_id" integer,
  	"stock_movements_id" integer,
  	"instagram_posts_id" integer,
  	"api_request_logs_id" integer,
  	"payload_folders_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "home_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "home_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"active" boolean DEFAULT true,
  	"tag" varchar,
  	"title" varchar,
  	"sub" varchar,
  	"cta" varchar,
  	"cta_url" varchar DEFAULT '/catalogue',
  	"secondary_cta" varchar,
  	"secondary_cta_url" varchar,
  	"align" "enum_home_hero_slides_align" DEFAULT 'right',
  	"overlay" boolean DEFAULT true,
  	"bg" varchar,
  	"image_id" integer,
  	"mobile_image_id" integer
  );
  
  CREATE TABLE "home_cta_pair1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"bg" varchar DEFAULT '#EFE6F3',
  	"image_id" integer
  );
  
  CREATE TABLE "home_rails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"product_source" "enum_home_rails_product_source" DEFAULT 'manual',
  	"category" "enum_home_rails_category",
  	"brand_filter_id" integer,
  	"limit" numeric DEFAULT 8,
  	"sort_order" "enum_home_rails_sort_order" DEFAULT 'newest',
  	"cta_label" varchar DEFAULT 'Voir tout',
  	"cta_url" varchar DEFAULT '/catalogue',
  	"badge_style" "enum_home_rails_badge_style" DEFAULT 'none',
  	"editorial_image_id" integer,
  	"brand_feature_name" varchar,
  	"brand_feature_desc" varchar,
  	"brand_feature_bg" varchar DEFAULT '#E7EFF3',
  	"brand_feature_image_id" integer
  );
  
  CREATE TABLE "home_brands_featured" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"brand_id" integer,
  	"phrase" varchar,
  	"image_id" integer,
  	"cta_label" varchar DEFAULT 'Découvrir la marque'
  );
  
  CREATE TABLE "home_cta_pair2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"bg" varchar DEFAULT '#F2E9F2',
  	"image_id" integer
  );
  
  CREATE TABLE "home_dermo_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"actif" varchar,
  	"claim" varchar
  );
  
  CREATE TABLE "home_summer_edit_copy_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_summer_edit_copy_highlights_icon",
  	"label" varchar
  );
  
  CREATE TABLE "home_summer_edit_acts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Acte I',
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "home_coffrets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"active" boolean DEFAULT true,
  	"tag" varchar,
  	"title" varchar,
  	"sub" varchar,
  	"price" numeric,
  	"price_from" boolean DEFAULT false,
  	"image_id" integer,
  	"cta_label" varchar DEFAULT 'Offrir',
  	"cta_url" varchar DEFAULT '/catalogue',
  	"toast" varchar
  );
  
  CREATE TABLE "home_trust_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"sub" varchar,
  	"icon" "enum_home_trust_badges_icon"
  );
  
  CREATE TABLE "home_review_bars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"n" varchar,
  	"pct" numeric
  );
  
  CREATE TABLE "home_sample_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"date" varchar,
  	"stars" numeric,
  	"text" varchar
  );
  
  CREATE TABLE "home_services_teaser" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"sub" varchar,
  	"cta" varchar,
  	"href" varchar DEFAULT '/services',
  	"icon" "enum_home_services_teaser_icon"
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"promotions_grid_title" varchar DEFAULT 'Les offres du moment',
  	"promotions_grid_subtitle" varchar DEFAULT 'Profitez de nos meilleures offres.',
  	"promotions_grid_limit" numeric DEFAULT 8,
  	"dermo_corner_copy_eyebrow" varchar DEFAULT 'Dermo corner',
  	"dermo_corner_copy_title" varchar DEFAULT 'La sélection dermatologique du moment',
  	"dermo_corner_copy_subtitle" varchar DEFAULT 'Actifs prouvés, formules minimalistes : les références conseillées par nos pharmaciens pour les peaux réactives, sèches ou à imperfections.',
  	"dermo_corner_copy_cta_label" varchar DEFAULT 'Voir le rayon dermo',
  	"dermo_corner_copy_cta_url" varchar DEFAULT '/catalogue',
  	"dermo_corner_copy_picks_title" varchar DEFAULT 'Nos soins dermo favoris',
  	"dermo_corner_copy_image_id" integer,
  	"dermo_corner_copy_autoplay" boolean DEFAULT true,
  	"dermo_corner_copy_autoplay_speed_ms" numeric DEFAULT 4500,
  	"image_carousel_copy_eyebrow" varchar DEFAULT 'Sélection',
  	"image_carousel_copy_title" varchar DEFAULT 'Nos incontournables du moment',
  	"image_carousel_copy_subtitle" varchar DEFAULT 'Une sélection resserrée, à retrouver aussi en boutique.',
  	"image_carousel_copy_cta_label" varchar DEFAULT 'Voir la sélection',
  	"image_carousel_copy_cta_url" varchar DEFAULT '/catalogue',
  	"image_carousel_copy_picks_title" varchar DEFAULT 'Notre sélection',
  	"image_carousel_copy_image_id" integer,
  	"summer_edit_copy_eyebrow" varchar DEFAULT '01 / Summer Edit',
  	"summer_edit_copy_year" varchar,
  	"summer_edit_copy_title" varchar DEFAULT 'L''été commence',
  	"summer_edit_copy_title_accent" varchar DEFAULT 'par la peau',
  	"summer_edit_copy_description" varchar DEFAULT 'Protection solaire, hydratation intense et soins après-soleil pour une peau sublimée tout l’été.',
  	"summer_edit_copy_cta_label" varchar DEFAULT 'Découvrir la sélection',
  	"summer_edit_copy_cta_url" varchar DEFAULT '/catalogue',
  	"summer_edit_copy_hero_image_id" integer,
  	"summer_edit_copy_hero_image_mobile_id" integer,
  	"summer_edit_copy_image_position" "enum_home_summer_edit_copy_image_position" DEFAULT 'right',
  	"summer_edit_copy_image_scale" numeric DEFAULT 1.06,
  	"summer_edit_copy_overlay" boolean DEFAULT false,
  	"summer_edit_copy_carousel_autoplay" boolean DEFAULT true,
  	"summer_edit_copy_carousel_autoplay_speed_ms" numeric DEFAULT 5000,
  	"summer_edit_copy_carousel_show_counter" boolean DEFAULT true,
  	"summer_edit_copy_carousel_show_progress" boolean DEFAULT true,
  	"summer_edit_copy_animation_enable_reveal" boolean DEFAULT true,
  	"summer_edit_copy_animation_enable_parallax" boolean DEFAULT true,
  	"summer_edit_copy_animation_stagger_products" boolean DEFAULT true,
  	"summer_edit_copy_animation_speed" "enum_home_summer_edit_copy_animation_speed" DEFAULT 'normal',
  	"summer_edit_copy_colors_background" varchar DEFAULT '#F7EEE5',
  	"summer_edit_copy_colors_text" varchar DEFAULT '#373020',
  	"summer_edit_copy_colors_accent" varchar DEFAULT '#6D28D9',
  	"summer_edit_copy_colors_cta" varchar DEFAULT '#6D28D9',
  	"summer_edit_copy_full_width" boolean DEFAULT false,
  	"campaign_copy_eyebrow" varchar DEFAULT 'Sélection',
  	"campaign_copy_title" varchar DEFAULT 'Nos coups de cœur',
  	"campaign_copy_description" varchar DEFAULT 'Les références que nos pharmaciens recommandent le plus, réunies dans une sélection à part.',
  	"campaign_copy_cta_label" varchar DEFAULT 'Voir la sélection',
  	"campaign_copy_cta_url" varchar DEFAULT '/catalogue',
  	"campaign_copy_rail_title" varchar DEFAULT 'Nos coups de cœur',
  	"campaign_copy_image_id" integer,
  	"coffrets_copy_eyebrow" varchar DEFAULT 'Idées cadeaux',
  	"coffrets_copy_title" varchar DEFAULT 'Coffrets & cadeaux',
  	"coffrets_copy_subtitle" varchar DEFAULT 'Des rituels prêts à offrir, emballés à la main dans nos boutiques.',
  	"coffrets_copy_cta_label" varchar DEFAULT 'Tous les coffrets',
  	"coffrets_copy_cta_url" varchar DEFAULT '/collections',
  	"coffrets_copy_layout" "enum_home_coffrets_copy_layout" DEFAULT 'carousel',
  	"coffrets_copy_visible_desktop" numeric DEFAULT 3,
  	"coffrets_copy_visible_mobile" numeric DEFAULT 1,
  	"instagram_show" boolean DEFAULT true,
  	"instagram_title" varchar DEFAULT 'Suivez-nous sur Instagram',
  	"instagram_subtitle" varchar DEFAULT 'Routines, conseils de nos pharmaciens et coulisses de la parapharmacie.',
  	"instagram_username" varchar DEFAULT 'paradhiver',
  	"instagram_post_count" numeric DEFAULT 6,
  	"instagram_cta_text" varchar DEFAULT 'Nous suivre',
  	"instagram_cta_url" varchar DEFAULT 'https://www.instagram.com/paradhiver/',
  	"newsletter_section_title" varchar DEFAULT 'Recevez nos conseils & nouveautés',
  	"newsletter_section_subtitle" varchar DEFAULT 'Inscrivez-vous pour découvrir nos conseils pharmaceutiques, nouveautés et offres exclusives.',
  	"newsletter_section_placeholder" varchar DEFAULT 'Votre adresse email',
  	"newsletter_section_button_label" varchar DEFAULT 'S''inscrire',
  	"newsletter_section_success_message" varchar DEFAULT 'Merci ! Votre code −10% arrive par email',
  	"free_shipping_threshold" numeric DEFAULT 399,
  	"_status" "enum_home_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"brands_id" integer
  );
  
  CREATE TABLE "_home_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"visible" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"active" boolean DEFAULT true,
  	"tag" varchar,
  	"title" varchar,
  	"sub" varchar,
  	"cta" varchar,
  	"cta_url" varchar DEFAULT '/catalogue',
  	"secondary_cta" varchar,
  	"secondary_cta_url" varchar,
  	"align" "enum__home_v_version_hero_slides_align" DEFAULT 'right',
  	"overlay" boolean DEFAULT true,
  	"bg" varchar,
  	"image_id" integer,
  	"mobile_image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_cta_pair1" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"bg" varchar DEFAULT '#EFE6F3',
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_rails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"product_source" "enum__home_v_version_rails_product_source" DEFAULT 'manual',
  	"category" "enum__home_v_version_rails_category",
  	"brand_filter_id" integer,
  	"limit" numeric DEFAULT 8,
  	"sort_order" "enum__home_v_version_rails_sort_order" DEFAULT 'newest',
  	"cta_label" varchar DEFAULT 'Voir tout',
  	"cta_url" varchar DEFAULT '/catalogue',
  	"badge_style" "enum__home_v_version_rails_badge_style" DEFAULT 'none',
  	"editorial_image_id" integer,
  	"brand_feature_name" varchar,
  	"brand_feature_desc" varchar,
  	"brand_feature_bg" varchar DEFAULT '#E7EFF3',
  	"brand_feature_image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_brands_featured" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_id" integer,
  	"phrase" varchar,
  	"image_id" integer,
  	"cta_label" varchar DEFAULT 'Découvrir la marque',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_cta_pair2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"bg" varchar DEFAULT '#F2E9F2',
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_dermo_picks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"actif" varchar,
  	"claim" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_summer_edit_copy_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__home_v_version_summer_edit_copy_highlights_icon",
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_summer_edit_acts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Acte I',
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_coffrets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"active" boolean DEFAULT true,
  	"tag" varchar,
  	"title" varchar,
  	"sub" varchar,
  	"price" numeric,
  	"price_from" boolean DEFAULT false,
  	"image_id" integer,
  	"cta_label" varchar DEFAULT 'Offrir',
  	"cta_url" varchar DEFAULT '/catalogue',
  	"toast" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_trust_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"sub" varchar,
  	"icon" "enum__home_v_version_trust_badges_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_review_bars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"n" varchar,
  	"pct" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_sample_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"date" varchar,
  	"stars" numeric,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_services_teaser" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"sub" varchar,
  	"cta" varchar,
  	"href" varchar DEFAULT '/services',
  	"icon" "enum__home_v_version_services_teaser_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_promotions_grid_title" varchar DEFAULT 'Les offres du moment',
  	"version_promotions_grid_subtitle" varchar DEFAULT 'Profitez de nos meilleures offres.',
  	"version_promotions_grid_limit" numeric DEFAULT 8,
  	"version_dermo_corner_copy_eyebrow" varchar DEFAULT 'Dermo corner',
  	"version_dermo_corner_copy_title" varchar DEFAULT 'La sélection dermatologique du moment',
  	"version_dermo_corner_copy_subtitle" varchar DEFAULT 'Actifs prouvés, formules minimalistes : les références conseillées par nos pharmaciens pour les peaux réactives, sèches ou à imperfections.',
  	"version_dermo_corner_copy_cta_label" varchar DEFAULT 'Voir le rayon dermo',
  	"version_dermo_corner_copy_cta_url" varchar DEFAULT '/catalogue',
  	"version_dermo_corner_copy_picks_title" varchar DEFAULT 'Nos soins dermo favoris',
  	"version_dermo_corner_copy_image_id" integer,
  	"version_dermo_corner_copy_autoplay" boolean DEFAULT true,
  	"version_dermo_corner_copy_autoplay_speed_ms" numeric DEFAULT 4500,
  	"version_image_carousel_copy_eyebrow" varchar DEFAULT 'Sélection',
  	"version_image_carousel_copy_title" varchar DEFAULT 'Nos incontournables du moment',
  	"version_image_carousel_copy_subtitle" varchar DEFAULT 'Une sélection resserrée, à retrouver aussi en boutique.',
  	"version_image_carousel_copy_cta_label" varchar DEFAULT 'Voir la sélection',
  	"version_image_carousel_copy_cta_url" varchar DEFAULT '/catalogue',
  	"version_image_carousel_copy_picks_title" varchar DEFAULT 'Notre sélection',
  	"version_image_carousel_copy_image_id" integer,
  	"version_summer_edit_copy_eyebrow" varchar DEFAULT '01 / Summer Edit',
  	"version_summer_edit_copy_year" varchar,
  	"version_summer_edit_copy_title" varchar DEFAULT 'L''été commence',
  	"version_summer_edit_copy_title_accent" varchar DEFAULT 'par la peau',
  	"version_summer_edit_copy_description" varchar DEFAULT 'Protection solaire, hydratation intense et soins après-soleil pour une peau sublimée tout l’été.',
  	"version_summer_edit_copy_cta_label" varchar DEFAULT 'Découvrir la sélection',
  	"version_summer_edit_copy_cta_url" varchar DEFAULT '/catalogue',
  	"version_summer_edit_copy_hero_image_id" integer,
  	"version_summer_edit_copy_hero_image_mobile_id" integer,
  	"version_summer_edit_copy_image_position" "enum__home_v_version_summer_edit_copy_image_position" DEFAULT 'right',
  	"version_summer_edit_copy_image_scale" numeric DEFAULT 1.06,
  	"version_summer_edit_copy_overlay" boolean DEFAULT false,
  	"version_summer_edit_copy_carousel_autoplay" boolean DEFAULT true,
  	"version_summer_edit_copy_carousel_autoplay_speed_ms" numeric DEFAULT 5000,
  	"version_summer_edit_copy_carousel_show_counter" boolean DEFAULT true,
  	"version_summer_edit_copy_carousel_show_progress" boolean DEFAULT true,
  	"version_summer_edit_copy_animation_enable_reveal" boolean DEFAULT true,
  	"version_summer_edit_copy_animation_enable_parallax" boolean DEFAULT true,
  	"version_summer_edit_copy_animation_stagger_products" boolean DEFAULT true,
  	"version_summer_edit_copy_animation_speed" "enum__home_v_version_summer_edit_copy_animation_speed" DEFAULT 'normal',
  	"version_summer_edit_copy_colors_background" varchar DEFAULT '#F7EEE5',
  	"version_summer_edit_copy_colors_text" varchar DEFAULT '#373020',
  	"version_summer_edit_copy_colors_accent" varchar DEFAULT '#6D28D9',
  	"version_summer_edit_copy_colors_cta" varchar DEFAULT '#6D28D9',
  	"version_summer_edit_copy_full_width" boolean DEFAULT false,
  	"version_campaign_copy_eyebrow" varchar DEFAULT 'Sélection',
  	"version_campaign_copy_title" varchar DEFAULT 'Nos coups de cœur',
  	"version_campaign_copy_description" varchar DEFAULT 'Les références que nos pharmaciens recommandent le plus, réunies dans une sélection à part.',
  	"version_campaign_copy_cta_label" varchar DEFAULT 'Voir la sélection',
  	"version_campaign_copy_cta_url" varchar DEFAULT '/catalogue',
  	"version_campaign_copy_rail_title" varchar DEFAULT 'Nos coups de cœur',
  	"version_campaign_copy_image_id" integer,
  	"version_coffrets_copy_eyebrow" varchar DEFAULT 'Idées cadeaux',
  	"version_coffrets_copy_title" varchar DEFAULT 'Coffrets & cadeaux',
  	"version_coffrets_copy_subtitle" varchar DEFAULT 'Des rituels prêts à offrir, emballés à la main dans nos boutiques.',
  	"version_coffrets_copy_cta_label" varchar DEFAULT 'Tous les coffrets',
  	"version_coffrets_copy_cta_url" varchar DEFAULT '/collections',
  	"version_coffrets_copy_layout" "enum__home_v_version_coffrets_copy_layout" DEFAULT 'carousel',
  	"version_coffrets_copy_visible_desktop" numeric DEFAULT 3,
  	"version_coffrets_copy_visible_mobile" numeric DEFAULT 1,
  	"version_instagram_show" boolean DEFAULT true,
  	"version_instagram_title" varchar DEFAULT 'Suivez-nous sur Instagram',
  	"version_instagram_subtitle" varchar DEFAULT 'Routines, conseils de nos pharmaciens et coulisses de la parapharmacie.',
  	"version_instagram_username" varchar DEFAULT 'paradhiver',
  	"version_instagram_post_count" numeric DEFAULT 6,
  	"version_instagram_cta_text" varchar DEFAULT 'Nous suivre',
  	"version_instagram_cta_url" varchar DEFAULT 'https://www.instagram.com/paradhiver/',
  	"version_newsletter_section_title" varchar DEFAULT 'Recevez nos conseils & nouveautés',
  	"version_newsletter_section_subtitle" varchar DEFAULT 'Inscrivez-vous pour découvrir nos conseils pharmaceutiques, nouveautés et offres exclusives.',
  	"version_newsletter_section_placeholder" varchar DEFAULT 'Votre adresse email',
  	"version_newsletter_section_button_label" varchar DEFAULT 'S''inscrire',
  	"version_newsletter_section_success_message" varchar DEFAULT 'Merci ! Votre code −10% arrive par email',
  	"version_free_shipping_threshold" numeric DEFAULT 399,
  	"version__status" "enum__home_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_home_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"brands_id" integer
  );
  
  CREATE TABLE "collections_page_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"sub" varchar,
  	"count" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "collections_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "catalogue_page_quick_filters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "catalogue_page_tag_to_category" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL,
  	"category" "enum_catalogue_page_tag_to_category_category"
  );
  
  CREATE TABLE "catalogue_page_editorial_tiles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"sub" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "catalogue_page_needs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"sub" varchar,
  	"icon" "enum_catalogue_page_needs_icon" NOT NULL
  );
  
  CREATE TABLE "catalogue_page_seo_intro_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "catalogue_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"featured_tile_title" varchar,
  	"featured_tile_sub" varchar,
  	"featured_tile_image_id" integer,
  	"guide_eyebrow" varchar,
  	"guide_title" varchar,
  	"guide_body" varchar,
  	"guide_cta" varchar,
  	"guide_image_id" integer,
  	"seo_intro_eyebrow" varchar,
  	"seo_intro_title" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "catalogue_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"brands_id" integer
  );
  
  CREATE TABLE "site_chrome_top_bar_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"active" boolean DEFAULT true
  );
  
  CREATE TABLE "site_chrome_header_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_site_chrome_header_actions_key",
  	"label" varchar,
  	"icon" "enum_site_chrome_header_actions_icon",
  	"href" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "site_chrome_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "site_chrome_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "site_chrome" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"top_bar_enabled" boolean DEFAULT true,
  	"top_bar_marquee_speed_sec" numeric DEFAULT 34,
  	"top_bar_mobile_message" varchar DEFAULT 'Livraison offerte dès 399 MAD',
  	"logo_image_id" integer,
  	"logo_wordmark" varchar DEFAULT 'PARA D''HIVER',
  	"logo_href" varchar DEFAULT '/',
  	"header_search_enabled" boolean DEFAULT true,
  	"header_search_placeholder" varchar DEFAULT 'Rechercher un produit, une marque…',
  	"_status" "enum_site_chrome_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_chrome_v_version_top_bar_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"active" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_chrome_v_version_header_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "enum__site_chrome_v_version_header_actions_key",
  	"label" varchar,
  	"icon" "enum__site_chrome_v_version_header_actions_icon",
  	"href" varchar,
  	"visible" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_chrome_v_version_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"visible" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_chrome_v_version_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"visible" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_chrome_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_top_bar_enabled" boolean DEFAULT true,
  	"version_top_bar_marquee_speed_sec" numeric DEFAULT 34,
  	"version_top_bar_mobile_message" varchar DEFAULT 'Livraison offerte dès 399 MAD',
  	"version_logo_image_id" integer,
  	"version_logo_wordmark" varchar DEFAULT 'PARA D''HIVER',
  	"version_logo_href" varchar DEFAULT '/',
  	"version_header_search_enabled" boolean DEFAULT true,
  	"version_header_search_placeholder" varchar DEFAULT 'Rechercher un produit, une marque…',
  	"version__status" "enum__site_chrome_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "theme" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"preset" "enum_theme_preset" DEFAULT 'parad-hiver',
  	"color_primary" varchar DEFAULT '#5E4074',
  	"color_secondary" varchar DEFAULT '#008AA5',
  	"color_accent" varchar DEFAULT '#5FBE00',
  	"color_sale" varchar DEFAULT '#FF514D',
  	"color_text_primary" varchar DEFAULT '#373020',
  	"color_text_muted" varchar DEFAULT '#757D86',
  	"color_background_secondary" varchar DEFAULT '#F7EEE5',
  	"button_bg" varchar DEFAULT '#5E4074',
  	"button_text" varchar DEFAULT '#FFFFFF',
  	"button_hover_bg" varchar DEFAULT '#432951',
  	"button_hover_text" varchar DEFAULT '#FFFFFF',
  	"button_radius" numeric DEFAULT 999,
  	"button_font_weight" numeric DEFAULT 600,
  	"button_letter_spacing" numeric DEFAULT 0.08,
  	"_status" "enum_theme_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_theme_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_preset" "enum__theme_v_version_preset" DEFAULT 'parad-hiver',
  	"version_color_primary" varchar DEFAULT '#5E4074',
  	"version_color_secondary" varchar DEFAULT '#008AA5',
  	"version_color_accent" varchar DEFAULT '#5FBE00',
  	"version_color_sale" varchar DEFAULT '#FF514D',
  	"version_color_text_primary" varchar DEFAULT '#373020',
  	"version_color_text_muted" varchar DEFAULT '#757D86',
  	"version_color_background_secondary" varchar DEFAULT '#F7EEE5',
  	"version_button_bg" varchar DEFAULT '#5E4074',
  	"version_button_text" varchar DEFAULT '#FFFFFF',
  	"version_button_hover_bg" varchar DEFAULT '#432951',
  	"version_button_hover_text" varchar DEFAULT '#FFFFFF',
  	"version_button_radius" numeric DEFAULT 999,
  	"version_button_font_weight" numeric DEFAULT 600,
  	"version_button_letter_spacing" numeric DEFAULT 0.08,
  	"version__status" "enum__theme_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "navigation_items_mega_menu_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "enum_navigation_items_mega_menu_columns_links_type" DEFAULT 'custom',
  	"category_id" integer,
  	"brand_id" integer,
  	"custom_url" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "navigation_items_mega_menu_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "navigation_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"visible" boolean DEFAULT true,
  	"type" "enum_navigation_items_type" DEFAULT 'custom',
  	"category_id" integer,
  	"brand_id" integer,
  	"collection_route" "enum_navigation_items_collection_route",
  	"page_route" "enum_navigation_items_page_route",
  	"custom_url" varchar,
  	"badge_label" varchar,
  	"badge_color" "enum_navigation_items_badge_color" DEFAULT 'none',
  	"mega_menu_enabled" boolean DEFAULT false,
  	"mega_menu_subtitle" varchar,
  	"mega_menu_promo_image_id" integer,
  	"mega_menu_promo_title" varchar,
  	"mega_menu_promo_description" varchar,
  	"mega_menu_promo_cta_label" varchar,
  	"mega_menu_promo_cta_url" varchar
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_navigation_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_navigation_v_version_items_mega_menu_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "enum__navigation_v_version_items_mega_menu_columns_links_type" DEFAULT 'custom',
  	"category_id" integer,
  	"brand_id" integer,
  	"custom_url" varchar,
  	"visible" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_items_mega_menu_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"visible" boolean DEFAULT true,
  	"type" "enum__navigation_v_version_items_type" DEFAULT 'custom',
  	"category_id" integer,
  	"brand_id" integer,
  	"collection_route" "enum__navigation_v_version_items_collection_route",
  	"page_route" "enum__navigation_v_version_items_page_route",
  	"custom_url" varchar,
  	"badge_label" varchar,
  	"badge_color" "enum__navigation_v_version_items_badge_color" DEFAULT 'none',
  	"mega_menu_enabled" boolean DEFAULT false,
  	"mega_menu_subtitle" varchar,
  	"mega_menu_promo_image_id" integer,
  	"mega_menu_promo_title" varchar,
  	"mega_menu_promo_description" varchar,
  	"mega_menu_promo_cta_label" varchar,
  	"mega_menu_promo_cta_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__navigation_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_benefits" ADD CONSTRAINT "services_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_steps" ADD CONSTRAINT "services_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stores_hours" ADD CONSTRAINT "stores_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inventory" ADD CONSTRAINT "inventory_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stores_fk" FOREIGN KEY ("stores_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_suppliers_fk" FOREIGN KEY ("suppliers_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_movements_fk" FOREIGN KEY ("stock_movements_id") REFERENCES "public"."stock_movements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instagram_posts_fk" FOREIGN KEY ("instagram_posts_id") REFERENCES "public"."instagram_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_api_request_logs_fk" FOREIGN KEY ("api_request_logs_id") REFERENCES "public"."api_request_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_sections" ADD CONSTRAINT "home_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_cta_pair1" ADD CONSTRAINT "home_cta_pair1_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_cta_pair1" ADD CONSTRAINT "home_cta_pair1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rails" ADD CONSTRAINT "home_rails_brand_filter_id_brands_id_fk" FOREIGN KEY ("brand_filter_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rails" ADD CONSTRAINT "home_rails_editorial_image_id_media_id_fk" FOREIGN KEY ("editorial_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rails" ADD CONSTRAINT "home_rails_brand_feature_image_id_media_id_fk" FOREIGN KEY ("brand_feature_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rails" ADD CONSTRAINT "home_rails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_brands_featured" ADD CONSTRAINT "home_brands_featured_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_brands_featured" ADD CONSTRAINT "home_brands_featured_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_brands_featured" ADD CONSTRAINT "home_brands_featured_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_cta_pair2" ADD CONSTRAINT "home_cta_pair2_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_cta_pair2" ADD CONSTRAINT "home_cta_pair2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_dermo_picks" ADD CONSTRAINT "home_dermo_picks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_dermo_picks" ADD CONSTRAINT "home_dermo_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_summer_edit_copy_highlights" ADD CONSTRAINT "home_summer_edit_copy_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_summer_edit_acts" ADD CONSTRAINT "home_summer_edit_acts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_coffrets" ADD CONSTRAINT "home_coffrets_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_coffrets" ADD CONSTRAINT "home_coffrets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_trust_badges" ADD CONSTRAINT "home_trust_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_review_bars" ADD CONSTRAINT "home_review_bars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_sample_reviews" ADD CONSTRAINT "home_sample_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_services_teaser" ADD CONSTRAINT "home_services_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_dermo_corner_copy_image_id_media_id_fk" FOREIGN KEY ("dermo_corner_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_image_carousel_copy_image_id_media_id_fk" FOREIGN KEY ("image_carousel_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_summer_edit_copy_hero_image_id_media_id_fk" FOREIGN KEY ("summer_edit_copy_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_summer_edit_copy_hero_image_mobile_id_media_id_fk" FOREIGN KEY ("summer_edit_copy_hero_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_campaign_copy_image_id_media_id_fk" FOREIGN KEY ("campaign_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_sections" ADD CONSTRAINT "_home_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_cta_pair1" ADD CONSTRAINT "_home_v_version_cta_pair1_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_cta_pair1" ADD CONSTRAINT "_home_v_version_cta_pair1_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_rails" ADD CONSTRAINT "_home_v_version_rails_brand_filter_id_brands_id_fk" FOREIGN KEY ("brand_filter_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_rails" ADD CONSTRAINT "_home_v_version_rails_editorial_image_id_media_id_fk" FOREIGN KEY ("editorial_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_rails" ADD CONSTRAINT "_home_v_version_rails_brand_feature_image_id_media_id_fk" FOREIGN KEY ("brand_feature_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_rails" ADD CONSTRAINT "_home_v_version_rails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_brands_featured" ADD CONSTRAINT "_home_v_version_brands_featured_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_brands_featured" ADD CONSTRAINT "_home_v_version_brands_featured_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_brands_featured" ADD CONSTRAINT "_home_v_version_brands_featured_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_cta_pair2" ADD CONSTRAINT "_home_v_version_cta_pair2_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_cta_pair2" ADD CONSTRAINT "_home_v_version_cta_pair2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_dermo_picks" ADD CONSTRAINT "_home_v_version_dermo_picks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_dermo_picks" ADD CONSTRAINT "_home_v_version_dermo_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_summer_edit_copy_highlights" ADD CONSTRAINT "_home_v_version_summer_edit_copy_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_summer_edit_acts" ADD CONSTRAINT "_home_v_version_summer_edit_acts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_coffrets" ADD CONSTRAINT "_home_v_version_coffrets_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_coffrets" ADD CONSTRAINT "_home_v_version_coffrets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_trust_badges" ADD CONSTRAINT "_home_v_version_trust_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_review_bars" ADD CONSTRAINT "_home_v_version_review_bars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_sample_reviews" ADD CONSTRAINT "_home_v_version_sample_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_services_teaser" ADD CONSTRAINT "_home_v_version_services_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_dermo_corner_copy_image_id_media_id_fk" FOREIGN KEY ("version_dermo_corner_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_image_carousel_copy_image_id_media_id_fk" FOREIGN KEY ("version_image_carousel_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_summer_edit_copy_hero_image_id_media_id_fk" FOREIGN KEY ("version_summer_edit_copy_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_summer_edit_copy_hero_image_mobile_id_media_id_fk" FOREIGN KEY ("version_summer_edit_copy_hero_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_campaign_copy_image_id_media_id_fk" FOREIGN KEY ("version_campaign_copy_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_rels" ADD CONSTRAINT "_home_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_rels" ADD CONSTRAINT "_home_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_rels" ADD CONSTRAINT "_home_v_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "collections_page_cards" ADD CONSTRAINT "collections_page_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "collections_page_cards" ADD CONSTRAINT "collections_page_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."collections_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalogue_page_quick_filters" ADD CONSTRAINT "catalogue_page_quick_filters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalogue_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalogue_page_tag_to_category" ADD CONSTRAINT "catalogue_page_tag_to_category_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalogue_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalogue_page_editorial_tiles" ADD CONSTRAINT "catalogue_page_editorial_tiles_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "catalogue_page_editorial_tiles" ADD CONSTRAINT "catalogue_page_editorial_tiles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalogue_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalogue_page_needs" ADD CONSTRAINT "catalogue_page_needs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalogue_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalogue_page_seo_intro_paragraphs" ADD CONSTRAINT "catalogue_page_seo_intro_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalogue_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalogue_page" ADD CONSTRAINT "catalogue_page_featured_tile_image_id_media_id_fk" FOREIGN KEY ("featured_tile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "catalogue_page" ADD CONSTRAINT "catalogue_page_guide_image_id_media_id_fk" FOREIGN KEY ("guide_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "catalogue_page_rels" ADD CONSTRAINT "catalogue_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."catalogue_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalogue_page_rels" ADD CONSTRAINT "catalogue_page_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_chrome_top_bar_messages" ADD CONSTRAINT "site_chrome_top_bar_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_chrome"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_chrome_header_actions" ADD CONSTRAINT "site_chrome_header_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_chrome"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_chrome_footer_columns_links" ADD CONSTRAINT "site_chrome_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_chrome_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_chrome_footer_columns" ADD CONSTRAINT "site_chrome_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_chrome"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_chrome" ADD CONSTRAINT "site_chrome_logo_image_id_media_id_fk" FOREIGN KEY ("logo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_chrome_v_version_top_bar_messages" ADD CONSTRAINT "_site_chrome_v_version_top_bar_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_chrome_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_chrome_v_version_header_actions" ADD CONSTRAINT "_site_chrome_v_version_header_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_chrome_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_chrome_v_version_footer_columns_links" ADD CONSTRAINT "_site_chrome_v_version_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_chrome_v_version_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_chrome_v_version_footer_columns" ADD CONSTRAINT "_site_chrome_v_version_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_chrome_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_chrome_v" ADD CONSTRAINT "_site_chrome_v_version_logo_image_id_media_id_fk" FOREIGN KEY ("version_logo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_items_mega_menu_columns_links" ADD CONSTRAINT "navigation_items_mega_menu_columns_links_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_items_mega_menu_columns_links" ADD CONSTRAINT "navigation_items_mega_menu_columns_links_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_items_mega_menu_columns_links" ADD CONSTRAINT "navigation_items_mega_menu_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items_mega_menu_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items_mega_menu_columns" ADD CONSTRAINT "navigation_items_mega_menu_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_mega_menu_promo_image_id_media_id_fk" FOREIGN KEY ("mega_menu_promo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items_mega_menu_columns_links" ADD CONSTRAINT "_navigation_v_version_items_mega_menu_columns_links_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items_mega_menu_columns_links" ADD CONSTRAINT "_navigation_v_version_items_mega_menu_columns_links_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items_mega_menu_columns_links" ADD CONSTRAINT "_navigation_v_version_items_mega_menu_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_items_mega_menu_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items_mega_menu_columns" ADD CONSTRAINT "_navigation_v_version_items_mega_menu_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items" ADD CONSTRAINT "_navigation_v_version_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items" ADD CONSTRAINT "_navigation_v_version_items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items" ADD CONSTRAINT "_navigation_v_version_items_mega_menu_promo_image_id_media_id_fk" FOREIGN KEY ("mega_menu_promo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_items" ADD CONSTRAINT "_navigation_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "brands_name_idx" ON "brands" USING btree ("name");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "products_gallery_order_idx" ON "products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "products_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "products_image_idx" ON "products" USING btree ("image_id");
  CREATE UNIQUE INDEX "products_sku_idx" ON "products" USING btree ("sku");
  CREATE UNIQUE INDEX "products_barcode_idx" ON "products" USING btree ("barcode");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "services_benefits_order_idx" ON "services_benefits" USING btree ("_order");
  CREATE INDEX "services_benefits_parent_id_idx" ON "services_benefits" USING btree ("_parent_id");
  CREATE INDEX "services_steps_order_idx" ON "services_steps" USING btree ("_order");
  CREATE INDEX "services_steps_parent_id_idx" ON "services_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_image_idx" ON "services" USING btree ("image_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "stores_hours_order_idx" ON "stores_hours" USING btree ("_order");
  CREATE INDEX "stores_hours_parent_id_idx" ON "stores_hours" USING btree ("_parent_id");
  CREATE INDEX "stores_updated_at_idx" ON "stores" USING btree ("updated_at");
  CREATE INDEX "stores_created_at_idx" ON "stores" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");
  CREATE INDEX "suppliers_updated_at_idx" ON "suppliers" USING btree ("updated_at");
  CREATE INDEX "suppliers_created_at_idx" ON "suppliers" USING btree ("created_at");
  CREATE INDEX "inventory_product_idx" ON "inventory" USING btree ("product_id");
  CREATE INDEX "inventory_supplier_idx" ON "inventory" USING btree ("supplier_id");
  CREATE INDEX "inventory_updated_at_idx" ON "inventory" USING btree ("updated_at");
  CREATE INDEX "inventory_created_at_idx" ON "inventory" USING btree ("created_at");
  CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id");
  CREATE INDEX "stock_movements_supplier_idx" ON "stock_movements" USING btree ("supplier_id");
  CREATE INDEX "stock_movements_created_by_idx" ON "stock_movements" USING btree ("created_by_id");
  CREATE INDEX "stock_movements_updated_at_idx" ON "stock_movements" USING btree ("updated_at");
  CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");
  CREATE UNIQUE INDEX "instagram_posts_instagram_id_idx" ON "instagram_posts" USING btree ("instagram_id");
  CREATE INDEX "instagram_posts_is_published_idx" ON "instagram_posts" USING btree ("is_published");
  CREATE INDEX "instagram_posts_updated_at_idx" ON "instagram_posts" USING btree ("updated_at");
  CREATE INDEX "instagram_posts_created_at_idx" ON "instagram_posts" USING btree ("created_at");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE INDEX "api_request_logs_updated_at_idx" ON "api_request_logs" USING btree ("updated_at");
  CREATE INDEX "api_request_logs_created_at_idx" ON "api_request_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_stores_id_idx" ON "payload_locked_documents_rels" USING btree ("stores_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_suppliers_id_idx" ON "payload_locked_documents_rels" USING btree ("suppliers_id");
  CREATE INDEX "payload_locked_documents_rels_inventory_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_id");
  CREATE INDEX "payload_locked_documents_rels_stock_movements_id_idx" ON "payload_locked_documents_rels" USING btree ("stock_movements_id");
  CREATE INDEX "payload_locked_documents_rels_instagram_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("instagram_posts_id");
  CREATE INDEX "payload_locked_documents_rels_api_request_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("api_request_logs_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_sections_order_idx" ON "home_sections" USING btree ("_order");
  CREATE INDEX "home_sections_parent_id_idx" ON "home_sections" USING btree ("_parent_id");
  CREATE INDEX "home_hero_slides_order_idx" ON "home_hero_slides" USING btree ("_order");
  CREATE INDEX "home_hero_slides_parent_id_idx" ON "home_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "home_hero_slides_image_idx" ON "home_hero_slides" USING btree ("image_id");
  CREATE INDEX "home_hero_slides_mobile_image_idx" ON "home_hero_slides" USING btree ("mobile_image_id");
  CREATE INDEX "home_cta_pair1_order_idx" ON "home_cta_pair1" USING btree ("_order");
  CREATE INDEX "home_cta_pair1_parent_id_idx" ON "home_cta_pair1" USING btree ("_parent_id");
  CREATE INDEX "home_cta_pair1_image_idx" ON "home_cta_pair1" USING btree ("image_id");
  CREATE INDEX "home_rails_order_idx" ON "home_rails" USING btree ("_order");
  CREATE INDEX "home_rails_parent_id_idx" ON "home_rails" USING btree ("_parent_id");
  CREATE INDEX "home_rails_brand_filter_idx" ON "home_rails" USING btree ("brand_filter_id");
  CREATE INDEX "home_rails_editorial_image_idx" ON "home_rails" USING btree ("editorial_image_id");
  CREATE INDEX "home_rails_brand_feature_brand_feature_image_idx" ON "home_rails" USING btree ("brand_feature_image_id");
  CREATE INDEX "home_brands_featured_order_idx" ON "home_brands_featured" USING btree ("_order");
  CREATE INDEX "home_brands_featured_parent_id_idx" ON "home_brands_featured" USING btree ("_parent_id");
  CREATE INDEX "home_brands_featured_brand_idx" ON "home_brands_featured" USING btree ("brand_id");
  CREATE INDEX "home_brands_featured_image_idx" ON "home_brands_featured" USING btree ("image_id");
  CREATE INDEX "home_cta_pair2_order_idx" ON "home_cta_pair2" USING btree ("_order");
  CREATE INDEX "home_cta_pair2_parent_id_idx" ON "home_cta_pair2" USING btree ("_parent_id");
  CREATE INDEX "home_cta_pair2_image_idx" ON "home_cta_pair2" USING btree ("image_id");
  CREATE INDEX "home_dermo_picks_order_idx" ON "home_dermo_picks" USING btree ("_order");
  CREATE INDEX "home_dermo_picks_parent_id_idx" ON "home_dermo_picks" USING btree ("_parent_id");
  CREATE INDEX "home_dermo_picks_product_idx" ON "home_dermo_picks" USING btree ("product_id");
  CREATE INDEX "home_summer_edit_copy_highlights_order_idx" ON "home_summer_edit_copy_highlights" USING btree ("_order");
  CREATE INDEX "home_summer_edit_copy_highlights_parent_id_idx" ON "home_summer_edit_copy_highlights" USING btree ("_parent_id");
  CREATE INDEX "home_summer_edit_acts_order_idx" ON "home_summer_edit_acts" USING btree ("_order");
  CREATE INDEX "home_summer_edit_acts_parent_id_idx" ON "home_summer_edit_acts" USING btree ("_parent_id");
  CREATE INDEX "home_coffrets_order_idx" ON "home_coffrets" USING btree ("_order");
  CREATE INDEX "home_coffrets_parent_id_idx" ON "home_coffrets" USING btree ("_parent_id");
  CREATE INDEX "home_coffrets_image_idx" ON "home_coffrets" USING btree ("image_id");
  CREATE INDEX "home_trust_badges_order_idx" ON "home_trust_badges" USING btree ("_order");
  CREATE INDEX "home_trust_badges_parent_id_idx" ON "home_trust_badges" USING btree ("_parent_id");
  CREATE INDEX "home_review_bars_order_idx" ON "home_review_bars" USING btree ("_order");
  CREATE INDEX "home_review_bars_parent_id_idx" ON "home_review_bars" USING btree ("_parent_id");
  CREATE INDEX "home_sample_reviews_order_idx" ON "home_sample_reviews" USING btree ("_order");
  CREATE INDEX "home_sample_reviews_parent_id_idx" ON "home_sample_reviews" USING btree ("_parent_id");
  CREATE INDEX "home_services_teaser_order_idx" ON "home_services_teaser" USING btree ("_order");
  CREATE INDEX "home_services_teaser_parent_id_idx" ON "home_services_teaser" USING btree ("_parent_id");
  CREATE INDEX "home_dermo_corner_copy_dermo_corner_copy_image_idx" ON "home" USING btree ("dermo_corner_copy_image_id");
  CREATE INDEX "home_image_carousel_copy_image_carousel_copy_image_idx" ON "home" USING btree ("image_carousel_copy_image_id");
  CREATE INDEX "home_summer_edit_copy_summer_edit_copy_hero_image_idx" ON "home" USING btree ("summer_edit_copy_hero_image_id");
  CREATE INDEX "home_summer_edit_copy_summer_edit_copy_hero_image_mobile_idx" ON "home" USING btree ("summer_edit_copy_hero_image_mobile_id");
  CREATE INDEX "home_campaign_copy_campaign_copy_image_idx" ON "home" USING btree ("campaign_copy_image_id");
  CREATE INDEX "home__status_idx" ON "home" USING btree ("_status");
  CREATE INDEX "home_rels_order_idx" ON "home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "home_rels" USING btree ("path");
  CREATE INDEX "home_rels_products_id_idx" ON "home_rels" USING btree ("products_id");
  CREATE INDEX "home_rels_brands_id_idx" ON "home_rels" USING btree ("brands_id");
  CREATE INDEX "_home_v_version_sections_order_idx" ON "_home_v_version_sections" USING btree ("_order");
  CREATE INDEX "_home_v_version_sections_parent_id_idx" ON "_home_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_slides_order_idx" ON "_home_v_version_hero_slides" USING btree ("_order");
  CREATE INDEX "_home_v_version_hero_slides_parent_id_idx" ON "_home_v_version_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_slides_image_idx" ON "_home_v_version_hero_slides" USING btree ("image_id");
  CREATE INDEX "_home_v_version_hero_slides_mobile_image_idx" ON "_home_v_version_hero_slides" USING btree ("mobile_image_id");
  CREATE INDEX "_home_v_version_cta_pair1_order_idx" ON "_home_v_version_cta_pair1" USING btree ("_order");
  CREATE INDEX "_home_v_version_cta_pair1_parent_id_idx" ON "_home_v_version_cta_pair1" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_cta_pair1_image_idx" ON "_home_v_version_cta_pair1" USING btree ("image_id");
  CREATE INDEX "_home_v_version_rails_order_idx" ON "_home_v_version_rails" USING btree ("_order");
  CREATE INDEX "_home_v_version_rails_parent_id_idx" ON "_home_v_version_rails" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_rails_brand_filter_idx" ON "_home_v_version_rails" USING btree ("brand_filter_id");
  CREATE INDEX "_home_v_version_rails_editorial_image_idx" ON "_home_v_version_rails" USING btree ("editorial_image_id");
  CREATE INDEX "_home_v_version_rails_brand_feature_brand_feature_image_idx" ON "_home_v_version_rails" USING btree ("brand_feature_image_id");
  CREATE INDEX "_home_v_version_brands_featured_order_idx" ON "_home_v_version_brands_featured" USING btree ("_order");
  CREATE INDEX "_home_v_version_brands_featured_parent_id_idx" ON "_home_v_version_brands_featured" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_brands_featured_brand_idx" ON "_home_v_version_brands_featured" USING btree ("brand_id");
  CREATE INDEX "_home_v_version_brands_featured_image_idx" ON "_home_v_version_brands_featured" USING btree ("image_id");
  CREATE INDEX "_home_v_version_cta_pair2_order_idx" ON "_home_v_version_cta_pair2" USING btree ("_order");
  CREATE INDEX "_home_v_version_cta_pair2_parent_id_idx" ON "_home_v_version_cta_pair2" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_cta_pair2_image_idx" ON "_home_v_version_cta_pair2" USING btree ("image_id");
  CREATE INDEX "_home_v_version_dermo_picks_order_idx" ON "_home_v_version_dermo_picks" USING btree ("_order");
  CREATE INDEX "_home_v_version_dermo_picks_parent_id_idx" ON "_home_v_version_dermo_picks" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_dermo_picks_product_idx" ON "_home_v_version_dermo_picks" USING btree ("product_id");
  CREATE INDEX "_home_v_version_summer_edit_copy_highlights_order_idx" ON "_home_v_version_summer_edit_copy_highlights" USING btree ("_order");
  CREATE INDEX "_home_v_version_summer_edit_copy_highlights_parent_id_idx" ON "_home_v_version_summer_edit_copy_highlights" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_summer_edit_acts_order_idx" ON "_home_v_version_summer_edit_acts" USING btree ("_order");
  CREATE INDEX "_home_v_version_summer_edit_acts_parent_id_idx" ON "_home_v_version_summer_edit_acts" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_coffrets_order_idx" ON "_home_v_version_coffrets" USING btree ("_order");
  CREATE INDEX "_home_v_version_coffrets_parent_id_idx" ON "_home_v_version_coffrets" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_coffrets_image_idx" ON "_home_v_version_coffrets" USING btree ("image_id");
  CREATE INDEX "_home_v_version_trust_badges_order_idx" ON "_home_v_version_trust_badges" USING btree ("_order");
  CREATE INDEX "_home_v_version_trust_badges_parent_id_idx" ON "_home_v_version_trust_badges" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_review_bars_order_idx" ON "_home_v_version_review_bars" USING btree ("_order");
  CREATE INDEX "_home_v_version_review_bars_parent_id_idx" ON "_home_v_version_review_bars" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_sample_reviews_order_idx" ON "_home_v_version_sample_reviews" USING btree ("_order");
  CREATE INDEX "_home_v_version_sample_reviews_parent_id_idx" ON "_home_v_version_sample_reviews" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_services_teaser_order_idx" ON "_home_v_version_services_teaser" USING btree ("_order");
  CREATE INDEX "_home_v_version_services_teaser_parent_id_idx" ON "_home_v_version_services_teaser" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_dermo_corner_copy_version_dermo_corner_c_idx" ON "_home_v" USING btree ("version_dermo_corner_copy_image_id");
  CREATE INDEX "_home_v_version_image_carousel_copy_version_image_carous_idx" ON "_home_v" USING btree ("version_image_carousel_copy_image_id");
  CREATE INDEX "_home_v_version_summer_edit_copy_version_summer_edit_cop_idx" ON "_home_v" USING btree ("version_summer_edit_copy_hero_image_id");
  CREATE INDEX "_home_v_version_summer_edit_copy_version_summer_edit_c_1_idx" ON "_home_v" USING btree ("version_summer_edit_copy_hero_image_mobile_id");
  CREATE INDEX "_home_v_version_campaign_copy_version_campaign_copy_imag_idx" ON "_home_v" USING btree ("version_campaign_copy_image_id");
  CREATE INDEX "_home_v_version_version__status_idx" ON "_home_v" USING btree ("version__status");
  CREATE INDEX "_home_v_created_at_idx" ON "_home_v" USING btree ("created_at");
  CREATE INDEX "_home_v_updated_at_idx" ON "_home_v" USING btree ("updated_at");
  CREATE INDEX "_home_v_latest_idx" ON "_home_v" USING btree ("latest");
  CREATE INDEX "_home_v_rels_order_idx" ON "_home_v_rels" USING btree ("order");
  CREATE INDEX "_home_v_rels_parent_idx" ON "_home_v_rels" USING btree ("parent_id");
  CREATE INDEX "_home_v_rels_path_idx" ON "_home_v_rels" USING btree ("path");
  CREATE INDEX "_home_v_rels_products_id_idx" ON "_home_v_rels" USING btree ("products_id");
  CREATE INDEX "_home_v_rels_brands_id_idx" ON "_home_v_rels" USING btree ("brands_id");
  CREATE INDEX "collections_page_cards_order_idx" ON "collections_page_cards" USING btree ("_order");
  CREATE INDEX "collections_page_cards_parent_id_idx" ON "collections_page_cards" USING btree ("_parent_id");
  CREATE INDEX "collections_page_cards_image_idx" ON "collections_page_cards" USING btree ("image_id");
  CREATE INDEX "catalogue_page_quick_filters_order_idx" ON "catalogue_page_quick_filters" USING btree ("_order");
  CREATE INDEX "catalogue_page_quick_filters_parent_id_idx" ON "catalogue_page_quick_filters" USING btree ("_parent_id");
  CREATE INDEX "catalogue_page_tag_to_category_order_idx" ON "catalogue_page_tag_to_category" USING btree ("_order");
  CREATE INDEX "catalogue_page_tag_to_category_parent_id_idx" ON "catalogue_page_tag_to_category" USING btree ("_parent_id");
  CREATE INDEX "catalogue_page_editorial_tiles_order_idx" ON "catalogue_page_editorial_tiles" USING btree ("_order");
  CREATE INDEX "catalogue_page_editorial_tiles_parent_id_idx" ON "catalogue_page_editorial_tiles" USING btree ("_parent_id");
  CREATE INDEX "catalogue_page_editorial_tiles_image_idx" ON "catalogue_page_editorial_tiles" USING btree ("image_id");
  CREATE INDEX "catalogue_page_needs_order_idx" ON "catalogue_page_needs" USING btree ("_order");
  CREATE INDEX "catalogue_page_needs_parent_id_idx" ON "catalogue_page_needs" USING btree ("_parent_id");
  CREATE INDEX "catalogue_page_seo_intro_paragraphs_order_idx" ON "catalogue_page_seo_intro_paragraphs" USING btree ("_order");
  CREATE INDEX "catalogue_page_seo_intro_paragraphs_parent_id_idx" ON "catalogue_page_seo_intro_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "catalogue_page_featured_tile_featured_tile_image_idx" ON "catalogue_page" USING btree ("featured_tile_image_id");
  CREATE INDEX "catalogue_page_guide_guide_image_idx" ON "catalogue_page" USING btree ("guide_image_id");
  CREATE INDEX "catalogue_page_rels_order_idx" ON "catalogue_page_rels" USING btree ("order");
  CREATE INDEX "catalogue_page_rels_parent_idx" ON "catalogue_page_rels" USING btree ("parent_id");
  CREATE INDEX "catalogue_page_rels_path_idx" ON "catalogue_page_rels" USING btree ("path");
  CREATE INDEX "catalogue_page_rels_brands_id_idx" ON "catalogue_page_rels" USING btree ("brands_id");
  CREATE INDEX "site_chrome_top_bar_messages_order_idx" ON "site_chrome_top_bar_messages" USING btree ("_order");
  CREATE INDEX "site_chrome_top_bar_messages_parent_id_idx" ON "site_chrome_top_bar_messages" USING btree ("_parent_id");
  CREATE INDEX "site_chrome_header_actions_order_idx" ON "site_chrome_header_actions" USING btree ("_order");
  CREATE INDEX "site_chrome_header_actions_parent_id_idx" ON "site_chrome_header_actions" USING btree ("_parent_id");
  CREATE INDEX "site_chrome_footer_columns_links_order_idx" ON "site_chrome_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_chrome_footer_columns_links_parent_id_idx" ON "site_chrome_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_chrome_footer_columns_order_idx" ON "site_chrome_footer_columns" USING btree ("_order");
  CREATE INDEX "site_chrome_footer_columns_parent_id_idx" ON "site_chrome_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "site_chrome_logo_logo_image_idx" ON "site_chrome" USING btree ("logo_image_id");
  CREATE INDEX "site_chrome__status_idx" ON "site_chrome" USING btree ("_status");
  CREATE INDEX "_site_chrome_v_version_top_bar_messages_order_idx" ON "_site_chrome_v_version_top_bar_messages" USING btree ("_order");
  CREATE INDEX "_site_chrome_v_version_top_bar_messages_parent_id_idx" ON "_site_chrome_v_version_top_bar_messages" USING btree ("_parent_id");
  CREATE INDEX "_site_chrome_v_version_header_actions_order_idx" ON "_site_chrome_v_version_header_actions" USING btree ("_order");
  CREATE INDEX "_site_chrome_v_version_header_actions_parent_id_idx" ON "_site_chrome_v_version_header_actions" USING btree ("_parent_id");
  CREATE INDEX "_site_chrome_v_version_footer_columns_links_order_idx" ON "_site_chrome_v_version_footer_columns_links" USING btree ("_order");
  CREATE INDEX "_site_chrome_v_version_footer_columns_links_parent_id_idx" ON "_site_chrome_v_version_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_site_chrome_v_version_footer_columns_order_idx" ON "_site_chrome_v_version_footer_columns" USING btree ("_order");
  CREATE INDEX "_site_chrome_v_version_footer_columns_parent_id_idx" ON "_site_chrome_v_version_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "_site_chrome_v_version_logo_version_logo_image_idx" ON "_site_chrome_v" USING btree ("version_logo_image_id");
  CREATE INDEX "_site_chrome_v_version_version__status_idx" ON "_site_chrome_v" USING btree ("version__status");
  CREATE INDEX "_site_chrome_v_created_at_idx" ON "_site_chrome_v" USING btree ("created_at");
  CREATE INDEX "_site_chrome_v_updated_at_idx" ON "_site_chrome_v" USING btree ("updated_at");
  CREATE INDEX "_site_chrome_v_latest_idx" ON "_site_chrome_v" USING btree ("latest");
  CREATE INDEX "theme__status_idx" ON "theme" USING btree ("_status");
  CREATE INDEX "_theme_v_version_version__status_idx" ON "_theme_v" USING btree ("version__status");
  CREATE INDEX "_theme_v_created_at_idx" ON "_theme_v" USING btree ("created_at");
  CREATE INDEX "_theme_v_updated_at_idx" ON "_theme_v" USING btree ("updated_at");
  CREATE INDEX "_theme_v_latest_idx" ON "_theme_v" USING btree ("latest");
  CREATE INDEX "navigation_items_mega_menu_columns_links_order_idx" ON "navigation_items_mega_menu_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_items_mega_menu_columns_links_parent_id_idx" ON "navigation_items_mega_menu_columns_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_items_mega_menu_columns_links_category_idx" ON "navigation_items_mega_menu_columns_links" USING btree ("category_id");
  CREATE INDEX "navigation_items_mega_menu_columns_links_brand_idx" ON "navigation_items_mega_menu_columns_links" USING btree ("brand_id");
  CREATE INDEX "navigation_items_mega_menu_columns_order_idx" ON "navigation_items_mega_menu_columns" USING btree ("_order");
  CREATE INDEX "navigation_items_mega_menu_columns_parent_id_idx" ON "navigation_items_mega_menu_columns" USING btree ("_parent_id");
  CREATE INDEX "navigation_items_order_idx" ON "navigation_items" USING btree ("_order");
  CREATE INDEX "navigation_items_parent_id_idx" ON "navigation_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_items_category_idx" ON "navigation_items" USING btree ("category_id");
  CREATE INDEX "navigation_items_brand_idx" ON "navigation_items" USING btree ("brand_id");
  CREATE INDEX "navigation_items_mega_menu_promo_mega_menu_promo_image_idx" ON "navigation_items" USING btree ("mega_menu_promo_image_id");
  CREATE INDEX "navigation__status_idx" ON "navigation" USING btree ("_status");
  CREATE INDEX "_navigation_v_version_items_mega_menu_columns_links_order_idx" ON "_navigation_v_version_items_mega_menu_columns_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_items_mega_menu_columns_links_parent_id_idx" ON "_navigation_v_version_items_mega_menu_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_items_mega_menu_columns_links_cate_idx" ON "_navigation_v_version_items_mega_menu_columns_links" USING btree ("category_id");
  CREATE INDEX "_navigation_v_version_items_mega_menu_columns_links_bran_idx" ON "_navigation_v_version_items_mega_menu_columns_links" USING btree ("brand_id");
  CREATE INDEX "_navigation_v_version_items_mega_menu_columns_order_idx" ON "_navigation_v_version_items_mega_menu_columns" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_items_mega_menu_columns_parent_id_idx" ON "_navigation_v_version_items_mega_menu_columns" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_items_order_idx" ON "_navigation_v_version_items" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_items_parent_id_idx" ON "_navigation_v_version_items" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_items_category_idx" ON "_navigation_v_version_items" USING btree ("category_id");
  CREATE INDEX "_navigation_v_version_items_brand_idx" ON "_navigation_v_version_items" USING btree ("brand_id");
  CREATE INDEX "_navigation_v_version_items_mega_menu_promo_mega_menu_pr_idx" ON "_navigation_v_version_items" USING btree ("mega_menu_promo_image_id");
  CREATE INDEX "_navigation_v_version_version__status_idx" ON "_navigation_v" USING btree ("version__status");
  CREATE INDEX "_navigation_v_created_at_idx" ON "_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "_navigation_v" USING btree ("updated_at");
  CREATE INDEX "_navigation_v_latest_idx" ON "_navigation_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "products_gallery" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "services_benefits" CASCADE;
  DROP TABLE "services_steps" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "stores_hours" CASCADE;
  DROP TABLE "stores" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "suppliers" CASCADE;
  DROP TABLE "inventory" CASCADE;
  DROP TABLE "stock_movements" CASCADE;
  DROP TABLE "instagram_posts" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "api_request_logs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "home_sections" CASCADE;
  DROP TABLE "home_hero_slides" CASCADE;
  DROP TABLE "home_cta_pair1" CASCADE;
  DROP TABLE "home_rails" CASCADE;
  DROP TABLE "home_brands_featured" CASCADE;
  DROP TABLE "home_cta_pair2" CASCADE;
  DROP TABLE "home_dermo_picks" CASCADE;
  DROP TABLE "home_summer_edit_copy_highlights" CASCADE;
  DROP TABLE "home_summer_edit_acts" CASCADE;
  DROP TABLE "home_coffrets" CASCADE;
  DROP TABLE "home_trust_badges" CASCADE;
  DROP TABLE "home_review_bars" CASCADE;
  DROP TABLE "home_sample_reviews" CASCADE;
  DROP TABLE "home_services_teaser" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_rels" CASCADE;
  DROP TABLE "_home_v_version_sections" CASCADE;
  DROP TABLE "_home_v_version_hero_slides" CASCADE;
  DROP TABLE "_home_v_version_cta_pair1" CASCADE;
  DROP TABLE "_home_v_version_rails" CASCADE;
  DROP TABLE "_home_v_version_brands_featured" CASCADE;
  DROP TABLE "_home_v_version_cta_pair2" CASCADE;
  DROP TABLE "_home_v_version_dermo_picks" CASCADE;
  DROP TABLE "_home_v_version_summer_edit_copy_highlights" CASCADE;
  DROP TABLE "_home_v_version_summer_edit_acts" CASCADE;
  DROP TABLE "_home_v_version_coffrets" CASCADE;
  DROP TABLE "_home_v_version_trust_badges" CASCADE;
  DROP TABLE "_home_v_version_review_bars" CASCADE;
  DROP TABLE "_home_v_version_sample_reviews" CASCADE;
  DROP TABLE "_home_v_version_services_teaser" CASCADE;
  DROP TABLE "_home_v" CASCADE;
  DROP TABLE "_home_v_rels" CASCADE;
  DROP TABLE "collections_page_cards" CASCADE;
  DROP TABLE "collections_page" CASCADE;
  DROP TABLE "catalogue_page_quick_filters" CASCADE;
  DROP TABLE "catalogue_page_tag_to_category" CASCADE;
  DROP TABLE "catalogue_page_editorial_tiles" CASCADE;
  DROP TABLE "catalogue_page_needs" CASCADE;
  DROP TABLE "catalogue_page_seo_intro_paragraphs" CASCADE;
  DROP TABLE "catalogue_page" CASCADE;
  DROP TABLE "catalogue_page_rels" CASCADE;
  DROP TABLE "site_chrome_top_bar_messages" CASCADE;
  DROP TABLE "site_chrome_header_actions" CASCADE;
  DROP TABLE "site_chrome_footer_columns_links" CASCADE;
  DROP TABLE "site_chrome_footer_columns" CASCADE;
  DROP TABLE "site_chrome" CASCADE;
  DROP TABLE "_site_chrome_v_version_top_bar_messages" CASCADE;
  DROP TABLE "_site_chrome_v_version_header_actions" CASCADE;
  DROP TABLE "_site_chrome_v_version_footer_columns_links" CASCADE;
  DROP TABLE "_site_chrome_v_version_footer_columns" CASCADE;
  DROP TABLE "_site_chrome_v" CASCADE;
  DROP TABLE "theme" CASCADE;
  DROP TABLE "_theme_v" CASCADE;
  DROP TABLE "navigation_items_mega_menu_columns_links" CASCADE;
  DROP TABLE "navigation_items_mega_menu_columns" CASCADE;
  DROP TABLE "navigation_items" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "_navigation_v_version_items_mega_menu_columns_links" CASCADE;
  DROP TABLE "_navigation_v_version_items_mega_menu_columns" CASCADE;
  DROP TABLE "_navigation_v_version_items" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_products_category";
  DROP TYPE "public"."enum_services_icon";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_stock_movements_source";
  DROP TYPE "public"."enum_instagram_posts_media_type";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_payload_folders_folder_type";
  DROP TYPE "public"."enum_home_hero_slides_align";
  DROP TYPE "public"."enum_home_rails_product_source";
  DROP TYPE "public"."enum_home_rails_category";
  DROP TYPE "public"."enum_home_rails_sort_order";
  DROP TYPE "public"."enum_home_rails_badge_style";
  DROP TYPE "public"."enum_home_summer_edit_copy_highlights_icon";
  DROP TYPE "public"."enum_home_trust_badges_icon";
  DROP TYPE "public"."enum_home_services_teaser_icon";
  DROP TYPE "public"."enum_home_summer_edit_copy_image_position";
  DROP TYPE "public"."enum_home_summer_edit_copy_animation_speed";
  DROP TYPE "public"."enum_home_coffrets_copy_layout";
  DROP TYPE "public"."enum_home_status";
  DROP TYPE "public"."enum__home_v_version_hero_slides_align";
  DROP TYPE "public"."enum__home_v_version_rails_product_source";
  DROP TYPE "public"."enum__home_v_version_rails_category";
  DROP TYPE "public"."enum__home_v_version_rails_sort_order";
  DROP TYPE "public"."enum__home_v_version_rails_badge_style";
  DROP TYPE "public"."enum__home_v_version_summer_edit_copy_highlights_icon";
  DROP TYPE "public"."enum__home_v_version_trust_badges_icon";
  DROP TYPE "public"."enum__home_v_version_services_teaser_icon";
  DROP TYPE "public"."enum__home_v_version_summer_edit_copy_image_position";
  DROP TYPE "public"."enum__home_v_version_summer_edit_copy_animation_speed";
  DROP TYPE "public"."enum__home_v_version_coffrets_copy_layout";
  DROP TYPE "public"."enum__home_v_version_status";
  DROP TYPE "public"."enum_catalogue_page_tag_to_category_category";
  DROP TYPE "public"."enum_catalogue_page_needs_icon";
  DROP TYPE "public"."enum_site_chrome_header_actions_key";
  DROP TYPE "public"."enum_site_chrome_header_actions_icon";
  DROP TYPE "public"."enum_site_chrome_status";
  DROP TYPE "public"."enum__site_chrome_v_version_header_actions_key";
  DROP TYPE "public"."enum__site_chrome_v_version_header_actions_icon";
  DROP TYPE "public"."enum__site_chrome_v_version_status";
  DROP TYPE "public"."enum_theme_preset";
  DROP TYPE "public"."enum_theme_status";
  DROP TYPE "public"."enum__theme_v_version_preset";
  DROP TYPE "public"."enum__theme_v_version_status";
  DROP TYPE "public"."enum_navigation_items_mega_menu_columns_links_type";
  DROP TYPE "public"."enum_navigation_items_type";
  DROP TYPE "public"."enum_navigation_items_collection_route";
  DROP TYPE "public"."enum_navigation_items_page_route";
  DROP TYPE "public"."enum_navigation_items_badge_color";
  DROP TYPE "public"."enum_navigation_status";
  DROP TYPE "public"."enum__navigation_v_version_items_mega_menu_columns_links_type";
  DROP TYPE "public"."enum__navigation_v_version_items_type";
  DROP TYPE "public"."enum__navigation_v_version_items_collection_route";
  DROP TYPE "public"."enum__navigation_v_version_items_page_route";
  DROP TYPE "public"."enum__navigation_v_version_items_badge_color";
  DROP TYPE "public"."enum__navigation_v_version_status";`)
}
