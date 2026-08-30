import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import type { ImportBeforeHook } from '@payloadcms/plugin-import-export/types'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, type Config } from 'payload'
import { openapi, swaggerUI } from 'payload-oapi'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Brands } from './collections/Brands'
import { Categories } from './collections/Categories'
import { CouponRedemptions } from './collections/CouponRedemptions'
import { Coupons } from './collections/Coupons'
import { InstagramPosts } from './collections/InstagramPosts'
import { Inventory } from './collections/Inventory'
import { Media, MAX_UPLOAD_BYTES } from './collections/Media'
import { Notifications } from './collections/Notifications'
import { OrderStatusHistory } from './collections/OrderStatusHistory'
import { Orders } from './collections/Orders'
import { PushSubscriptions } from './collections/PushSubscriptions'
import { Products } from './collections/Products'
import { Services } from './collections/Services'
import { ShippingRules } from './collections/ShippingRules'
import { StockMovements } from './collections/StockMovements'
import { Stores } from './collections/Stores'
import { Suppliers } from './collections/Suppliers'
import { Users } from './collections/Users'

import { CataloguePage } from './globals/CataloguePage'
import { CollectionsPage } from './globals/CollectionsPage'
import { Home } from './globals/Home'
import { Navigation } from './globals/Navigation'
import { PaymentSettings } from './globals/PaymentSettings'
import { SiteChrome } from './globals/SiteChrome'
import { Theme } from './globals/Theme'

import { cloudinaryAdapter } from './lib/cloudinaryAdapter'
import { env } from './lib/env'
import { productsBeforeImport } from './lib/productImportHook'
import { migrations } from './migrations'
import { apiMonitoringPlugin } from './plugins/apiMonitoringPlugin'
import { publicQueryGuard } from './plugins/publicQueryGuard'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const SERVER_URL =
  process.env.SERVER_URL || 'http://localhost:3001'

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:3000'

const ADMIN_URL =
  process.env.ADMIN_URL || 'http://localhost:3000'

// Validated as a group in lib/env.ts, so "two of the three keys are set" is
// a boot error rather than a broken upload discovered in production.
const cloudinaryConfigured = env.cloudinaryConfigured

// Payload needs to accept requests from:
//
// - Storefront: paradhiver.ma
// - Dashboard: admin.paradhiver.ma
// - Backend itself: api.paradhiver.ma
//
// The localhost pair is development-only. This same list backs `csrf`, and a
// production origin list that trusts http://localhost means a page served
// from a developer's (or an attacker's) local server is a permitted origin
// against the live API — so it is added only outside production, where the
// three URLs above come from the environment anyway.

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const corsOrigins = [
  FRONTEND_URL,
  ADMIN_URL,
  SERVER_URL,
  ...(IS_PRODUCTION ? [] : ['http://localhost:3000', 'http://localhost:3001']),
].filter(
  (origin, index, array) =>
    origin && array.indexOf(origin) === index,
)

