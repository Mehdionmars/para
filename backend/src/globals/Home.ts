import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { CATEGORY_OPTIONS } from '../collections/Products'
import { revalidateStorefront } from '../lib/revalidateStorefront'

export const RAIL_PRODUCT_SOURCES = ['manual', 'latest', 'featured', 'bestSelling', 'category', 'brand', 'promotion'] as const
export const RAIL_SORT_ORDERS = ['newest', 'price-asc', 'price-desc', 'name-asc', 'rating-desc'] as const

/** Every fixed homepage section slot the storefront builder can reorder/hide.
 * These map 1:1 to the components rendered in frontend/app/(site)/page.tsx.
 * Most are singletons (one instance), but each entry in `rails` is ALSO its
 * own independently orderable/hideable section — addressed in `sections[]`
 * as the dynamic key `rail:<railKey>` rather than one shared "rails" slot,
 * so "Les nouveautés", "Les meilleures ventes" etc. can each move/hide on
 * their own instead of living together inside one tabbed block. Because of
 * that, `sections.key` is a free-form string field, not a closed enum. */
export const SUMMER_EDIT_THEMES = ['cream', 'plum'] as const
export const SUMMER_EDIT_HIGHLIGHT_ICONS = ['Sun', 'Droplet', 'Leaf', 'Sparkles', 'ShieldCheck'] as const

export const SECTION_KEYS = [
  'hero',
  'marketingBanner',
  'ctaPair1',
  'summerEdit',
  'promotionsGrid',
  'featuredPromo',
  'services',
  'coffrets',
  'campaign',
  'imageCarousel',
  'dermoCorner',
  'brandsFeatured',
  'brandsMarquee',
  'ctaPair2',
  'ctaBanner',
  'instagram',
  'newsletter',
  'trustBar',
] as const

export const SECTION_LABELS: Record<(typeof SECTION_KEYS)[number], string> = {
  hero: 'Bannière hero',
  marketingBanner: 'Bannière marketing (saisonnière)',
  ctaPair1: 'CTA — paire d’images (haut)',
  summerEdit: 'Summer Edit',
  promotionsGrid: 'Grille promotions',
  featuredPromo: 'Sélection + bannière promo',
  services: 'Nos services',
  coffrets: 'Coffrets / cartes cadeaux',
  campaign: 'Nos coups de cœur',
  imageCarousel: 'Image + carrousel produits',
  dermoCorner: 'Conseil dermo',
  brandsFeatured: 'Marques à l’honneur',
  brandsMarquee: 'Marques (défilement)',
  ctaPair2: 'CTA — paire d’images (bas)',
  ctaBanner: 'CTA centré',
  instagram: 'Instagram',
  newsletter: 'Newsletter',
  trustBar: 'Barre de confiance',
}

/** Which builder group each fixed section belongs to, for the "+ Ajouter un
 * bloc" library grouping in the dashboard sidebar (Content/Products/Brands/
 * Services/Marketing) — display-only, does not affect Home's schema. */
export const SECTION_GROUPS = {
  hero: 'content',
  marketingBanner: 'content',
  ctaPair1: 'content',
  ctaPair2: 'content',
  ctaBanner: 'content',
  summerEdit: 'products',
  promotionsGrid: 'products',
  featuredPromo: 'products',
  campaign: 'products',
  imageCarousel: 'products',
  dermoCorner: 'products',
  brandsFeatured: 'brands',
  brandsMarquee: 'brands',
  services: 'services',
  coffrets: 'marketing',
  instagram: 'marketing',
  newsletter: 'marketing',
  trustBar: 'marketing',
} as const satisfies Record<(typeof SECTION_KEYS)[number], string>

export const SECTION_GROUP_LABELS: Record<string, string> = {
  content: 'Contenu',
  products: 'Produits',
  brands: 'Marques',
  services: 'Services',
  marketing: 'Marketing',
}

export const SERVICE_ICONS = ['ScanLine', 'Truck', 'MessageCircleQuestion', 'LifeBuoy', 'ShieldCheck', 'BadgeCheck', 'Headset', 'Sparkles', 'Heart', 'Gift'] as const

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

// Shared by marketingBanners' eyebrow/title/description fields — hidden
// when the campaign's image already has its own text baked in.
// The editorial copy fields only mean anything once the rail has an image to
// put them on, so they stay hidden until one is chosen.
const showWhenEditorialImage = (_: unknown, siblingData: { editorialImage?: unknown }) => !!siblingData?.editorialImage

