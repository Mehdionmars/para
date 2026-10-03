/**
 * One-off: set a new password for a user and clear any login lock.
 * Run it on the machine that has the target database in its .env.
 *
 * Usage: RESET_EMAIL=you@example.com RESET_PASSWORD='new-password' npx tsx src/scripts/reset-password.ts
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

async function run() {
  const email = process.env.RESET_EMAIL
  const password = process.env.RESET_PASSWORD
  if (!email || !password || password.length < 8) {
    console.error('Set RESET_EMAIL and RESET_PASSWORD (8 characters minimum).')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'users', limit: 1, where: { email: { equals: email } } })
  if (!docs[0]) {
    payload.logger.error(`No user found with email ${email}`)
    process.exit(1)
  }
  await payload.update({ collection: 'users', id: docs[0].id, data: { password, loginAttempts: 0, lockUntil: null } })
  payload.logger.info(`Password reset for ${docs[0].email}`)
  process.exit(0)
}

run().catch((err) => {
  console.error('reset-password failed:', err)
  process.exit(1)
})