export default buildConfig({

  admin: {
    components: {
      afterNavLinks: [
        '/components/ImportProductsNavLink#ImportProductsNavLink',
        '/components/ApiMonitoringNavLink#ApiMonitoringNavLink',
      ],

      graphics: {
        Icon: '/components/AdminLogo#AdminIcon',
        Logo: '/components/AdminLogo#AdminLogo',
      },

      views: {
        apiMonitoring: {
          Component:
            '/components/ApiMonitoringView#ApiMonitoringView',

          meta: {
            title: 'Monitoring API',
          },

          path: '/api-monitoring',
        },

        importProducts: {
          Component:
            '/components/ImportProductsView#ImportProductsView',

          meta: {
            title: 'Import produits',
          },

          path: '/import-products',
        },
      },
    },

    meta: {
      titleSuffix: "— Para d'Hiver",
    },

    user: Users.slug,

    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Users,
    Media,
    Brands,
    Categories,
    Products,
    Services,
    Stores,
    Orders,
    Suppliers,
    Inventory,
    StockMovements,
    InstagramPosts,
    Coupons,
    CouponRedemptions,
    ShippingRules,
    OrderStatusHistory,
    Notifications,
    PushSubscriptions,
  ],

  cors: corsOrigins,

  csrf: corsOrigins,

  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,

      // Serverless sizing. Every warm lambda holds its own pool, so the
      // driver default of 10 is 10 *per instance*: a few dozen concurrent
      // instances exhaust a standard Postgres `max_connections` on their own,
      // and the failure mode is the whole site 500ing at once.
      //
      // Keep this small and put a transaction-mode pooler (PgBouncer,
      // Supabase :6543, Neon pooled) in front — see PRODUCTION-READINESS.md.
      // The checkout's `BEGIN ... FOR UPDATE ... COMMIT` runs on a single
      // checked-out client, so transaction pooling is safe for it.
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      max: env.PGPOOL_MAX,
    },

    prodMigrations: migrations,

    // This repo owns its schema through the hand-written migrations in
    // src/migrations. Dev push diffs the config against the database and
    // "fixes" the difference, which here means trying to
    // `DROP TYPE enum_orders_status` — a type order_status_history
    // deliberately shares with orders, which no config-derived schema can
    // express. Push therefore fails on boot, and when it does not fail it
    // silently walks the dev database away from what the migrations produce.
    // Migrations are the single source of truth; push is off.
    //
    // The one deliberate exception is PAYLOAD_DB_PUSH=1, which is a *tool*,
    // not a mode: point DATABASE_URI at a scratch database, let Payload build
    // the schema its config implies, and diff that against the real one to
    // find drift. Never set it against a database anyone depends on.
    push: process.env.PAYLOAD_DB_PUSH === '1',
  }),

  editor: lexicalEditor(),

  globals: [
    Home,
    PaymentSettings,
    CollectionsPage,
    CataloguePage,
    SiteChrome,
    Theme,
    Navigation,
  ],

  plugins: [

    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryConfigured
            ? cloudinaryAdapter({
                apiKey:
                  process.env.CLOUDINARY_API_KEY!,
                apiSecret:
                  process.env.CLOUDINARY_API_SECRET!,
                cloudName:
                  process.env.CLOUDINARY_CLOUD_NAME!,
                folder:
                  process.env.CLOUDINARY_FOLDER ||
                  'para-dhiver',
              })
            : null,

          disablePayloadAccessControl: true,
        },
      },

      enabled: cloudinaryConfigured,
    }),

    importExportPlugin({
      collections: [
        {
          slug: 'products',

          import: {
            hooks: {
              before:
                productsBeforeImport as unknown as ImportBeforeHook,
            },
          },
        },

        {
          slug: 'services',
        },

        {
          slug: 'brands',
        },

        {
          slug: 'categories',
        },

        {
          slug: 'stores',
        },
      ],
    }),

    // PUBLIC QUERY GUARD
    //
    // Caps `limit`/`depth` for anonymous REST/GraphQL reads. Before the
    // monitoring plugin so a clamped query is what gets logged.

    publicQueryGuard,

    apiMonitoringPlugin,

    // OPENAPI / SWAGGER — development only
    //
    // Both plugins default to `enabled: true`, and neither endpoint they add
    // carries any access control:
    //
    //   GET  /api/docs           Swagger UI
    //   GET  /api/openapi.json   the full schema of every collection
    //   POST /api/openapi-auth   an OAuth password-flow handler that calls
    //                            payload.login() and returns an admin JWT
    //
    // The last one matters most: it is a second, undocumented login surface
    // on the admin collection, outside the per-route limits in lib/rateLimit
    // (those are applied by withApiLog, which wraps this app's own routes,
    // not plugin endpoints). The schema dump is a lesser but real disclosure.
    //
    // None of it is needed by the storefront or the dashboard — both call
    // known endpoints — so it is kept for local development and switched off
    // in production, which removes all three endpoints rather than trying to
    // protect them.

    openapi({
      enabled: !IS_PRODUCTION,

      metadata: {
        title: "Para d'Hiver API",
        version: '1.0.0',
      },

      openapiVersion: '3.1',
    }),

    swaggerUI({ enabled: !IS_PRODUCTION }),
  ],

  // Validated at import time — an empty secret still signs and verifies
  // JWTs, so `|| ''` used to mean "boot fine, issue forgeable tokens".
  secret: env.PAYLOAD_SECRET,

  sharp,

  //
  // Payload has no per-collection byte ceiling — `UploadConfig` only carries
  // `mimeTypes` — so the limit is set here, where the options are spread
  // straight into Busboy
  // (`uploads/fetchAPI-multipart/processMultipart.js:36-39`).
  //
  // `abortOnLimit` matters: without it an oversized upload is silently
  // *truncated* and stored as a corrupt image rather than refused.

  upload: {
    abortOnLimit: true,
    limits: { fileSize: MAX_UPLOAD_BYTES },
    responseOnLimit: 'Fichier trop volumineux (limite 10 Mo).',
  } as Config['upload'],

  typescript: {
    outputFile:
      path.resolve(dirname, 'payload-types.ts'),
  },
})