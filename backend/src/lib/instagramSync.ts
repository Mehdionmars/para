import type { Payload } from 'payload'

const GRAPH_API_VERSION = 'v19.0'

type InstagramMediaNode = {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
  username?: string
}

export type InstagramSyncResult = {
  created: number
  updated: number
  unpublished: number
  error?: string
}

/**
 * Pulls the latest posts from the @paradhiver Instagram account (Meta's
 * Instagram Graph API — INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_BUSINESS_ACCOUNT_ID
 * are server-only env vars, never read by any frontend/client code) and
 * upserts them into the `instagram-posts` collection by `instagramId`.
 *
 * On any failure (missing config, network error, non-OK response) this logs
 * and returns early WITHOUT touching existing posts — the storefront keeps
 * showing whatever was last synced successfully rather than going empty.
 */
export async function syncInstagramPosts(payload: Payload): Promise<InstagramSyncResult> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  if (!accessToken || !businessAccountId) {
    const error = 'INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID is not configured'
    payload.logger.error(`[instagram-sync] ${error}`)
    return { created: 0, error, unpublished: 0, updated: 0 }
  }

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username'
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${businessAccountId}/media?fields=${fields}&limit=25&access_token=${accessToken}`

  let nodes: InstagramMediaNode[]
  try {
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      const error = `Instagram Graph API returned ${res.status}: ${body.slice(0, 300)}`
      payload.logger.error(`[instagram-sync] ${error}`)
      return { created: 0, error, unpublished: 0, updated: 0 }
    }
    const json = (await res.json()) as { data?: InstagramMediaNode[] }
    nodes = json.data || []
  } catch (err) {
    const error = `Failed to reach Instagram Graph API: ${err instanceof Error ? err.message : String(err)}`
    payload.logger.error(`[instagram-sync] ${error}`)
    return { created: 0, error, unpublished: 0, updated: 0 }
  }

  let created = 0
  let updated = 0
  const seenIds: string[] = []

  for (const node of nodes) {
    // Carousel albums frequently omit media_url on the parent node (the
    // real images live on the /children edge) — fall back to the thumbnail
    // rather than fetching each child individually, and skip only if
    // neither is present.
    const imageUrl = node.media_url || node.thumbnail_url
    if (!imageUrl) {
      payload.logger.warn(`[instagram-sync] skipping post ${node.id}: no media_url or thumbnail_url`)
      continue
    }

    seenIds.push(node.id)

    const existing = await payload.find({
      collection: 'instagram-posts',
      limit: 1,
      where: { instagramId: { equals: node.id } },
    })

    const data = {
      caption: node.caption || '',
      imageUrl,
      mediaType: node.media_type,
      permalink: node.permalink,
      thumbnailUrl: node.thumbnail_url || '',
      timestamp: node.timestamp,
      username: node.username || 'paradhiver',
    }

    if (existing.docs.length > 0) {
      // Deliberately does NOT touch sortOrder or isPublished — those are
      // editorial overrides (pin order / manually hide a still-live post)
      // that must survive every re-sync.
      await payload.update({
        id: existing.docs[0].id,
        collection: 'instagram-posts',
        data,
      })
      updated += 1
    } else {
      await payload.create({
        collection: 'instagram-posts',
        data: { ...data, instagramId: node.id, isPublished: true, sortOrder: 0 },
      })
      created += 1
    }
  }

  // Anything previously synced but absent from this batch was deleted on
  // Instagram — unpublish rather than hard-delete, so a manual restore
  // (or investigating what used to be there) stays possible.
  let unpublished = 0
  if (seenIds.length > 0) {
    const stale = await payload.find({
      collection: 'instagram-posts',
      limit: 500,
      where: {
        and: [{ instagramId: { not_in: seenIds } }, { isPublished: { equals: true } }],
      },
    })
    for (const doc of stale.docs) {
      await payload.update({ id: doc.id, collection: 'instagram-posts', data: { isPublished: false } })
      unpublished += 1
    }
  }

  payload.logger.info(`[instagram-sync] created=${created} updated=${updated} unpublished=${unpublished}`)
  return { created, unpublished, updated }
}
