import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { CATEGORY_OPTIONS } from '../collections/Products'

export const NEED_ICON_OPTIONS = ['Droplets', 'Sparkles', 'Star', 'ListChecks'] as const

export const CataloguePage: GlobalConfig = {
  slug: 'catalogue-page',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description: 'Filter pills, editorial blocks and SEO content on the /catalogue page.',
  },
  fields: [
    {
      name: 'quickFilters',
      type: 'array',
      admin: { description: 'Pills at the top of the catalogue, e.g. "Nouveautés", "Coffrets".' },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'tagToCategory',
      type: 'array',
      admin: {
        description:
          'Maps a "besoin" tag (shown as a clickable chip) to the product category it filters by. Leave category empty for a purely illustrative tag.',
      },
      fields: [
        { name: 'tag', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          options: [...CATEGORY_OPTIONS],
        },
      ],
    },
    {
      name: 'brands',
      type: 'relationship',
      admin: { description: 'Brands offered as a filter on the catalogue page.' },
      hasMany: true,
      relationTo: 'brands',
    },
    {
      name: 'featuredTile',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'sub', type: 'text' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'editorialTiles',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'text' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'needs',
      type: 'array',
      admin: { description: '"Besoin d\'un conseil ?" cards.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'text' },
        {
          name: 'icon',
          type: 'select',
          options: [...NEED_ICON_OPTIONS],
          required: true,
        },
      ],
    },
    {
      name: 'guide',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'textarea' },
        { name: 'cta', type: 'text' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'seoIntro',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'title', type: 'text' },
        {
          name: 'paragraphs',
          type: 'array',
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
      ],
    },
  ],
}
