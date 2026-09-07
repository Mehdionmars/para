import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The aisle a product sits in, one level under `category`.
//
// Additive on purpose. `category` keeps its nine broad shelves, because the
// home rails, the catalogue's tag mapping and /shop/visage all read it — and
// its enum type, enum_products_category, is shared with home_rails,
// _home_v_version_rails and catalogue_page_tag_to_category, so widening it
// would reach three tables that have nothing to do with this.
//
// Products are not versioned in this project: there is no _products_v twin
// to keep in step, which is the first time in this schema that a column can
// be added without doing it twice.
//
// The 139 assignments below are the published catalogue, classified from
// product names and reviewed before this was written. The 83 unpublished
// products are deliberately left null — several of them carry a wrong broad
// category already (Isdinceutics face serums filed under Cheveux), and a
// guess there would shelve a dermatological product wrongly.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_sub_category" AS ENUM('solaire', 'purifiants', 'chute-de-cheveux', 'anti-age', 'peaux-seches', 'anti-taches', 'peelings-doux', 'cremes-cicatrisantes', 'nettoyants', 'laits-corps', 'shampoings-traitants', 'soins-mains-pieds', 'peaux-sensibles', 'hygiene-intime', 'apres-epilation', 'apres-shampoings', 'demaquillants', 'masques-capillaires', 'cheveux-ongles');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "sub_category" "public"."enum_products_sub_category";
  `)

  // One statement rather than 139: the whole assignment lands or none of it
  // does, and a half-shelved catalogue is worse than an unshelved one.
  await db.execute(sql`
    UPDATE "products" AS p
    SET "sub_category" = v.sub::"public"."enum_products_sub_category"
    FROM (VALUES
      (104, 'solaire'),
      (105, 'solaire'),
      (106, 'peaux-seches'),
      (107, 'purifiants'),
      (108, 'purifiants'),
      (109, 'purifiants'),
      (110, 'anti-age'),
      (111, 'purifiants'),
      (112, 'apres-epilation'),
      (113, 'apres-epilation'),
      (114, 'nettoyants'),
      (115, 'peaux-seches'),
      (116, 'laits-corps'),
      (117, 'laits-corps'),
      (118, 'hygiene-intime'),
      (119, 'hygiene-intime'),
      (120, 'apres-epilation'),
      (121, 'shampoings-traitants'),
      (122, 'chute-de-cheveux'),
      (123, 'laits-corps'),
      (124, 'cremes-cicatrisantes'),
      (125, 'cremes-cicatrisantes'),
      (126, 'cremes-cicatrisantes'),
      (127, 'peaux-sensibles'),
      (128, 'chute-de-cheveux'),
      (129, 'chute-de-cheveux'),
      (130, 'chute-de-cheveux'),
      (131, 'chute-de-cheveux'),
      (132, 'chute-de-cheveux'),
      (133, 'chute-de-cheveux'),
      (134, 'purifiants'),
      (135, 'solaire'),
      (136, 'purifiants'),
      (137, 'cremes-cicatrisantes'),
      (139, 'solaire'),
      (140, 'peaux-seches'),
      (141, 'peaux-seches'),
      (142, 'peaux-seches'),
      (143, 'peaux-seches'),
      (144, 'peaux-seches'),
      (145, 'solaire'),
      (146, 'peaux-seches'),
      (147, 'peaux-seches'),
      (148, 'solaire'),
      (149, 'solaire'),
      (150, 'solaire'),
      (151, 'peaux-sensibles'),
      (152, 'peaux-sensibles'),
      (153, 'peaux-sensibles'),
      (154, 'cremes-cicatrisantes'),
      (155, 'hygiene-intime'),
      (156, 'hygiene-intime'),
      (157, 'purifiants'),
      (158, 'cremes-cicatrisantes'),
      (159, 'purifiants'),
      (160, 'solaire'),
      (161, 'purifiants'),
      (162, 'cremes-cicatrisantes'),
      (163, 'anti-taches'),
      (164, 'anti-taches'),
      (165, 'solaire'),
      (166, 'solaire'),
      (167, 'anti-taches'),
      (168, 'anti-taches'),
      (169, 'nettoyants'),
      (170, 'purifiants'),
      (171, 'laits-corps'),
      (172, 'solaire'),
      (173, 'nettoyants'),
      (174, 'peaux-seches'),
      (175, 'soins-mains-pieds'),
      (176, 'soins-mains-pieds'),
      (177, 'soins-mains-pieds'),
      (178, 'soins-mains-pieds'),
      (179, 'soins-mains-pieds'),
      (180, 'soins-mains-pieds'),
      (181, 'cremes-cicatrisantes'),
      (182, 'chute-de-cheveux'),
      (183, 'chute-de-cheveux'),
      (184, 'chute-de-cheveux'),
      (185, 'nettoyants'),
      (186, 'nettoyants'),
      (187, 'anti-age'),
      (188, 'anti-age'),
      (189, 'solaire'),
      (190, 'anti-age'),
      (191, 'anti-age'),
      (192, 'solaire'),
      (193, 'peelings-doux'),
      (194, 'peelings-doux'),
      (195, 'peelings-doux'),
      (196, 'peelings-doux'),
      (197, 'peelings-doux'),
      (198, 'peelings-doux'),
      (199, 'anti-taches'),
      (200, 'anti-taches'),
      (201, 'solaire'),
      (202, 'laits-corps'),
      (203, 'anti-taches'),
      (204, 'cheveux-ongles'),
      (205, 'nettoyants'),
      (206, 'purifiants'),
      (207, 'purifiants'),
      (208, 'purifiants'),
      (209, 'peaux-seches'),
      (210, 'anti-age'),
      (211, 'laits-corps'),
      (212, 'anti-age'),
      (213, 'anti-age'),
      (214, 'demaquillants'),
      (215, 'anti-age'),
      (216, 'solaire'),
      (217, 'anti-age'),
      (218, 'anti-age'),
      (219, 'apres-epilation'),
      (220, 'anti-age'),
      (221, 'peaux-seches'),
      (222, 'anti-age'),
      (223, 'peaux-seches'),
      (224, 'purifiants'),
      (225, 'anti-taches'),
      (226, 'solaire'),
      (227, 'peelings-doux'),
      (228, 'nettoyants'),
      (229, 'anti-taches'),
      (230, 'purifiants'),
      (231, 'peelings-doux'),
      (232, 'chute-de-cheveux'),
      (233, 'chute-de-cheveux'),
      (234, 'chute-de-cheveux'),
      (235, 'chute-de-cheveux'),
      (236, 'shampoings-traitants'),
      (237, 'shampoings-traitants'),
      (238, 'shampoings-traitants'),
      (239, 'shampoings-traitants'),
      (240, 'shampoings-traitants'),
      (244, 'apres-shampoings'),
      (245, 'masques-capillaires'),
      (246, 'peaux-sensibles')
    ) AS v(id, sub)
    WHERE p.id = v.id;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "products" DROP COLUMN IF EXISTS "sub_category";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_products_sub_category";`)
}
