/**
 * One-time migration — reproduces today's live nav bar + mega menus (derived
 * until now from the Categories tree at sync-cms time) inside the new
 * "navigation" global, so publishing this feature doesn't blank the real
 * menu. Mirrors frontend/scripts/sync-cms.mjs's syncNav() tree-walk exactly,
 * but resolves the "Marques" mega-menu column to real Brand relationships
 * instead of syncNav's fuzzy name-matching.
 *
 * Usage: npx tsx src/scripts/seed-navigation.ts
 * Safe to re-run: it replaces the whole `items` array each time.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

const BRANDS_TOP_LEVEL_NAME = 'Marques'

const normalizeName = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

async function main() {
  const payload = await getPayload({ config })

  const { docs: categories } = await payload.find({ collection: 'categories', limit: 500, depth: 0 })
  const { docs: brands } = await payload.find({ collection: 'brands', limit: 500, depth: 0 })

  const byId = new Map(categories.filter((c: any) => c.isActive).map((c: any) => [c.id, c]))
  const parentIdOf = (c: any) => (typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent ?? null)
  const childrenOf = (parentId: number | null) =>
    [...byId.values()].filter((c: any) => parentIdOf(c) === parentId).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

  const brandIdByName = new Map(brands.map((b: any) => [normalizeName(b.name), b.id]))

  const topLevel = childrenOf(null)

  const items: Record<string, unknown>[] = topLevel.map((top: any) => {
    const isBrandsColumn = top.name === BRANDS_TOP_LEVEL_NAME
    const columns = childrenOf(top.id).map((column: any) => ({
      title: column.name,
      links: childrenOf(column.id).map((item: any) => {
        if (isBrandsColumn) {
          const brandId = brandIdByName.get(normalizeName(item.name))
          return brandId ? { label: item.name, type: 'brand', brand: brandId, visible: true } : { label: item.name, type: 'custom', customUrl: '/marques', visible: true }
        }
        return { label: item.name, type: 'category', category: top.id, visible: true }
      }),
    }))

    const base = {
      label: top.name,
      visible: true,
      badgeColor: 'none' as const,
      megaMenuEnabled: columns.length > 0,
      megaMenu: columns.length > 0 ? { columns } : undefined,
    }

    if (isBrandsColumn) return { ...base, type: 'collection', collectionRoute: '/marques' }
    return { ...base, type: 'category', category: top.id }
  })

  // "Services" is a plain top-level link, intentionally outside the
  // Categories taxonomy — matches syncNav()'s current special-case exactly.
  items.push({ label: 'Services', visible: true, type: 'page', pageRoute: '/services', badgeColor: 'none', megaMenuEnabled: false })

  await payload.updateGlobal({
    slug: 'navigation',
    data: { items, _status: 'published' },
    draft: false,
  })

  console.log(`Seeded navigation global with ${items.length} top-level items (matching the live menu).`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
