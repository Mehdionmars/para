# Para d'Hiver — Audit backend & durcissement production

Audit complet du backend (Payload 3.87 · Next 16 · PostgreSQL 16) et de la
couche serveur du storefront/dashboard, avec les correctifs appliqués et les
preuves de chaque vérification.

**Environnement de test** : PostgreSQL 16 local (250 produits, 18 commandes
réelles) + une base de bench synthétique à 10 000 et 100 000 produits.
Backend `npm run dev` sur `:3001`, storefront sur `:3002`.

**Suites vertes en fin d'audit** : 73 tests unitaires, 116 tests d'intégration
(dont 26 nouveaux), 3 exécutions consécutives, typecheck backend et frontend
propres.

---

## 🔴 BLOCKERS — corrigés

### 1. N'importe qui pouvait créer une commande arbitraire

```
CHECK    POST /api/orders sans authentification
RESULT   AVANT : accepté — commande créée avec total 0, paymentStatus "paid",
         statut "delivered", et AUCUN stock décrémenté. /api/checkout n'était
         que la façon polie d'entrer.
EVIDENCE backend/src/collections/Orders.ts — access.create: () => true
ACTION   create: canEditOrders. La caisse publique écrit via la Local API
         (payload.create), dont overrideAccess vaut true par défaut
         (node_modules/payload/dist/collections/operations/local/create.js:7),
         donc /api/checkout est inchangé. Le back-office garde la création
         manuelle pour une vente téléphonique.
         Même correctif sur coupon-redemptions (registre d'audit falsifiable)
         et push-subscriptions.
TEST     tests/int/accessControl.int.spec.ts
RESULT   anonyme → 403 · customer/editor/stockManager → 403 · admin → 201
```

### 2. Escalade de privilèges sur l'import produits

```
CHECK    POST /api/import-products avec un compte de rôle "customer"
RESULT   AVANT : accepté. La garde était `if (!user)` — tout compte
         authentifié, y compris un rôle sans aucun accès staff ailleurs,
         pouvait créer et écraser des produits en masse. Aucune limite de
         taille ni d'extension de fichier sur cette route.
EVIDENCE backend/src/app/api/import-products/route.ts:71-74
ACTION   userHasRole(user, 'admin', 'manager', 'stockManager') + reprise des
         plafonds déjà présents sur /api/import/products/validate
         (15 Mo, .csv/.xlsx/.xls).
TEST     tests/int/accessControl.int.spec.ts
RESULT   customer/editor → 401 · admin/manager/stockManager → 400 (passe
         l'autorisation, arrêté par la validation « Aucun fichier reçu »)
```

### 3. Le stock des variantes disparaissait à chaque annulation

**Bug d'intégrité de données, silencieux, permanent.**

```
CHECK    Commander une variante, puis annuler la commande
RESULT   AVANT : products.stock recrédité, products_variants.stock JAMAIS.
         La caisse décrémente DEUX compteurs pour une ligne de variante ; le
         hook de restauration n'en recréditait qu'un. Chaque commande annulée
         ou remboursée détruisait donc définitivement du stock sur l'option
         vendue, sans mouvement enregistré et sans rien de visible dans l'UI.
         Ne se manifeste que le jour où une option qui devrait avoir du stock
         se déclare en rupture.
EVIDENCE backend/src/collections/Orders.ts (hook de restauration) et
         app/api/checkout/route.ts (écriture compensatoire) — même trou
ACTION   UPDATE products_variants SET stock = stock + $1
           WHERE id = $2 AND _parent_id = $3
         dans la transaction existante, aux deux endroits. Le contrôle sur
         _parent_id empêche un variantId périmé de créditer un autre produit.
TEST     tests/int/orderCancel.int.spec.ts (5 tests)
RESULT   après annulation : produit 20/20, variante 8/8
         + pas de double crédit sur re-sauvegarde ni sur returned → refunded
```

### 4. Aucune idempotence : double-clic = deux commandes

