import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

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

export const NAV_ANIMATION_TYPES = [
  { label: 'Aucune', value: 'none' },
  { label: 'Clignotement discret', value: 'blink' },
  { label: 'Pulsation', value: 'pulse' },
  { label: 'Reflet (shimmer)', value: 'shimmer' },
  { label: 'Halo lumineux', value: 'glow' },
] as const

export const NAV_FONT_WEIGHTS = [
  { label: 'Léger (300)', value: '300' },
  { label: 'Normal (400)', value: '400' },
  { label: 'Moyen (500)', value: '500' },
  { label: 'Semi-gras (600)', value: '600' },
  { label: 'Gras (700)', value: '700' },
] as const

// Hex, 3/6/8 digits. Empty is always allowed and means "inherit the theme"
// — that's what keeps every pre-existing nav item rendering exactly as
// before once these fields ship.
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

const hexColorField = (name: string, label: string, description: string) => ({
  name,
  type: 'text' as const,
  admin: { description },
  label,
  validate: (value: unknown) =>
    !value || (typeof value === 'string' && HEX_COLOR.test(value))
      ? true
      : 'Utilisez un code hexadécimal, ex. #C0002B (ou laissez vide pour hériter du thème).',
})

/** Per-item colour overrides. Every field is optional: unset means the nav
 * item keeps the theme colour it has always used, so this group can be
 * added to a live navigation without touching a single existing entry. */
/**
 * @param enumNames - Postgres enum types to reuse for the select fields.
 *   Payload derives an enum name from the field path, and the mega-menu path
 *   (`navigation.items.megaMenu.columns.links.appearance.fontWeight`) blows
 *   past Postgres's 63-character identifier limit. Pointing both usages at
 *   the top-level item's enum is also semantically right: the options are the
 *   same list, so they should be the same type.
 */
const buildAppearanceGroup = (enumNames?: { fontWeight: string }) => ({
  name: 'appearance',
  type: 'group' as const,
  admin: { description: 'Laisser vide pour utiliser les couleurs du thème.' },
  fields: [
    hexColorField('color', 'Couleur du texte', 'Couleur au repos, ex. #C0002B.'),
    hexColorField('hoverColor', 'Couleur au survol', 'Par défaut : la couleur au repos.'),
    hexColorField('activeColor', 'Couleur page active', 'Utilisée quand la page courante correspond à ce lien.'),
    hexColorField('backgroundColor', 'Couleur de fond', 'Optionnel — pastille de fond derrière le lien.'),
    hexColorField('borderColor', 'Couleur de bordure', 'Optionnel — contour fin autour du lien, ex. #C0002B.'),
    {
      name: 'fontWeight',
      type: 'select' as const,
      ...(enumNames ? { enumName: enumNames.fontWeight } : {}),
      label: 'Poids de police',
      options: [...NAV_FONT_WEIGHTS],
    },
    {
      name: 'opacity',
      type: 'number' as const,
      admin: {
        description:
          'De 0 (invisible) à 1 (pleine intensité). Laisser vide ou 1 pour un lien normal ; 0.6–0.8 pour un lien secondaire.',
        step: 0.05,
      },
      label: 'Opacité (0 → 1)',
      max: 1,
      min: 0,
      // Deliberately no defaultValue: an unset field emits no CSS variable at
      // all, so every nav item that existed before this shipped keeps its
      // exact current rendering rather than being pinned to an explicit 1.
      validate: (value: unknown) =>
        value === null || value === undefined || (typeof value === 'number' && value >= 0 && value <= 1)
          ? true
          : 'L’opacité doit être comprise entre 0 et 1.',
    },
  ],
})

const appearanceGroup = buildAppearanceGroup()

/** CSS-driven attention effects. `enabled` is a separate checkbox from
 * `type` on purpose: an editor can switch an animation off for a campaign
 * without losing the type/duration they tuned. */