const showWhenOverlayImage = (_: unknown, siblingData: { imageMode?: string }) => siblingData?.imageMode !== 'imageOnly'

export const Home: GlobalConfig = {
  slug: 'home',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description: 'Every editable block on the homepage, in the order it renders.',
  },
  versions: {
    drafts: {
      autosave: false,
    },
    max: 20,
  },
  hooks: {
    // Closes the same loop Navigation and SiteChrome already close: the
    // storefront caches the published home by tag, so without this a save in
    // the Storefront Builder sat behind the one-hour expiry. Failures are
    // logged, never thrown — see revalidateStorefront.
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['home'])
      },
    ],
    // Existing saved documents never retroactively gain new SECTION_KEYS
    // entries in their `sections` array — a key added to the schema after a
    // site already has content would silently never render (and never show
    // up in the builder) until someone happened to re-save. Backfilling on
    // every read means a newly added section key (like `imageCarousel`)
    // appears immediately, with no manual migration, inserted right after
    // its nearest present canonical neighbour so the order stays sensible.
    afterRead: [
      ({ doc }) => {
        const existing: { key: string; visible?: boolean }[] = doc.sections || []
        const existingKeys = new Set(existing.map((s) => s.key))
        const missing = SECTION_KEYS.filter((key) => !existingKeys.has(key))
        if (missing.length === 0) return doc

        const sections = [...existing]
        for (const key of missing) {
          const canonicalIndex = SECTION_KEYS.indexOf(key)
          let insertAt = sections.length
          for (let i = canonicalIndex - 1; i >= 0; i--) {
            const idx = sections.findIndex((s) => s.key === SECTION_KEYS[i])
            if (idx !== -1) {
              insertAt = idx + 1
              break
            }
          }
          sections.splice(insertAt, 0, { key, visible: true })
        }
        return { ...doc, sections }
      },
    ],
  },
  fields: [
    {
      name: 'sections',
      type: 'array',
      admin: {
        description:
          'Render order and visibility of each homepage section. Edited from the Storefront Builder (/dashboard/storefront) — reordering this array reorders the homepage. Either one of the fixed section keys, or "rail:<railKey>" addressing one specific entry in `rails` below (each rail is independently orderable, not grouped under a single "rails" slot).',
      },
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'heroSlides',
      type: 'array',
      admin: { description: 'Slides shown in the top hero carousel.' },
      fields: [
        { name: 'active', type: 'checkbox', admin: { description: 'Unchecking hides this slide without deleting it.' }, defaultValue: true },
        { name: 'tag', type: 'text', admin: { description: 'Eyebrow shown above the title, e.g. "Édition hiver".' } },
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'cta', type: 'text', required: true },
        { name: 'ctaUrl', type: 'text', admin: { description: 'e.g. /shop, /shop/visage, /marques/vichy, /produit/uriage-eau-thermale' }, defaultValue: '/catalogue' },
        { name: 'secondaryCta', type: 'text', admin: { description: 'Optional second button — leave both fields empty to omit it.' } },
        { name: 'secondaryCtaUrl', type: 'text' },
        { name: 'align', type: 'select', defaultValue: 'right', options: [{ label: 'Texte à droite', value: 'right' }, { label: 'Texte à gauche', value: 'left' }] },
        { name: 'overlay', type: 'checkbox', admin: { description: 'Dark gradient scrim behind the text, for legibility over busy photos.' }, defaultValue: true },
        {
          name: 'bg',
          type: 'text',
          admin: { description: 'CSS gradient/color used behind the slide, e.g. linear-gradient(120deg,#2f1f3d,#5E4074 60%,#4b3563)' },
        },
        imageField(),
        imageField('mobileImage', false),
      ],
    },
    {
      name: 'marketingBanners',
      type: 'array',
      admin: {
        description:
          'Full-width seasonal/campaign banners (e.g. "Saison été", "Black Friday", "Noël") — one CMS entry per campaign, reused across seasons. Only the first entry that is Active and inside its date window renders on the homepage; the rest stay ready to switch on without touching code.',
      },
      fields: [
        {
          name: 'campaign',
          type: 'text',
          admin: { description: 'Internal identifier, e.g. "summer-2026" — not shown on the storefront, just for telling campaigns apart here.' },
          required: true,
        },
        imageField('image', false),
        imageField('imageMobile', false),
        {
          name: 'imageMode',
          type: 'select',
          admin: {
            description:
              'Overlay: eyebrow/title/description/CTA are drawn on top of the image (use for plain photos). Image only: the image already contains its own text/CTA baked in — no text is drawn over it, the whole banner just links to the URL below.',
          },
          defaultValue: 'overlay',
          options: [
            { label: 'Texte en surimpression', value: 'overlay' },
            { label: 'Image seule (texte déjà intégré)', value: 'imageOnly' },
          ],
        },
        { name: 'eyebrow', type: 'text', admin: { condition: showWhenOverlayImage, description: 'e.g. "SAISON ÉTÉ"' } },
        { name: 'title', type: 'text', admin: { condition: showWhenOverlayImage } },
        { name: 'description', type: 'textarea', admin: { condition: showWhenOverlayImage } },
        { name: 'ctaLabel', type: 'text' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/catalogue' },
        // Where the button sits along the bottom edge, and which part of the
        // photograph survives the crop. Both are layout choices about one
        // specific image, which is why they live beside it rather than in the
        // theme: a campaign shot with its product on the left needs the button
        // on the right, and the next campaign will need the opposite. Both
        // default to what the banner already rendered, so existing campaigns
        // are unchanged until someone edits them.
        {
          type: 'row',
          fields: [
            {
              name: 'ctaAlign',
              type: 'select',
              admin: {
                condition: showWhenOverlayImage,
                description:
                  'Position du bouton le long du bas de la banniere. A deplacer quand le sujet de la photo (visage, produit, logo) occupe ce coin.',
              },
              defaultValue: 'left',
              options: [
                { label: 'A gauche', value: 'left' },
                { label: 'Au centre', value: 'center' },
                { label: 'A droite', value: 'right' },
              ],
            },
            {
              name: 'imageFraming',
              type: 'select',
              admin: {
                description:
                  'Partie de la photo conservee lors du recadrage (bandeau large sur ordinateur, format haut sur mobile). Centre = comportement par defaut.',
              },
              defaultValue: 'center',
              options: [
                { label: 'Centre', value: 'center' },
                { label: 'Haut', value: 'top' },
                { label: 'Bas', value: 'bottom' },
                { label: 'Gauche', value: 'left' },
                { label: 'Droite', value: 'right' },
                { label: 'Haut gauche', value: 'top-left' },
                { label: 'Haut droite', value: 'top-right' },
                { label: 'Bas gauche', value: 'bottom-left' },
                { label: 'Bas droite', value: 'bottom-right' },
              ],
            },
          ],
        },
        { name: 'badgeLabel', type: 'text', admin: { description: 'Optional small promo pill, e.g. "JUSQU\'À -30%". Leave empty to omit.' } },
        { name: 'active', type: 'checkbox', defaultValue: true },
        {
          type: 'row',
          fields: [
            { name: 'startDate', type: 'date', admin: { description: 'Leave empty to show immediately.' } },
            { name: 'endDate', type: 'date', admin: { description: 'Leave empty to show indefinitely.' } },
          ],
        },
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
            { label: 'Par marque', value: 'brand' },
            { label: 'En promotion', value: 'promotion' },
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
          admin: { description: 'Required when "Source" is Par marque; an optional extra filter for any other source.' },
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
          name: 'ctaLabel',
          type: 'text',
          admin: { description: '"Voir tout" link at the top-right of the rail.' },
          defaultValue: 'Voir tout',
        },
        { name: 'ctaUrl', type: 'text', defaultValue: '/catalogue' },
        {
          name: 'badgeStyle',
          type: 'select',
          admin: { description: 'A small editorial accent so consecutive rails don\'t all look identical.' },
          defaultValue: 'none',
          options: [
            { label: 'Aucun', value: 'none' },
            { label: '"Nouveau"', value: 'new' },
            { label: 'Classement (1, 2, 3...)', value: 'rank' },
            { label: '"Sélection de l\'équipe"', value: 'team' },
          ],
        },
        {
          name: 'editorialImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Legacy single-brand spotlight support — superseded by the "Marques à l\'honneur" section below for new content.' },
        },
        // The block above used to render one paragraph hard-coded in the
        // component, so two rails carrying an image printed the identical
        // text twice on the same page and neither could be changed without a
        // deploy. Each rail now carries its own copy. Every field falls back
        // to the old hard-coded string when left empty, so existing content
        // renders exactly as it did until someone edits it.
        {
          name: 'editorialEyebrow',
          type: 'text',
          admin: {
            condition: showWhenEditorialImage,
            description: 'Surtitre du bloc editorial. Vide = "Expertise pharmaceutique".',
          },
        },
        {
          name: 'editorialTitle',
          type: 'text',
          admin: {
            condition: showWhenEditorialImage,
            description: 'Titre du bloc editorial. Vide = "Des conseils penses pour votre peau".',
          },
        },
        {
          name: 'editorialDescription',
          type: 'textarea',
          admin: {
            condition: showWhenEditorialImage,
            description: 'Paragraphe du bloc editorial. Vide = le texte historique sur les pharmaciens.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'editorialCtaLabel',
              type: 'text',
              admin: { condition: showWhenEditorialImage, description: 'Vide = "Decouvrir nos conseils".' },
            },
            {
              name: 'editorialCtaUrl',
              type: 'text',
              admin: { condition: showWhenEditorialImage, description: 'Vide = /catalogue.' },
            },
          ],
        },
        {
          name: 'brandFeature',
          type: 'group',
          admin: {
            description:
              'Deprecated: kept only so no historical data is lost. New brand spotlights belong in the "Marques à l\'honneur" section (brandsFeatured) below, not here.',
          },
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
          label: 'Brand feature (legacy, do not use for new content)',
        },
      ],
    },
    {
      name: 'brandsFeatured',
      type: 'array',
      admin: {
        description:
          'The single, consolidated "Marques à l\'honneur" carousel — replaces the old pattern of attaching a one-off brand spotlight to individual rails (which produced duplicate-looking sections).',
      },
      fields: [
        { name: 'brand', type: 'relationship', relationTo: 'brands', required: true },
        { name: 'phrase', type: 'text', admin: { description: 'Short line under the brand name, e.g. "Dermatologie et eau thermale."' } },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Découvrir la marque' },
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
      name: 'promotionsGrid',
      type: 'group',
      admin: {
        description:
          'Copy for the "Les offres du moment" section. Products themselves are always resolved live by category tab — this only controls title/subtitle/count, not a fixed list of products.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Promotions' },
        { name: 'title', type: 'text', defaultValue: 'Les offres du moment' },
        { name: 'subtitle', type: 'text', defaultValue: 'Profitez de nos meilleures offres.' },
        { name: 'limit', type: 'number', defaultValue: 8, min: 2, max: 24 },
      ],
    },
    {
      // The header of "Marques à l'honneur". The brands themselves are the
      // `brandsFeatured` array; this is only the wording above them, which
      // used to be written into the component.
      name: 'brandsFeaturedCopy',
      type: 'group',
      admin: { description: "En-tête de la section marques (les marques elles-mêmes se configurent dans « Marques à l'honneur »)." },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Nos partenaires' },
        { name: 'title', type: 'text', defaultValue: "Marques à l'honneur" },
      ],
    },
    {
      // Same split for the services teaser: `servicesTeaser` holds the cards,
      // this holds the words above them.
      name: 'servicesTeaserCopy',
      type: 'group',
      admin: { description: 'En-tête de la section services (les cartes se configurent dans « Services »).' },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Accompagnement' },
        { name: 'title', type: 'text', defaultValue: 'Nos services' },
        {
          name: 'subtitle',
          type: 'text',
          defaultValue: 'Nos pharmaciens vous accompagnent, en ligne comme en institut.',
        },
      ],
    },
    {
      name: 'ctaBannerCopy',
      type: 'group',
      admin: {
        description:
          'Centred call to action: one headline, one line of support, one button. Deliberately has no second button — the point of the block is to leave a single obvious thing to do.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', admin: { description: 'Small line above the headline. Leave empty to omit it.' } },
        { name: 'title', type: 'text', defaultValue: 'Un conseil de pharmacien, en deux minutes' },
        {
          name: 'description',
          type: 'textarea',
          admin: { description: 'One or two sentences. Longer copy competes with the button for attention.' },
          defaultValue: 'Décrivez votre besoin, nous vous orientons vers les produits adaptés à votre peau.',
        },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Nous contacter' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/contact' },
        colorField('bg', '#F7EEE5'),
        colorField('textColor', '#373020'),
        colorField('ctaColor', '#5E4074'),
      ],
    },
    {
      name: 'dermoCornerCopy',
      type: 'group',
      admin: { description: 'Editorial header for the Dermo Corner section (the product picks below are configured separately, in dermoPicks).' },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Dermo corner' },
        { name: 'title', type: 'text', defaultValue: 'La sélection dermatologique du moment' },
        {
          name: 'subtitle',
          type: 'textarea',
          defaultValue:
            'Actifs prouvés, formules minimalistes : les références conseillées par nos pharmaciens pour les peaux réactives, sèches ou à imperfections.',
        },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Voir le rayon dermo' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/catalogue' },
        {
          name: 'picksTitle',
          type: 'text',
          defaultValue: 'Nos soins dermo favoris',
          admin: { description: 'Heading for the product carousel shown below the image/text band (a separate section, not merged into one card).' },
        },
        imageField('image', false),
        {
          name: 'autoplay',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Automatically scroll through the product picks below.' },
        },
        {
          name: 'autoplaySpeedMs',
          type: 'number',
          defaultValue: 4500,
          min: 1500,
          max: 10000,
          admin: { description: 'Milliseconds between each autoplay advance. Ignored if autoplay is off.', condition: (_, siblingData) => siblingData?.autoplay !== false },
        },
      ],
    },
    {
      name: 'dermoPicks',
      type: 'array',
      admin: { description: '"Conseil dermo" strip: an active ingredient + claim for a handful of products. Maximum 8 — extra entries are ignored on the storefront.' },
      maxRows: 8,
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
      name: 'imageCarouselCopy',
      type: 'group',
      admin: {
        description:
          'Editorial image + copy for the "Image + carrousel produits" section — an editorial image on the left with a product carousel beside it, distinct from Dermo Corner (which stacks image/text above its rail instead of beside it).',
      },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Sélection' },
        { name: 'title', type: 'text', defaultValue: 'Nos incontournables du moment' },
        {
          name: 'subtitle',
          type: 'textarea',
          defaultValue: 'Une sélection resserrée, à retrouver aussi en boutique.',
        },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Voir la sélection' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/catalogue' },
        {
          name: 'picksTitle',
          type: 'text',
          defaultValue: 'Notre sélection',
          admin: { description: 'Small heading shown above the product carousel, beside the image.' },
        },
        imageField('image', false),
      ],
    },
    {
      name: 'imageCarouselProducts',
      type: 'relationship',
      admin: { description: 'Products shown in the carousel beside the image. Maximum 8 — extra entries are ignored on the storefront.' },
      hasMany: true,
      maxRows: 8,
      relationTo: 'products',
    },
    {
      name: 'summerEditCopy',
      type: 'group',
      admin: {
        description:
          'Seasonal editorial campaign block — an asymmetric hero (image + oversized title) followed by up to 3 "acts", each its own small product carousel. Independent of Dermo Corner and "Nos coups de cœur".',
      },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: '01 / Summer Edit' },
        { name: 'year', type: 'text', admin: { description: 'Optional, shown beside the eyebrow, e.g. "2026".' } },
        { name: 'title', type: 'text', defaultValue: "L'été commence" },
        {
          name: 'titleAccent',
          type: 'text',
          defaultValue: 'par la peau',
          admin: { description: 'Second line of the title, set in the accent color — leave empty for a single-color title.' },
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: 'Protection solaire, hydratation intense et soins après-soleil pour une peau sublimée tout l’été.',
        },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Découvrir la sélection' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/catalogue' },
        imageField('heroImage', false),
        imageField('heroImageMobile', false),
        {
          name: 'imagePosition',
          type: 'select',
          defaultValue: 'right',
          options: [
            { label: 'Droite', value: 'right' },
            { label: 'Gauche', value: 'left' },
          ],
        },
        {
          name: 'imageScale',
          type: 'number',
          defaultValue: 1.06,
          min: 1,
          max: 1.15,
          admin: { description: 'Subtle zoom-in amount on reveal/hover (1 = none, 1.15 = max).' },
        },
        { name: 'overlay', type: 'checkbox', defaultValue: false, admin: { description: 'Subtle bottom gradient scrim on the image, for a caption-like effect.' } },
        {
          name: 'highlights',
          type: 'array',
          admin: { description: 'Up to 3 short highlights under the CTA, e.g. "Protection solaire".' },
          maxRows: 3,
          fields: [
            { name: 'icon', type: 'select', options: [...SUMMER_EDIT_HIGHLIGHT_ICONS], required: true },
            { name: 'label', type: 'text', required: true },
          ],
          defaultValue: [
            { icon: 'Sun', label: 'Protection solaire' },
            { icon: 'Droplet', label: 'Hydratation intense' },
            { icon: 'Leaf', label: 'Après-soleil réparateur' },
          ],
        },
        {
          name: 'carousel',
          type: 'group',
          admin: { description: 'Behaviour of each act\'s product rail.' },
          fields: [
            { name: 'autoplay', type: 'checkbox', defaultValue: true },
            {
              name: 'autoplaySpeedMs',
              type: 'number',
              defaultValue: 5000,
              min: 2000,
              max: 10000,
              admin: { condition: (_, siblingData) => siblingData?.autoplay !== false },
            },
            { name: 'showCounter', type: 'checkbox', defaultValue: true },
            { name: 'showProgress', type: 'checkbox', defaultValue: true, admin: { description: 'Thin progress line under the counter.' } },
          ],
        },
        {
          name: 'animation',
          type: 'group',
          admin: { description: 'Scroll-triggered motion — always respects a visitor\'s reduced-motion preference.' },
          fields: [
            { name: 'enableReveal', type: 'checkbox', defaultValue: true, admin: { description: 'Title/image/highlights fade and rise in once scrolled into view.' } },
            { name: 'enableParallax', type: 'checkbox', defaultValue: true, admin: { description: 'Very subtle vertical drift on the hero image while scrolling past it.' } },
            { name: 'staggerProducts', type: 'checkbox', defaultValue: true, admin: { description: 'Each act\'s products cascade in, one after another, on scroll.' } },
            {
              name: 'speed',
              type: 'select',
              defaultValue: 'normal',
              options: [
                { label: 'Lente', value: 'slow' },
                { label: 'Normale', value: 'normal' },
                { label: 'Rapide', value: 'fast' },
              ],
            },
          ],
        },
        {
          name: 'colors',
          type: 'group',
          admin: { description: 'A seasonal palette override for this campaign only — the rest of the storefront (and its own theme) is unaffected.' },
          fields: [
            { name: 'background', type: 'text', defaultValue: '#F7EEE5' },
            { name: 'text', type: 'text', defaultValue: '#373020' },
            { name: 'accent', type: 'text', defaultValue: '#6D28D9', admin: { description: 'Titles, eyebrow, act numbers.' } },
            { name: 'cta', type: 'text', defaultValue: '#6D28D9' },
          ],
        },
        {
          name: 'fullWidth',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Uncheck to match the rest of the homepage\'s max-width container.' },
        },
      ],
    },
    {
      name: 'summerEditActs',
      type: 'array',
      admin: {
        description:
          '"Actes" of the campaign (e.g. Protéger, Réparer) — each is its own compact editorial band with a small automatic product carousel. Maximum 3 acts, 4 products each.',
      },
      maxRows: 3,
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Acte I' },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        {
          name: 'products',
          type: 'relationship',
          admin: { description: 'Maximum 4 — extra entries are ignored on the storefront.' },
          hasMany: true,
          maxRows: 4,
          relationTo: 'products',
        },
      ],
      defaultValue: [
        { eyebrow: 'Acte I', title: 'Protéger', description: 'Des formules avancées pour protéger efficacement votre peau des rayons UV.', products: [] },
        { eyebrow: 'Acte II', title: 'Réparer', description: 'Hydrater, apaiser et réparer la peau après l’exposition au soleil.', products: [] },
      ],
    },
    {
      name: 'campaignCopy',
      type: 'group',
      admin: { description: 'Editorial copy + image for the "Nos coups de cœur" block (image + product carousel, left/right on desktop).' },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Sélection' },
        { name: 'title', type: 'text', defaultValue: 'Nos coups de cœur' },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: 'Les références que nos pharmaciens recommandent le plus, réunies dans une sélection à part.',
        },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Voir la sélection' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/catalogue' },
        { name: 'railTitle', type: 'text', defaultValue: 'Nos coups de cœur' },
        imageField('image', false),
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
      name: 'coffretsCopy',
      type: 'group',
      admin: { description: 'Heading, link and layout for the "Coffrets & cadeaux" block (GiftSetsCarousel).' },
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Idées cadeaux' },
        { name: 'title', type: 'text', defaultValue: 'Coffrets & cadeaux' },
        { name: 'subtitle', type: 'text', defaultValue: 'Des rituels prêts à offrir, emballés à la main dans nos boutiques.' },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Tous les coffrets' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/collections' },
        {
          name: 'layout',
          type: 'select',
          defaultValue: 'carousel',
          options: [
            { label: 'Carousel horizontal', value: 'carousel' },
            { label: 'Grille', value: 'grid' },
          ],
        },
        {
          name: 'visibleDesktop',
          type: 'number',
          defaultValue: 3,
          min: 1,
          max: 6,
          admin: { description: 'Approximate number of cards visible at once on desktop (carousel layout).' },
        },
        {
          name: 'visibleMobile',
          type: 'number',
          defaultValue: 1,
          min: 1,
          max: 3,
          admin: { description: 'Approximate number of cards visible at once on mobile (carousel layout).' },
        },
      ],
    },
    {
      name: 'coffrets',
      type: 'array',
      admin: { description: 'Gift box / gift card cards, 4 to 8 recommended. Reorder by dragging.' },
      fields: [
        {
          name: 'active',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Uncheck to hide this card without deleting it.' },
        },
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
        { name: 'ctaLabel', type: 'text', defaultValue: 'Offrir' },
        { name: 'ctaUrl', type: 'text', defaultValue: '/catalogue' },
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
      name: 'servicesTeaser',
      type: 'array',
      admin: { description: '"Nos services" cards on the homepage.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'sub', type: 'text' },
        { name: 'cta', type: 'text' },
        { name: 'href', type: 'text', defaultValue: '/services' },
        { name: 'icon', type: 'select', options: [...SERVICE_ICONS], required: true },
      ],
    },
    {
      name: 'newsletterSection',
      type: 'group',
      admin: { description: 'Newsletter signup banner near the bottom of the homepage.' },
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Recevez nos conseils & nouveautés' },
        {
          name: 'subtitle',
          type: 'textarea',
          defaultValue: 'Inscrivez-vous pour découvrir nos conseils pharmaceutiques, nouveautés et offres exclusives.',
        },
        { name: 'placeholder', type: 'text', defaultValue: 'Votre adresse email' },
        { name: 'buttonLabel', type: 'text', defaultValue: "S'inscrire" },
        { name: 'successMessage', type: 'text', defaultValue: 'Merci ! Votre code −10% arrive par email' },
        {
          type: 'collapsible',
          label: 'Logo',
          fields: [
            { name: 'logoEnabled', type: 'checkbox', defaultValue: true, label: 'Afficher le logo' },
            {
              name: 'logoSize',
              type: 'number',
              admin: { condition: (_, siblingData) => siblingData?.logoEnabled !== false, description: 'En pixels — recommandé 70-80px, discret et non dominant.' },
              defaultValue: 76,
              label: 'Taille (px)',
              max: 140,
              min: 40,
            },
            {
              name: 'logoPosition',
              type: 'select',
              admin: { condition: (_, siblingData) => siblingData?.logoEnabled !== false },
              defaultValue: 'left',
              label: 'Position',
              options: [
                { label: 'À gauche du texte', value: 'left' },
                { label: 'Au-dessus du texte', value: 'top' },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Couleurs',
          fields: [
            { name: 'backgroundColor', type: 'text', admin: { description: 'Couleur hex, ex. #5E4074' }, defaultValue: '#5E4074', label: 'Fond' },
            { name: 'textColor', type: 'text', admin: { description: 'Couleur hex, ex. #FFFFFF' }, defaultValue: '#FFFFFF', label: 'Texte' },
            { name: 'ctaColor', type: 'text', admin: { description: 'Couleur hex, ex. #008AA5' }, defaultValue: '#008AA5', label: 'Couleur du CTA' },
          ],
        },
        {
          type: 'collapsible',
          label: 'Mise en forme & particules',
          fields: [
            { name: 'borderRadius', type: 'number', defaultValue: 26, label: 'Rayon des coins (px)', max: 60, min: 0 },
            { name: 'particlesEnabled', type: 'checkbox', defaultValue: true, label: 'Afficher les particules de neige' },
            {
              name: 'particlesOpacity',
              type: 'number',
              admin: { condition: (_, siblingData) => siblingData?.particlesEnabled !== false, step: 0.01 },
              defaultValue: 0.18,
              label: 'Opacité des particules',
              max: 1,
              min: 0,
            },
          ],
        },
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
