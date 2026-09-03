import {
  SECTION_GROUP_LABELS,
  SECTION_GROUPS,
  SECTION_KEYS,
  SECTION_LABELS,
} from '../../../globals/Home'

/**
 * The homepage section catalogue: every key the builder can order, its French
 * label, and the library group it belongs to.
 *
 * This exists because none of it is reachable through the normal API. The
 * `sections` field on the Home global is an array of free-text keys, so
 * `/api/globals/home` returns only the sections *currently* in the order —
 * a section temporarily removed from the order would disappear from the
 * catalogue entirely — and it carries no labels or groups at all. Those three
 * tables are plain TypeScript constants in globals/Home.ts, invisible to
 * Payload's schema.
 *
 * Consumed by frontend/scripts/sync-cms.mjs, which used to hard-code the same
 * key union in its output template. That copy drifted: `featuredPromo` was
 * added here and the dashboard's own mirror in storefront-mapping.ts never
 * learned about it, so the builder listed it as a raw camelCase key.
 *
 * Public, like the Home global itself. Nothing here is confidential — these
 * are the names of the shop's own homepage sections.
 */
export async function GET() {
  return Response.json({
    keys: SECTION_KEYS,
    labels: SECTION_LABELS,
    groups: SECTION_GROUPS,
    groupLabels: SECTION_GROUP_LABELS,
  })
}