const buildAnimationGroup = (enumNames?: { type: string }) => ({
  name: 'animation',
  type: 'group' as const,
  admin: { description: 'Effets CSS. Automatiquement désactivés pour les visiteurs ayant demandé de réduire les animations (prefers-reduced-motion).' },
  fields: [
    { name: 'enabled', type: 'checkbox' as const, defaultValue: false, label: 'Activer l\'animation' },
    {
      name: 'type',
      type: 'select' as const,
      admin: { condition: (_: unknown, siblingData: { enabled?: boolean }) => siblingData?.enabled === true },
      ...(enumNames ? { enumName: enumNames.type } : {}),
      defaultValue: 'none',
      label: 'Type',
      options: [...NAV_ANIMATION_TYPES],
    },
    {
      name: 'duration',
      type: 'number' as const,
      admin: {
        condition: (_: unknown, siblingData: { enabled?: boolean }) => siblingData?.enabled === true,
        description: 'Durée d\'un cycle, en secondes. 2 = discret, <1 = agressif.',
      },
      defaultValue: 2,
      label: 'Durée (s)',
      min: 0.2,
      max: 20,
    },
    {
      name: 'delay',
      type: 'number' as const,
      admin: { condition: (_: unknown, siblingData: { enabled?: boolean }) => siblingData?.enabled === true },
      defaultValue: 0,
      label: 'Délai (s)',
      min: 0,
      max: 20,
    },
    {
      name: 'iterationCount',
      type: 'text' as const,
      admin: {
        condition: (_: unknown, siblingData: { enabled?: boolean }) => siblingData?.enabled === true,
        description: '"infinite" ou un nombre de répétitions, ex. 3.',
      },
      defaultValue: 'infinite',
      label: 'Répétitions',
      validate: (value: unknown) =>
        !value || value === 'infinite' || (typeof value === 'string' && /^\d+$/.test(value))
          ? true
          : 'Indiquez "infinite" ou un nombre entier.',
    },
  ],
})

const animationGroup = buildAnimationGroup()

