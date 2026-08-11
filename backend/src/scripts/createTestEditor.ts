import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

async function run() {
  const payload = await getPayload({ config })
  const existing = await payload.find({ collection: 'users', where: { email: { equals: 'qa-storefront@paradhiver.local' } } })
  if (existing.docs.length > 0) {
    payload.logger.info('Test editor already exists.')
    return
  }
  await payload.create({
    collection: 'users',
    data: { email: 'qa-storefront@paradhiver.local', password: 'Test-Storefront-2026!', roles: ['admin'] },
  })
  payload.logger.info('Created qa-storefront@paradhiver.local')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