```
CHECK    Envoyer deux fois la même requête /api/checkout
RESULT   AVANT : deux commandes, deux décréments de stock. Invisible pour la
         transaction — les deux requêtes sont individuellement valides.
ACTION   En-tête Idempotency-Key, table idempotency_keys, claim par
         INSERT ... ON CONFLICT DO NOTHING RETURNING (même motif atomique que
         l'idempotence des notifications déjà en place). Rejeu → réponse
         stockée ; exécution en cours → 409 ; même clé sur un panier
         différent → 422. Absence de clé → fonctionne comme avant.
TEST     tests/int/idempotency.int.spec.ts (4 tests)
RESULT   rafale de 10 requêtes, même clé : 1 exécutée, 9 en cours (409),
         1 seule commande, stock déplacé une seule fois
```

### 5. Le catalogue chargeait 1000 produits à chaque requête

```
CHECK    Coût d'une requête /catalogue ou /marques
RESULT   AVANT : fetchVisibleDocs() récupérait 1000 produits, depth=1,
         cache "no-store", À CHAQUE requête, puis filtrait, triait, comptait
         les facettes et paginait en mémoire Node. Silencieusement FAUX
         au-delà de 1000 produits — la limite tronque sans rien dire.
EVIDENCE frontend/lib/storefront/catalogue.ts:58-73
ACTION   Filtrage, tri et pagination poussés dans Postgres (where + sort +
         limit + page). Facettes déplacées vers /api/catalogue/facets — trois
         agrégats SQL, identiques pour tous les visiteurs donc cachables au
         edge. Contrat de sortie inchangé (products / total / facets), aucun
         composant modifié.
TEST     Mesure directe, 74 produits vendables
RESULT   ancien : 216 ms, 132 Ko · nouveau : 103 ms, 44 Ko (x2,1 latence,
         x3 charge utile) — et surtout un coût qui ne croît plus avec le
         catalogue. Facettes seules : 49 ms.
         Filtres vérifiés : cat, tri prix, recherche, stock, maxPrice,
         limit=120 (pagine correctement au-delà du plafond de 100).
```

### 6. Le proxy cassait toutes les routes API sur le domaine admin

**Trouvé pendant les tests — jamais détecté auparavant.**

```
CHECK    /api/dashboard-auth/login depuis admin.paradhiver.ma
RESULT   AVANT : réécrit en /dashboard/api/dashboard-auth/login → 404.
         Le login, le logout, l'upload d'images et tout l'import étaient
         cassés sur le seul domaine depuis lequel le dashboard est servi.
         Sur localhost, le storefront entier était inatteignable.
EVIDENCE en-tête de réponse : x-middleware-rewrite: /dashboard/api/catalogue
ACTION   frontend/proxy.ts — /api/* exclu de toute réécriture, sur tous les
         hôtes.
TEST     curl avant/après
RESULT   404 → 200 sur les 5 combinaisons de filtres catalogue
```

### 7. Un INSERT Postgres à chaque opération Payload

```
CHECK    Coût du monitoring API
RESULT   AVANT : apiMonitoringPlugin écrivait une ligne api-request-logs sur
         CHAQUE afterOperation de CHAQUE collection — chaque lecture produit
         du storefront comprise. La charge d'écriture double exactement au
         moment où le trafic de lecture culmine, sur une table sans rétention.
         Le monitoring était le composant le plus susceptible de tomber en
         premier sous la charge qu'il sert à mesurer.
ACTION   Échantillonnage (API_LOG_SAMPLE_RATE, 5 % par défaut) : 100 % des
         erreurs et des écritures conservés, lectures réussies échantillonnées.
         Purge de rétention à 30 jours dans /api/jobs/tick.
```

### 8. Aucun rate limiting applicatif · 9. Démarrage avec un secret vide

