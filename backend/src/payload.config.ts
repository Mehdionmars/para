import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import type { ImportBeforeHook } from '@payloadcms/plugin-import-export/types'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Brands } from './collections/Brands'
import { Categories } from './collections/Categories'
import { InstagramPosts } from './collections/InstagramPosts'
import { Inventory } from './collections/Inventory'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Services } from './collections/Services'
import { StockMovements } from './collections/StockMovements'
import { Stores } from './collections/Stores'
import { Suppliers } from './collections/Suppliers'
import { Users } from './collections/Users'
import { CataloguePage } from './globals/CataloguePage'
import { CollectionsPage } from './globals/CollectionsPage'
import { Home } from './globals/Home'
import { SiteChrome } from './globals/SiteChrome'
import { Theme } from './globals/Theme'
import { cloudinaryAdapter } from './lib/cloudinaryAdapter'
import { productsBeforeImport } from './lib/productImportHook'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
)

export default buildConfig({
  admin: {
    components: {
      afterNavLinks: ['/components/ImportProductsNavLink#ImportProductsNavLink'],
      graphics: {
        Icon: '/components/AdminLogo#AdminIcon',
        Logo: '/components/AdminLogo#AdminLogo',
      },
      views: {
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
  }),
  editor: lexicalEditor(),
  globals: [Home, CollectionsPage, CataloguePage, SiteChrome, Theme],
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
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
