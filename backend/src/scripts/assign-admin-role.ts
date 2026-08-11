/**
 * One-off: grant the real staff account the "admin" role now that Users has
 * a `roles` field. Existing users predate the field (defaultValue is
 * ["customer"]), so this needs to run once after the schema change.
 *
 * Usage: npx tsx src/scripts/assign-admin-role.ts
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

const ADMIN_EMAIL = 'paradhiver@gmail.com'

async function run() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'users', limit: 1, where: { email: { equals: ADMIN_EMAIL } } })
  if (!docs[0]) {
    payload.logger.error(`No user found with email ${ADMIN_EMAIL}`)
    process.exit(1)
  }
  await payload.update({ collection: 'users', id: docs[0].id, data: { roles: ['admin'] } })
  payload.logger.info(`Assigned "admin" role to ${docs[0].email}`)
  process.exit(0)
}

run().catch((err) => {
  console.error('assign-admin-role failed:', err)
  process.exit(1)
})