```
CHECK    process.env.PAYLOAD_SECRET || ''
RESULT   AVANT : un déploiement sans PAYLOAD_SECRET démarrait sans bruit et
         signait des JWT que n'importe qui peut forger.
ACTION   backend/src/lib/env.ts — validation fail-fast au démarrage.
TEST     Le validateur a lui-même détecté une incohérence réelle pendant
         l'audit (EMAIL_FROM sans transport), ce qui a révélé un défaut dans
         ma première version : EMAIL_FROM est partagé entre Resend et le
         fournisseur HTTP générique. Corrigé pour refléter la résolution
         réelle de providers.ts.
```

Rate limiting : tables Postgres, fenêtre fixe atomique, appliqué via
`withApiLog` (le wrapper déjà commun à toutes les routes). Détails et preuves
en section 🔐.

---

## ⚠️ NEEDS ATTENTION

### L'email n'a jamais fonctionné

```
CHECK    État réel des notifications
RESULT   RESEND_API_KEY, EMAIL_FROM et STOCK_ALERT_EMAIL sont VIDES dans
         backend/.env. 2 219 notifications en attente, dont 889 emails
         clients jamais partis. Le code dégrade honnêtement (statut
         "pending" + raison enregistrée) — mais personne ne regarde.
ACTION   Aucun code à corriger : il faut renseigner les variables. Le
         validateur d'environnement signale désormais explicitement le cas
         « EMAIL_FROM sans transport ».
TEST     Drain prouvé de bout en bout contre un faux fournisseur local
RESULT   569 en backlog drainés en 13 ticks, 773 envoyés = 773 reçus
```

### L'email bloquait la requête de l'acheteur

```
CHECK    notifyOrderEvent await'é dans /api/checkout
ACTION   Option `defer` : les lignes sont écrites (même unicité
         order/type/channel) et la livraison passe par /api/jobs/tick.
TEST     Commande réelle, fournisseur email actif
RESULT   checkout 200 en 841 ms · emails partis pendant la requête : 0
         · notifications enregistrées : email pending, push pending,
         internal sent · après drain : sent, attempts=1
```

Deux bugs trouvés en construisant ce drain, tous deux corrigés :
- **canal non configuré = tentative consommée.** Correct pour le bouton
  « relancer » du dashboard, faux pour un drain automatique : en trois minutes
  tout le backlog aurait été marqué définitivement indélivrable, donc perdu le
  jour où les clés seraient enfin renseignées.
- **117 lignes staff sans destinataire** renvoyaient `no-recipient` *sans*
  consommer de tentative → resélectionnées à chaque tick pour toujours, et
  comme le lot est trié du plus ancien au plus récent, elles affamaient
  définitivement tout message livrable derrière elles.

### Numéro de commande : collision possible

```
CHECK    PDH-YYMMDD- + 4 caractères aléatoires, colonne UNIQUE
RESULT   1 679 616 valeurs par jour, mais par la borne des anniversaires une
         collision devient probable autour de ~1 500 commandes/jour. Et ce
         n'est pas un quasi-échec rattrapé : l'INSERT est rejeté APRÈS que la
         transaction ait validé le décrément de stock. L'acheteur reçoit un
         500, les unités sont parties, la commande n'existe pas.
ACTION   Séquence Postgres (order_number_seq), préfixe date conservé.
EVIDENCE Numéros réels observés : PDH-260826-05JN, PDH-260826-065Y
```

### Fuite d'internals Postgres dans les erreurs 500

```
CHECK    err instanceof Error ? err.message
RESULT   Renvoyait au navigateur les noms de tables, de colonnes et de
         contraintes ("duplicate key value violates unique constraint
         products_sku_idx").
ACTION   lib/apiError.ts — message générique côté client, objet d'erreur
         complet côté log. Appliqué à checkout, bulk, restock.
```

### `pool.connect()` hors du `try`

```
CHECK    Comportement avec PostgreSQL arrêté
RESULT   AVANT : le connect lui-même lève, hors du try → exception non gérée,
         Next répond un 500 au corps VIDE. Rien à afficher côté storefront,
         rien d'utile dans les logs.
ACTION   connect() déplacé dans le try, release() rendu optionnel.
TEST     docker stop postgres, puis appel des endpoints
RESULT   AVANT : 500 corps vide
         APRÈS : 500 {"error":"Une erreur est survenue. Réessayez dans un
         instant."} · log serveur : "Facettes catalogue indisponibles"
         + err.message "connect ECONNREFUSED 127.0.0.1:5433"
```

