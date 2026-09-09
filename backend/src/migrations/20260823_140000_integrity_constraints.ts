import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Invariants d'intégrité, tenus par la base plutôt que seulement par
// l'application.
//
// POURQUOI
// Le schéma ne portait aucune contrainte CHECK — vérifié sur les 105 tables.
// « stock >= 0 » tenait uniquement grâce au `AND stock >= $1` de la requête de
// décrément (src/lib/inventorySql.ts), et « price >= 0 » uniquement grâce au
// `min: 0` de Payload. Ces deux garde-fous sont réels et testés, mais ils ne
// couvrent que le chemin applicatif : un correctif SQL passé à la main, un
// import, un dump restauré ou une future route qui écrirait directement
// n'ont rien qui les arrête. Une contrainte, elle, tient quel que soit le
// chemin d'écriture.
//
// ÉTAT ACTUEL DES DONNÉES
// Compté sur la base de développement avant d'écrire cette migration : zéro
// violation pour chacun des invariants ci-dessous (stock, prix, quantités,
// totaux, compteurs, rédemptions orphelines). `ADD CONSTRAINT` valide la
// table existante, donc sur des données propres il ne peut pas échouer ; sur
// une base qui contiendrait une ligne fautive, la migration s'arrêterait en
// la nommant, ce qui est le comportement voulu — mieux vaut refuser de migrer
// que de laisser passer une incohérence silencieuse.
//
// CE QUI N'EST DÉLIBÉRÉMENT PAS AJOUTÉ
// - `orders.total >= 0` : le total est calculé serveur et déjà borné par
//   `Math.max(0, ...)`, mais un avoir ou un ajustement négatif est une
//   évolution métier plausible. Contraindre ici bloquerait cette porte sans
//   qu'on ait décidé de la fermer.
// - `products.stock <= seuil` ou toute règle de gestion : ce sont des règles
//   métier, pas des invariants de cohérence.
// - Le statut de commande et le mode de paiement sont déjà des enums côté
//   base ou résolus depuis une table fermée côté serveur.
//
// RÉVERSIBLE : `down()` retire exactement ce que `up()` ajoute, sans toucher
// aux données.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Le stock ne peut pas être négatif. C'est l'invariant que la garde
    -- 'AND stock >= $1' protège déjà sur le chemin du checkout ; ici il vaut
    -- aussi pour un UPDATE écrit à la main.
    ALTER TABLE "products"
      ADD CONSTRAINT "products_stock_non_negative" CHECK ("stock" >= 0);

    ALTER TABLE "products_variants"
      ADD CONSTRAINT "products_variants_stock_non_negative" CHECK ("stock" >= 0);

    -- Les prix. NULL reste permis là où la colonne est optionnelle : une
    -- contrainte CHECK n'est violée que par une valeur présente et fausse.
    ALTER TABLE "products"
      ADD CONSTRAINT "products_price_non_negative" CHECK ("price" >= 0);

    ALTER TABLE "products"
      ADD CONSTRAINT "products_old_price_non_negative" CHECK ("old_price" IS NULL OR "old_price" >= 0);

    ALTER TABLE "products_variants"
      ADD CONSTRAINT "products_variants_price_non_negative" CHECK ("price" IS NULL OR "price" >= 0);

    -- Une ligne de commande porte au moins une unité, à un prix qui n'est pas
    -- négatif. Une quantité nulle ou négative rendrait le total incohérent
    -- avec ce qui a été prélevé du stock.
    ALTER TABLE "orders_items"
      ADD CONSTRAINT "orders_items_quantity_positive" CHECK ("quantity" > 0);

    ALTER TABLE "orders_items"
      ADD CONSTRAINT "orders_items_price_non_negative" CHECK ("price" >= 0);

    -- Compteur d'utilisation d'un coupon : il compte des rédemptions réelles,
    -- il ne peut pas descendre sous zéro.
    ALTER TABLE "coupons"
      ADD CONSTRAINT "coupons_usage_count_non_negative" CHECK ("usage_count" IS NULL OR "usage_count" >= 0);

    -- Une remise enregistrée est un montant retiré, jamais ajouté.
    ALTER TABLE "coupon_redemptions"
      ADD CONSTRAINT "coupon_redemptions_discount_non_negative" CHECK ("discount_amount" >= 0);
  `)

  await db.execute(sql`
    -- La rédemption référençait un coupon par un identifiant NOT NULL, mais
    -- sans clé étrangère : rien n'empêchait une ligne de pointer vers un
    -- coupon supprimé. Or c'est exactement cette table que 'evaluateCoupon'
    -- interroge pour compter les utilisations par client — une référence
    -- pendante y fausserait le compte en silence.
    --
    -- RESTRICT plutôt que CASCADE : le registre des rédemptions est la trace
    -- comptable d'une remise accordée. Supprimer un coupon ne doit pas
    -- effacer l'historique des commandes qui en ont bénéficié ; la
    -- suppression échoue, et c'est la bonne réponse.
    DO $$ BEGIN
      ALTER TABLE "coupon_redemptions"
        ADD CONSTRAINT "coupon_redemptions_coupon_id_fk"
        FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE RESTRICT;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Retire les contraintes sans toucher aux lignes. `IF EXISTS` pour que le
  // retour arrière soit rejouable même partiellement appliqué.
  await db.execute(sql`
    ALTER TABLE "coupon_redemptions" DROP CONSTRAINT IF EXISTS "coupon_redemptions_coupon_id_fk";
    ALTER TABLE "coupon_redemptions" DROP CONSTRAINT IF EXISTS "coupon_redemptions_discount_non_negative";
    ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_usage_count_non_negative";
    ALTER TABLE "orders_items" DROP CONSTRAINT IF EXISTS "orders_items_price_non_negative";
    ALTER TABLE "orders_items" DROP CONSTRAINT IF EXISTS "orders_items_quantity_positive";
    ALTER TABLE "products_variants" DROP CONSTRAINT IF EXISTS "products_variants_price_non_negative";
    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_old_price_non_negative";
    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_price_non_negative";
    ALTER TABLE "products_variants" DROP CONSTRAINT IF EXISTS "products_variants_stock_non_negative";
    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_stock_non_negative";
  `)
}
