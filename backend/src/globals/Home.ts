import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { CATEGORY_OPTIONS } from '../collections/Products'

export const RAIL_PRODUCT_SOURCES = ['manual', 'latest', 'featured', 'bestSelling', 'category'] as const
export const RAIL_SORT_ORDERS = ['newest', 'price-asc', 'price-desc', 'name-asc', 'rating-desc'] as const

const imageField = (name = 'image', required = true) =>
  ({
    name,
    type: 'upload',
    relationTo: 'media',
    required,
  }) as const

const colorField = (name: string, defaultValue: string) =>
  ({
    name,
    type: 'text',
    admin: { description: 'Hex color, e.g. #E7EFF3' },
    defaultValue,
  }) as const

export const Home: GlobalConfig = {
  slug: 'home',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description: 'Every editable block on the homepage, in the order it renders.',
  },
  fields: [
    {
      name: 'heroSlides',
      type: 'array',
      admin: { description: 'Slides shown in the top hero carousel.' },
      fields: [
        { name: 'tag', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'cta', type: 'text', required: true },
        {
          name: 'bg',
          type: 'text',
          admin: { description: 'CSS gradient/color used behind the slide, e.g. linear-gradient(120deg,#2f1f3d,#5E4074 60%,#4b3563)' },
        },
        imageField(),
      ],
    },
    {
      name: 'ctaPair1',
      type: 'array',
      admin: { description: 'Two-tile CTA banner right under the hero (exactly 2 tiles).' },
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'title', type: 'text', required: true },
        colorField('bg', '#EFE6F3'),
        imageField(),
      ],
    },
    {
      name: 'rails',
      type: 'array',
      admin: { description: 'Horizontal product rails ("Les essentiels de la saison", "Nouveautés", "Best sellers"...).' },
      fields: [
        {
          name: 'key',
          type: 'text',
          admin: { description: 'Stable identifier, e.g. "saison", "nouveautes".' },
          required: true,
        },
        { name: 'eyebrow', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
        {
          name: 'productSource',
          type: 'select',
          admin: {
            description:
              'Where this rail\'s products come from, resolved live against the database on every storefront request (not baked in at content-sync time).',
          },
          defaultValue: 'manual',
          options: [
            { label: 'Sélection manuelle', value: 'manual' },
            { label: 'Derniers ajouts', value: 'latest' },
            { label: 'Produits mis en avant (featured)', value: 'featured' },
            { label: 'Meilleures ventes', value: 'bestSelling' },
            { label: 'Par catégorie', value: 'category' },
          ],
          required: true,
        },
        {
          name: 'products',
          type: 'relationship',
          admin: {
            condition: (_, siblingData) => siblingData?.productSource === 'manual',
            description: 'Used when "Source" is set to Sélection manuelle.',
          },
          hasMany: true,
          relationTo: 'products',
        },
        {
          name: 'category',
          type: 'select',
          admin: {
            condition: (_, siblingData) => siblingData?.productSource === 'category',
            description: 'Used when "Source" is set to Par catégorie.',
          },
          options: [...CATEGORY_OPTIONS],
        },
        {
          name: 'brandFilter',
          type: 'relationship',
          admin: { description: 'Optional extra filter, combined with whichever source is selected above.' },
          relationTo: 'brands',
        },
        {
          name: 'limit',
          type: 'number',
          admin: { description: 'Maximum number of products to show in this rail.' },
          defaultValue: 8,
          max: 24,
          min: 1,
        },
        {
          name: 'sortOrder',
          type: 'select',
          admin: {
            condition: (_, siblingData) => !['manual', 'bestSelling'].includes(siblingData?.productSource),
            description:
              'Ignored for Sélection manuelle (keeps pick order) and Meilleures ventes (ranked by real order quantities, falling back to "Plus récents" until real sales exist).',
          },
          defaultValue: 'newest',
          options: [
            { label: 'Plus récents', value: 'newest' },
            { label: 'Prix croissant', value: 'price-asc' },
            { label: 'Prix décroissant', value: 'price-desc' },
            { label: 'Nom (A→Z)', value: 'name-asc' },
            { label: 'Mieux notés', value: 'rating-desc' },
          ],
        },
        {
          name: 'editorialImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'brandFeature',
          type: 'group',
          admin: { description: 'Shown instead of the editorial image when this rail highlights a brand.' },
          fields: [
            { name: 'name', type: 'text' },
            { name: 'desc', type: 'textarea' },
            colorField('bg', '#E7EFF3'),
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
            },
          ],
          label: 'Brand feature (optional)',
        },
      ],
    },
    {
      name: 'ctaPair2',
      type: 'array',
      admin: { description: 'Second two-tile CTA banner, further down the page (exactly 2 tiles).' },
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'title', type: 'text', required: true },
        colorField('bg', '#F2E9F2'),
        imageField(),
      ],
    },
    {
      name: 'dermoPicks',
      type: 'array',
      admin: { description: '"Conseil dermo" strip: an active ingredient + claim for a handful of products.' },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          admin: { description: 'Not required: deleting a featured product must not be blocked by this reference.' },
          relationTo: 'products',
        },
        { name: 'actif', type: 'text', required: true },
        { name: 'claim', type: 'text', required: true },
      ],
    },
    {
      name: 'campaignProducts',
      type: 'relationship',
      admin: { description: 'Products shown in the seasonal campaign block.' },
      hasMany: true,
      relationTo: 'products',
    },
    {
      name: 'coffrets',
      type: 'array',
      admin: { description: 'Gift box / gift card cards.' },
      fields: [
        { name: 'tag', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'price', type: 'number', min: 0, required: true },
        {
          name: 'priceFrom',
          type: 'checkbox',
          admin: { description: 'Show price as "à partir de" (from), e.g. for gift cards.' },
          defaultValue: false,
        },
        imageField(),
        { name: 'toast', type: 'text', admin: { description: 'Confirmation toast text shown after adding to cart.' } },
      ],
    },
    {
      name: 'instagram',
      type: 'group',
      admin: {
        description:
          'Copy and behavior around the homepage Instagram section. The posts themselves are NOT set here — they sync automatically from the @paradhiver account into the "Instagram Posts" collection.',
      },
      fields: [
        { name: 'show', type: 'checkbox', defaultValue: true },
        { name: 'title', type: 'text', defaultValue: 'Suivez-nous sur Instagram' },
        {
          name: 'subtitle',
          type: 'text',
          defaultValue: 'Routines, conseils de nos pharmaciens et coulisses de la parapharmacie.',
        },
        { name: 'username', type: 'text', defaultValue: 'paradhiver' },
        {
          name: 'postCount',
          type: 'number',
          admin: { description: 'How many posts to show. 6 fits one row on desktop.' },
          defaultValue: 6,
          max: 12,
          min: 2,
        },
        { name: 'ctaText', type: 'text', defaultValue: 'Nous suivre' },
        { name: 'ctaUrl', type: 'text', defaultValue: 'https://www.instagram.com/paradhiver/' },
      ],
    },
    {
      name: 'brands',
      type: 'relationship',
      admin: { description: 'Brand logos scrolling in the marquee, in display order.' },
      hasMany: true,
      relationTo: 'brands',
    },
    {
      name: 'trustBadges',
      type: 'array',
      admin: { description: 'Trust bar at the bottom of the page.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'text' },
        {
          name: 'icon',
          type: 'select',
          options: ['Truck', 'ShieldCheck', 'BadgeCheck', 'Headset'],
          required: true,
        },
      ],
    },
    {
      name: 'reviewBars',
      type: 'array',
      admin: { description: 'Star-rating distribution bars shown on product pages.' },
      fields: [
        { name: 'n', type: 'text', required: true },
        { name: 'pct', type: 'number', max: 100, min: 0, required: true },
      ],
    },
    {
      name: 'sampleReviews',
      type: 'array',
      admin: { description: 'Placeholder reviews shown on product pages until real reviews exist.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'date', type: 'text', required: true },
        { name: 'stars', type: 'number', max: 5, min: 1, required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    {
      name: 'freeShippingThreshold',
      type: 'number',
      defaultValue: 399,
      min: 0,
    },
  ],
}