### Un teardown de test effaçait tout l'audit stock

**Préexistant. A coûté une longue traque.**

```
CHECK    tests/int/orderStatus.int.spec.ts:114
RESULT   DELETE FROM stock_movements WHERE reason LIKE '%Test Lifecycle%'
                                        OR reason LIKE '%PDH-%'
         Chaque caisse écrit reason = 'Commande PDH-...' : la seconde clause
         correspondait à TOUS les mouvements de stock d'origine commande de la
         base. Exécuté en parallèle, ce teardown supprimait les lignes d'audit
         des autres suites en plein test — et l'échec apparaissait dans une
         suite qui n'avait rien fait de mal.
ACTION   Scopé à son propre produit (product_id = $1).
         + vitest.config.mts : fileParallelism désactivé pour les tests
         d'intégration, qui partagent une base et un jeu de données uniques.
TEST     3 exécutions consécutives
RESULT   116/116 à chaque fois
```

### Push de schéma dev en conflit avec les migrations

`order_status_history` réutilise délibérément l'enum `enum_orders_status` ;
le push dev tente un `DROP TYPE` et échoue au démarrage. `push: false` ajouté —
ce dépôt possède son schéma via des migrations explicites, et un push actif
faisait dériver silencieusement la base de dev.

### Non corrigé, signalé