// Mega-menu links reuse the top-level item enums (see buildAppearanceGroup).
const megaAppearanceGroup = buildAppearanceGroup({ fontWeight: 'enum_navigation_items_appearance_font_weight' })
const megaAnimationGroup = buildAnimationGroup({ type: 'enum_navigation_items_animation_type' })

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
  hooks: {
    // Purges the storefront's cached navigation the moment this global is
    // saved, so a colour, label, badge or ordering change is live without a
    // rebuild. Failures are logged, never thrown — see revalidateStorefront.
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['navigation'])
      },
    ],
  },
  versions: {
    drafts: {
      autosave: false,
    },
    max: 20,
  },
  fields: [
    {
      name: 'navPreview',
      type: 'ui',
      admin: { components: { Field: '/components/NavItemPreviewField#NavItemPreviewField' } },
      label: 'Aperçu',
    },
    {
      /**
       * The mobile quick-category strip.
       *
       * Lives in Navigation rather than SiteChrome for one decisive reason:
       * outside preview the storefront layout does not read SiteChrome at all
       * (logo, header actions and footer columns come from the generated
       * data/siteChrome.ts snapshot, refreshed by `npm run sync-cms`), while
       * Navigation *is* fetched live for every visitor and its cache tag is
       * purged by the afterChange hook above. Putting the strip here is what
       * makes "edit a category, see it on the shop" true without a rebuild.
       *
       * It is also simply what it is: navigation. The link fields are the
       * exact same `linkTypeFields` the navbar and the mega menus use, so a
       * chip resolves through resolveLiveNavHref like every other link and
       * cannot drift into a second, parallel way of describing a destination.
       *
       * Deliberately NOT auto-filled from the Categories collection — the
       * same decision this global already documents for `items`: adding a
       * category must not silently change the shop's navigation.
       */
      // Named `catStrip`, not `mobileCategoryStrip`, purely for length.
      // Postgres caps identifiers at 63 characters and Payload derives enum
      // names from the whole path: the longer name produced
      // `enum__navigation_v_version_mobile_category_strip_items_collection_route`
      // at 71 characters and the config was refused at boot. `dbName` does not
      // help — it renames array tables but not the enums derived from the
      // field path — so the field itself is the short one and the `label`
      // below carries the readable name for editors.
      name: 'catStrip',
      type: 'group',
      admin: {
        description:
          "Bande de catégories horizontale affichée sous l'en-tête, sur mobile uniquement (masquée à partir de 768px, où ces liens sont déjà dans le menu principal).",
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Afficher la bande de catégories sur mobile',
        },
        {
          name: 'showAllChip',
          type: 'checkbox',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled === true,
            description: 'Ajoute une puce en tête de bande qui renvoie vers le catalogue complet.',
          },
          defaultValue: true,
          label: 'Puce « Tout » en tête',
        },
        {
          name: 'allChipLabel',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled === true && siblingData?.showAllChip === true,
          },
          defaultValue: 'Tout',
          label: 'Libellé de la puce',
        },
        {
          name: 'items',
          type: 'array',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled === true,
            description: "Une puce par entrée, dans l'ordre d'affichage — glissez pour réordonner.",
          },
          // A strip is a glance, not a menu. Past roughly this many the
          // shopper is swiping a second screen of chips to find anything,
          // which is what the burger menu is already for.
          maxRows: 10,
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Afficher cette puce' },
            ...linkTypeFields(NAV_LINK_TYPES),
          ],
          label: 'Puces',
        },
      ],
      label: 'Bande de catégories (mobile)',
    },
    {
      name: 'items',
      type: 'array',
      admin: { description: 'Main navigation items, in display order — drag to reorder.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        // `visible` is this item's on/off switch — it predates this group and
        // is already wired through sync-cms, so it stays the single source of
        // truth rather than gaining a duplicate "enabled" sibling. Ordering
        // likewise comes from the array's own drag-to-reorder, not a separate
        // `order` number that could disagree with it.
        { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Afficher ce lien' },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          admin: { description: 'Ouvre le lien dans un nouvel onglet (rel="noopener" ajouté automatiquement).' },
          defaultValue: false,
          label: 'Ouvrir dans un nouvel onglet',
        },
        ...linkTypeFields(NAV_LINK_TYPES),
        { name: 'badgeLabel', type: 'text', admin: { description: 'Optional small pill next to the label, e.g. "Nouveau".' } },
        {
          name: 'badgeColor',
          type: 'select',
          admin: { description: 'Palette du thème. Pour une couleur libre, remplissez les deux champs hexadécimaux ci-dessous — ils ont priorité.' },
          defaultValue: 'none',
          options: [...NAV_BADGE_COLORS],
        },
        // Free-hex overrides rather than a nested `badge` group: badgeLabel/
        // badgeColor already hold this item's badge and are populated on live
        // data. A parallel group would be a second source of truth for the
        // same pill.
        hexColorField('badgeBackgroundColor', 'Badge — couleur de fond', 'Ex. #C0002B. Prioritaire sur la palette ci-dessus.'),
        hexColorField('badgeTextColor', 'Badge — couleur du texte', 'Ex. #FFFFFF. Par défaut : blanc.'),
        appearanceGroup,
        animationGroup,
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
                  // The very same appearance/animation groups as a top-level
                  // item, not a parallel set of fields: a link styled in the
                  // navbar and the same link inside the mega menu must be
                  // describable the same way, and one shared definition is
                  // what guarantees they can't drift.
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    ...linkTypeFields(MEGA_LINK_TYPES),
                    { name: 'visible', type: 'checkbox', defaultValue: true },
                    { name: 'badgeLabel', type: 'text', admin: { description: 'Pastille facultative, ex. "Nouveau".' } },
                    hexColorField('badgeBackgroundColor', 'Badge — couleur de fond', 'Ex. #C0002B.'),
                    hexColorField('badgeTextColor', 'Badge — couleur du texte', 'Ex. #FFFFFF.'),
                    megaAppearanceGroup,
                    megaAnimationGroup,
                  ],
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
