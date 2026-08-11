import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

const COMBINING_DIACRITICS = new RegExp('[̀-ͯ]', 'g')

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

async function run() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'brands', limit: 1000, where: { slug: { equals: null } } })
  payload.logger.info(`Backfilling slugs for ${docs.length} brand(s) without one...`)
  for (const brand of docs) {
    const slug = slugify(brand.name)
    try {
      await payload.update({ id: brand.id, collection: 'brands', data: { slug } })
      payload.logger.info(`  ${brand.name} -> ${slug}`)
    } catch (err) {
      // Duplicate slug means a pre-existing duplicate brand record (same
      // brand, different casing/accents, e.g. "AVENE" vs "Avène") — a real
      // data-quality issue to merge separately, not something to paper over
      // here. Leave it slug-less rather than crash the whole backfill.
      payload.logger.warn(`  ${brand.name} (id ${brand.id}): skipped, likely a duplicate of another brand — ${err instanceof Error ? err.message : err}`)
    }
  }
  payload.logger.info('Done.')
  process.exit(0)
}

run()