- Le pill « Nouveautés » du catalogue testait `badge.text === "Nouveau"`, ce qui
  ne correspondait jamais à rien (le preset s'affiche « Nouveauté »). Réécrit
  sur le *type* de badge — c'est le seul endroit où cette réécriture change un
  résultat, de « toujours vide » à « les produits réellement marqués ».
- 8 lignes `notifications` avec `status` et `channel` à NULL (qualité de
  données, origine antérieure à l'audit).
- La recherche catalogue reste sensible aux accents (« avene » ne trouve pas
  « Avène »). Comportement inchangé ; seule `/api/search/suggest` est
  insensible aux accents via `unaccent`. Uniformiser serait une amélioration.

---

## 📊 SCALABILITY

### Index — mesurés, pas devinés

Neuf index candidats écrits, **cinq supprimés** après mesure sur la base de
bench. Un index inutile est un coût d'écriture payé à chaque commande.

À 100 000 produits / 50 000 commandes (médiane de 7 exécutions) :

| Requête | Avant | Après | Gain |
|---|---|---|---|
| catalogue filtré catégorie + tri prix | 19,99 ms (Seq Scan) | 0,21 ms (Index Scan) | **x94** |
| commande par email client | 4,05 ms (Seq Scan) | 0,17 ms (Bitmap) | **x24** |
| unicité SKU variante (sans collision) | 0,85 ms (Seq Scan) | 0,12 ms (Index Only) | **x6,9** |
| comptage des facettes par catégorie | 37,73 ms | 24,16 ms (Index Only) | x1,6 |

Rejetés, avec le chiffre qui les a rejetés : `products_sellable_created_idx`
(x0,99), `products_category_idx` (redondant), `orders_status_idx` et
`orders_status_created_idx` (jamais choisis par le planificateur),
`api_request_logs_path_idx` (la vue monitoring ne filtre jamais sur path en SQL).

Rejouable : `node tests/load/explainBench.mjs 100000 50000`.

### Tests de charge

`node tests/load/loadTest.mjs --vus 100,500,1000 --seconds 8`

| VUs | Erreurs applicatives | 429 | Connexions Postgres crête |
|---|---|---|---|
| 100 | 0 % sur les 6 scénarios | 0 | 6 |
| 500 | 0 % — les échecs sont ECONNREFUSED/ECONNRESET | 0 | 6-7 |
| 1000 | idem | 0 | 6-7 |

**Lecture honnête.** À 500 et 1000 VUs le taux d'échec grimpe, mais la
ventilation par cause montre **ECONNREFUSED x986** et **ECONNRESET x7** —
zéro erreur HTTP, zéro 429. Le backlog de sockets du serveur *de développement*
sature ; l'application ne renvoie jamais d'erreur. Le générateur de charge, la
base et le serveur tournent sur la même machine : les latences absolues
(p50 800 ms à 100 VUs) sont pessimistes et le débit n'est pas transposable.

Le chiffre qui compte pour Vercel : **les connexions Postgres restent à 6-7
même à 1000 VUs**, exactement le plafond configuré (`PGPOOL_MAX=5`).

### Limites estimées

| Composant | Limite actuelle | Ce qui casse en premier |
|---|---|---|
| Catalogue | ~100 000 produits sans dégradation notable | Le tri « pertinence » (rating, reviews) n'a pas d'index dédié |
| Recherche prédictive | ~10 000 produits sur pg_trgm | Au-delà, un index de recherche dédié devient justifiable |
| Commandes | Le débit dépend des instances, pas de la base | Les connexions — d'où le pooler obligatoire |
| Uploads | 10 Mo/fichier, images raster uniquement | Cloudinary, pas Postgres |
| Import | ~200 lignes par requête, découpé par le navigateur | Onglet fermé = import à moitié appliqué (voir ci-dessous) |
| Jobs | 50 notifications par tick | Un tick/minute suffit largement au volume actuel |

---

## 🔐 SECURITY

### Corrigé

| Gravité | Problème |
|---|---|
| **Critique** | `orders.create` public — commandes forgées sans décrément de stock |
| **Critique** | `coupon-redemptions.create` public — registre d'audit falsifiable |
| **Critique** | `/api/import-products` : tout compte authentifié pouvait écraser le catalogue |
| **Élevée** | Login/upload/import cassés sur le domaine admin (proxy) |
| **Élevée** | `products.read` exposait **176 produits sur 250** non publiés ou archivés, plus `barcode` et `reservedStock` |
| **Élevée** | `?limit=0` renvoyait tout le catalogue ; `?depth=10` déclenchait des jointures profondes |
| **Élevée** | Aucun rate limiting applicatif |
| **Moyenne** | Uploads : aucune restriction MIME ni de taille (`upload: true`) |
| **Moyenne** | Proxy d'upload dashboard ouvert à tout compte authentifié |
| **Moyenne** | Aucun en-tête de sécurité (HSTS, nosniff, frame-ancestors, Referrer-Policy) |
| **Moyenne** | Messages d'erreur Postgres renvoyés au navigateur |
| **Faible** | Secret Payload vide accepté au démarrage |

Preuve de la restriction de lecture : `produits visibles : anonyme 74, staff 250`.

### Rate limiting

Postgres, fenêtre fixe, incrément atomique en une instruction
(`INSERT ... ON CONFLICT DO UPDATE ... RETURNING hits`).

```
TEST     tests/int/rateLimit.int.spec.ts + tests/unit/rateLimit.spec.ts
RESULT   rafale de 50 requêtes, limite 30 → exactement 30 passées, 20 bloquées
         table absente → 35/35 requêtes servies (fail-open)
```

Trois décisions à assumer explicitement :

1. **Le limiteur échoue OUVERT.** Un limiteur qui échoue fermé transforme un
   incident base en panne totale. Aucune protection réelle (contrôle d'accès,
   transaction de stock, recalcul des prix) n'en dépend.
2. **Seuils relevés pour le CGNAT.** Une grande part du trafic mobile au Maroc
   partage une IP. Des seuils calés sur « combien de commandes passe une
   personne » rejetteraient de vrais clients en pointe. 30 commandes/min par
   adresse : très au-dessus d'une personne, très en dessous d'un script.
3. **`/api/products/bulk` et `/api/inventory/restock` ne sont PAS limités.**
   Authentifiés, gatés par rôle, et utilisés en boucle par des gens qui font
   leur travail. La menace serait un compte staff compromis — qu'un rate limit
   n'adresse pas : le même compte fait les mêmes dégâts via l'admin, en plus
   lent. Ce qui le contient réellement est la séparation des rôles, la
   transaction, la garde optimiste `seenAt` et la piste d'audit.

Une propriété importante : `clientIp` renvoie **null** plutôt qu'un bucket
« unknown » partagé. Un bucket partagé paraît prudent et ne l'est pas — le jour
où l'en-tête Cloudflare manque, toutes les requêtes du monde tombent dans un
seul compteur et la boutique entière répond 429. La sûreté de ce choix repose
sur une propriété de déploiement, pas sur le code : **l'origine ne doit accepter
que le trafic Cloudflare** (voir 🚀).

### Vérifié bon, inchangé

| Contrôle | Preuve |
|---|---|
| Concurrence stock | `UPDATE ... WHERE stock >= $qty` dans une transaction, verrouillage ordonné par id |
| Mass assignment | `/api/products/bulk` n'accepte qu'une *instruction*, jamais une valeur finale |
| Prix côté serveur | `/api/checkout` ignore tout montant du corps de requête |
| Escalade de rôle | champ `roles` en `access.update: isAdmin` — testé, `['customer']` inchangé |
| Brute force | défauts Payload actifs : 5 tentatives, verrou 10 min, token 2 h |
| Cookies | httpOnly, sameSite lax, secure en production |
| Coupons | `read: staffOnlyInAdmin`, validation via route dédiée ne renvoyant qu'un montant |
| Idempotence notifications | index unique `(order_id, type, channel)` + ON CONFLICT |

### NOT TESTED

```
NOT TESTED   Cloudinary indisponible
REASON       Aucune clé Cloudinary configurée dans cet environnement ; le
             stockage retombe sur le disque local.
HOW TO TEST  Renseigner CLOUDINARY_*, puis bloquer api.cloudinary.com côté
             réseau et tenter un upload depuis /dashboard.

NOT TESTED   Resend réel (le drain a été prouvé contre un faux fournisseur
             HTTP local, pas contre l'API Resend)
REASON       RESEND_API_KEY est vide.
HOW TO TEST  Renseigner RESEND_API_KEY + EMAIL_FROM (domaine vérifié SPF/DKIM),
             passer une commande, puis POST /api/jobs/tick.

NOT TESTED   Comportement réel sous 1000 utilisateurs
REASON       Générateur de charge, base et serveur sur une seule machine, en
             mode développement. Le plafond atteint est celui des sockets de
             l'OS, pas celui de l'application.
HOW TO TEST  Rejouer loadTest.mjs depuis une machine distincte contre un build
             de production derrière le pooler.

NOT TESTED   npm audit
REASON       Non exécuté dans cette passe.
HOW TO TEST  `npm audit --omit=dev` dans backend/ et frontend/. Aucune montée
             de version majeure ne devrait être faite sans vérifier les
             breaking changes (Payload 3.87 et Next 16 sont couplés).
```

---

## 🚀 DEPLOYMENT

### Obligatoire avant la mise en ligne

1. **Pooler PostgreSQL en mode transaction.** `DATABASE_URI` doit pointer vers
   PgBouncer / Supabase `:6543` / Neon pooled. En serverless chaque instance
   tiède garde son propre pool ; sans pooler, quelques dizaines d'instances
   épuisent `max_connections` et tout le site répond 500 d'un coup. Le
   `BEGIN ... FOR UPDATE ... COMMIT` de la caisse tourne sur un seul client
   emprunté, donc le pooling transaction est sûr pour lui.
2. **`PGPOOL_MAX`** — défaut 5. Vérifié à 6-7 connexions crête sous 1000 VUs.
3. **Origine accessible uniquement depuis Cloudflare.** Règle de pare-feu ou
   Authenticated Origin Pulls. Sans elle, `cf-connecting-ip` peut manquer et
   le rate limiting devient contournable (voir 🔐).
4. **`JOBS_SECRET`** + un cron sur `/api/jobs/tick` (Vercel Cron, Cloudflare,
   ou curl). Sans lui : aucun email ne part et aucune rétention ne s'applique.
   Une minute d'intervalle convient.
   ```
   POST /api/jobs/tick
   Authorization: Bearer $JOBS_SECRET
   ```
5. **Email** — `RESEND_API_KEY` + `EMAIL_FROM` (domaine vérifié SPF/DKIM),
   `STOCK_ALERT_EMAIL` pour les alertes internes. Actuellement vides.
6. **`npx payload migrate`** — trois nouvelles migrations.

### Variables d'environnement

| Classe | Variables |
|---|---|
| **SECRET** | `PAYLOAD_SECRET` (≥32), `DATABASE_URI`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_SYNC_SECRET`, `REVALIDATE_SECRET`, `JOBS_SECRET` |
| **SERVER ONLY** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_FOLDER`, `EMAIL_FROM`, `STOCK_ALERT_EMAIL`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `PGPOOL_MAX`, `API_LOG_SAMPLE_RATE`, `SERVER_URL`, `FRONTEND_URL`, `ADMIN_URL`, `CMS_URL` |
| **PUBLIC** | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_PHONE`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |

Vérifié : **aucun secret n'est exposé derrière un préfixe `NEXT_PUBLIC_`**.
Les variables obligatoires font échouer le démarrage avec un message explicite.

### Base de données

À demander au fournisseur PostgreSQL, pas à construire : sauvegardes
automatiques, PITR, pooling, monitoring. Aucun système de sauvegarde maison
n'a été ajouté.

### Cloudflare — recommandé

- Cache : `/api/catalogue/facets` (120 s), `/api/search/suggest` (30 s),
  `/api/homepage/best-selling` (300 s) — en-têtes déjà posés par l'origine.
- Rate limiting volumétrique en amont sur `/api/checkout`, `/api/users/login`,
  `/api/orders/track`.
- Bot Fight Mode sur `/dashboard/login`.

---

## ✅ READY

- Concurrence stock : **100 acheteurs simultanés sur la dernière unité →
  1 × 200, 99 × 409, 0 autre**, stock final 0, 1 commande, 1 mouvement.
  Idem au niveau variante. Vérifié sur 3 exécutions.
- Idempotence caisse, sur rejeu séquentiel et sur rafale concurrente.
- Restauration de stock produit **et** variante à l'annulation, sans double
  crédit.
- Matrice de rôles vérifiée contre de vraies sessions HTTP (19 tests).
- Contrôle d'accès Payload sur les 18 collections et les 6 globals.
- Prix, remises et frais de port recalculés côté serveur.
- Rate limiting atomique, avec dégradation propre prouvée.
- Emails hors du chemin de requête, avec reprise et anti-poison.
- Erreurs génériques côté client, détaillées côté serveur.
- Rétention automatique sur les trois tables qui croissent avec le trafic.
- 116 tests d'intégration + 73 unitaires, déterministes.

## ⚠️ Reste à faire

- **Renseigner les variables email** — sans quoi aucun client ne reçoit rien.
- **L'import reste découpé par le navigateur.** Onglet fermé en cours d'import
  = import à moitié appliqué, sans trace ni reprise. Les tables `import_jobs` /
  `import_job_rows` prévues au plan n'ont pas été livrées dans cette passe :
  l'endpoint `/api/jobs/tick` qui les drainerait existe et est prouvé, la
  persistance du job reste à écrire.
- **Sentry** non branché. `lib/apiError.ts` centralise les erreurs serveur et
  constitue le point d'accroche naturel ; aucune dépendance ajoutée.
- **CSP complète** absente. Seul `frame-ancestors` est posé : le storefront
  rend des variables de couleur inline issues du CMS, une vraie CSP demande un
  pipeline de nonce dans le layout. Livrer une politique `unsafe-inline`
  ressemblerait à une protection sans en être une.
- **npm audit** non exécuté.
