import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'

// Real existing storefront routes that aren't a Category/Brand relationship
// (a quick-filter view of the catalogue, or a plain static page) — kept as a
// curated list so "collection"/"page" nav items still resolve to a route
// that actually exists, never a hardcoded path typed freely into a text
// field. Add to this list if a new static route should be nav-addressable.
export const NAV_COLLECTION_ROUTES = [
  { label: 'Catalogue complet', value: '/catalogue' },
  { label: 'Toutes les marques', value: '/marques' },
  { label: 'Coffrets & cadeaux', value: '/collections' },
  { label: 'Soldes', value: '/shop/soldes' },
  { label: 'Nouveautés', value: '/shop/nouveautes' },
] as const

export const NAV_PAGE_ROUTES = [
  { label: 'Accueil', value: '/' },
  { label: 'Services', value: '/services' },
  { label: 'Contact', value: '/contact' },
] as const

export const NAV_BADGE_COLORS = ['none', 'plum', 'teal', 'sale'] as const
export const NAV_LINK_TYPES = ['category', 'brand', 'collection', 'page', 'custom'] as const
export const MEGA_LINK_TYPES = ['category', 'brand', 'custom'] as const

const linkTypeFields = (linkTypes: readonly string[]) => [
  {
    name: 'type',
    type: 'select' as const,
    defaultValue: 'custom',
    options: [...linkTypes],
    required: true,
  },
  {
    name: 'category',
    type: 'relationship' as const,
    admin: { condition: (_: unknown, siblingData: { type?: string }) => siblingData?.type === 'category' },
    relationTo: 'categories' as const,
  },
  {
    name: 'brand',
    type: 'relationship' as const,
    admin: { condition: (_: unknown, siblingData: { type?: string }) => siblingData?.type === 'brand' },
    relationTo: 'brands' as const,
  },
  ...(linkTypes.includes('collection')
    ? [
        {
          name: 'collectionRoute',
          type: 'select' as const,
          admin: { condition: (_: unknown, siblingData: { type?: string }) => siblingData?.type === 'collection' },
          options: [...NAV_COLLECTION_ROUTES],
        },
      ]
    : []),
  ...(linkTypes.includes('page')
    ? [
        {
          name: 'pageRoute',
          type: 'select' as const,
          admin: { condition: (_: unknown, siblingData: { type?: string }) => siblingData?.type === 'page' },
          options: [...NAV_PAGE_ROUTES],
        },
      ]
    : []),
  {
    name: 'customUrl',
    type: 'text' as const,
    admin: {
      condition: (_: unknown, siblingData: { type?: string }) => siblingData?.type === 'custom',
      description: 'e.g. /marques',
    },
  },
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description:
      'Main navigation and every mega menu — shown on every page. Edited from the Storefront Builder\'s "Navigation" tab (/dashboard/storefront). Decoupled from the Categories collection on purpose: adding a category no longer auto-adds a nav entry — add it here once instead.',
  },
  versions: {
    drafts: {
      autosave: false,
    },
    max: 20,
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      admin: { description: 'Main navigation items, in display order — drag to reorder.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'visible', type: 'checkbox', defaultValue: true },
        ...linkTypeFields(NAV_LINK_TYPES),
        { name: 'badgeLabel', type: 'text', admin: { description: 'Optional small pill next to the label, e.g. "Nouveau".' } },
        { name: 'badgeColor', type: 'select', defaultValue: 'none', options: [...NAV_BADGE_COLORS] },
        { name: 'megaMenuEnabled', type: 'checkbox', defaultValue: false },
        {
          name: 'megaMenu',
          type: 'group',
          admin: { condition: (_, siblingData) => siblingData?.megaMenuEnabled === true },
          fields: [
            { name: 'subtitle', type: 'text' },
            {
              name: 'columns',
              type: 'array',
              maxRows: 5,
              fields: [
                { name: 'title', type: 'text', required: true },
                {
                  name: 'links',
                  type: 'array',
                  fields: [{ name: 'label', type: 'text', required: true }, ...linkTypeFields(MEGA_LINK_TYPES), { name: 'visible', type: 'checkbox', defaultValue: true }],
                },
              ],
            },
            {
              name: 'promo',
              type: 'group',
              admin: { description: 'Optional promotional tile shown beside the columns.' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'title', type: 'text' },
                { name: 'description', type: 'text' },
                { name: 'ctaLabel', type: 'text' },
                { name: 'ctaUrl', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
