/**
 * Creates (or recreates) a throwaway admin used by the Playwright dashboard
 * tests, and prints the newest order id. Deleted again by `--cleanup`.
 *
 * Usage: NODE_ENV=production npx tsx src/scripts/e2e-user.ts [--cleanup]
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

const EMAIL = 'e2e-order-view@paradhiver.test'
const PASSWORD = 'E2eOrder!2026'

const payload = await getPayload({ config })

await payload.delete({ collection: 'users', where: { email: { equals: EMAIL } } }).catch(() => {})

if (!process.argv.includes('--cleanup')) {
  await payload.create({
    collection: 'users',
    data: { email: EMAIL, password: PASSWORD, roles: ['admin'] },
    overrideAccess: true,
  })
  const orders = await payload.find({ collection: 'orders', limit: 1, overrideAccess: true, sort: '-createdAt' })
  console.log(orders.docs[0]?.id ?? '')
}

process.exit(0)
