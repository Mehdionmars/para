import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import type { ImportBeforeHook } from '@payloadcms/plugin-import-export/types'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { openapi, swaggerUI } from 'payload-oapi'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Brands } from './collections/Brands'
import { Categories } from './collections/Categories'
import { CouponRedemptions } from './collections/CouponRedemptions'
import { Coupons } from './collections/Coupons'
import { InstagramPosts } from './collections/InstagramPosts'
import { Inventory } from './collections/Inventory'
import { Media } from './collections/Media'
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
import { SiteChrome } from './globals/SiteChrome'
import { Theme } from './globals/Theme'
import { cloudinaryAdapter } from './lib/cloudinaryAdapter'
import { productsBeforeImport } from './lib/productImportHook'
import { migrations } from './migrations'
import { apiMonitoringPlugin } from './plugins/apiMonitoringPlugin'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
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
          Component: '/components/ApiMonitoringView#ApiMonitoringView',
          meta: { title: 'Monitoring API' },
          path: '/api-monitoring',
        },
        importProducts: {
          Component: '/components/ImportProductsView#ImportProductsView',
          meta: { title: 'Import produits' },
          path: '/import-products',
        },
      },
    },
    meta: {
      titleSuffix: '— Para d\'Hiver',
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
  // Includes the backend's own origin (not just the frontend's) — custom
  // admin views like /admin/import-products call this app's own /api routes
  // from inside the browser, and those same-origin POSTs still carry an
  // Origin header that Payload checks against this allowlist.
  cors: [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.SERVER_URL || 'http://localhost:3001'],
  csrf: [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.SERVER_URL || 'http://localhost:3001'],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Payload's dev-only schema `push` is hard-disabled whenever
    // NODE_ENV=production (see @payloadcms/db-postgres's connect.js), so the
    // containerized backend needs real migrations instead — `prodMigrations`
    // makes Payload run any pending ones automatically on boot, against a
    // fresh Postgres (empty `docker compose up` volume) with no manual
    // `payload migrate` step.
    prodMigrations: migrations,
  }),
  editor: lexicalEditor(),
  globals: [Home, CollectionsPage, CataloguePage, SiteChrome, Theme, Navigation],
  plugins: [
    // Falls back to Payload's default local-disk storage when Cloudinary env
    // vars aren't set yet, so `npm run dev` still works before the client
    // hands over real Cloudinary credentials.
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryConfigured
            ? cloudinaryAdapter({
                apiKey: process.env.CLOUDINARY_API_KEY!,
                apiSecret: process.env.CLOUDINARY_API_SECRET!,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
                folder: process.env.CLOUDINARY_FOLDER || 'para-dhiver',
              })
            : null,
          disablePayloadAccessControl: true,
        },
      },
      enabled: cloudinaryConfigured,
    }),
    // Adds an Import/Export button to each configured collection's admin
    // list view. Products gets a normalization hook so real supplier
    // spreadsheets (varying column names, French headers, per-sheet brands)
    // don't need to be hand-reformatted before upload. Pick "Upsert" +
    // match field "barcode" in the import UI to update existing products by
    // EAN instead of creating duplicates.
    importExportPlugin({
      collections: [
        {
          slug: 'products',
          import: {
            // The plugin's collections array widens TSlug to the full
            // CollectionSlug union across all entries, so a hook written
            // against the concrete Products shape needs this cast.
            hooks: { before: productsBeforeImport as unknown as ImportBeforeHook },
          },
        },
        { slug: 'services' },
        { slug: 'brands' },
        { slug: 'categories' },
        { slug: 'stores' },
      ],
    }),
    // Adds the `api-request-logs` collection and logs every collection/
    // global operation into it — powers the "Monitoring API" admin view.
    // Runs before the OpenAPI plugin so that collection is documented too.
    apiMonitoringPlugin,
    // OpenAPI spec at /api/openapi.json + a Swagger UI at /api/docs for the
    // Payload REST API — no separate container needed.
    openapi({ metadata: { title: "Para d'Hiver API", version: '1.0.0' }, openapiVersion: '3.1' }),
    swaggerUI({}),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
