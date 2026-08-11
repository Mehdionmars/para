import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'

export const MEDIA_TYPE_OPTIONS = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'] as const

export const InstagramPosts: CollectionConfig = {
  slug: 'instagram-posts',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    // Public: the storefront reads published posts directly, same pattern
    // as Products — the query itself filters `isPublished: true`, this
    // collection-level access just doesn't gate reads behind a session.
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['caption', 'mediaType', 'timestamp', 'isPublished', 'sortOrder'],
    description:
      'Synced automatically from the @paradhiver Instagram account (see the /instagram-posts/sync endpoint). Editors may adjust "sortOrder" or "isPublished" to override; every other field is overwritten on the next sync.',
    useAsTitle: 'caption',
  },
  fields: [
    {
      name: 'instagramId',
      type: 'text',
      // Dedup key for the sync job — one Payload doc per real Instagram post.
      index: true,
      required: true,
      unique: true,
    },
    { name: 'permalink', type: 'text', required: true },
    { name: 'imageUrl', type: 'text', required: true },
    { name: 'thumbnailUrl', type: 'text' },
    { name: 'caption', type: 'textarea' },
    {
      name: 'mediaType',
      type: 'select',
      options: [...MEDIA_TYPE_OPTIONS],
      required: true,
    },
    { name: 'timestamp', type: 'date', required: true },
    { name: 'username', type: 'text', defaultValue: 'paradhiver' },
    {
      name: 'isPublished',
      type: 'checkbox',
      admin: {
        description:
          'Set automatically: true when synced from Instagram, false when the sync no longer finds this post there (deleted on Instagram). Uncheck manually to hide a post from the storefront without deleting it.',
      },
      defaultValue: true,
      index: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        description:
          'Lower shows first. Left at 0 for every post, the storefront falls back to newest-first — set a lower value on specific posts to pin them earlier. Never touched by the sync job once a post exists.',
      },
      defaultValue: 0,
    },
  ],
  labels: { plural: 'Instagram Posts', singular: 'Instagram Post' },
}
