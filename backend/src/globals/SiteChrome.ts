import type { Field, GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

// Same rule the Theme global applies: every colour here is rendered into a
// raw inline <style> block on the storefront, so a malformed value is the one
// way out of that tag. Hex only, validated server-side, never merely hinted.
// The four lengths CSS actually accepts — `{3,8}` would also admit "#12345",
// which no browser renders.
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/**
 * One optional colour override for a chrome surface.
 *
 * Deliberately **no defaultValue**. An unset field must stay unset: the
 * storefront only emits a CSS variable for a colour that was actually chosen,
 * and every component keeps its current value as the `var(..., fallback)`.
 * Baking today's colours in as defaults would write them into the database on
 * the next save, and from then on the storefront's palette would be pinned to
 * whatever it happened to be on the day this shipped rather than following
 * the design.
 */
const chromeColor = (name: string, label: string, cssVar: string): Field => ({
  name,
  type: 'text',
  admin: {
    description: `Laisser vide pour conserver la couleur actuelle du storefront. Surcharge ${cssVar}.`,
  },
  label,
  validate: (value: unknown) => {
    // Empty is the normal, meaningful state here — it means "not configured".
    if (value === undefined || value === null || value === '') return true
    if (typeof value !== 'string' || !HEX_COLOR_RE.test(value)) {
      return 'Doit être une couleur hexadécimale valide, ex. #5E4074'
    }
    return true
  },
})

// The 4 header action slots are fixed, not user-addable/removable — "Favoris"
// and "Panier" are wired to real cart/favorites behavior (badge counts,
// opening the cart drawer) in the frontend component, not a plain link, and
// their route is intentionally not exposed here at all (kept out of the
// schema, not just hidden in the UI) so a builder edit can never break
// checkout. Only label/icon/visibility are editable for every action; href
// is only meaningful (and only shown in the dashboard) for the two plain-link
// actions, "services" and "contact".
export const HEADER_ACTION_KEYS = ['services', 'contact', 'favoris', 'panier'] as const
export const HEADER_ACTION_ICONS = ['MapPin', 'MessageCircle', 'Phone', 'Mail', 'HelpCircle', 'Heart', 'ShoppingBag'] as const

export const SiteChrome: GlobalConfig = {
  slug: 'site-chrome',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description: 'Top bar, header and footer — shown on every page. Edited from the Storefront Builder\'s "Global" tab (/dashboard/storefront).',
  },
  hooks: {
    // Same loop Navigation already closes: saving a colour purges the
    // storefront's cached chrome so it is live without a rebuild. Failures
    // are logged, never thrown — see revalidateStorefront.
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['site-chrome'])
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
      name: 'topBar',
      type: 'group',
      admin: { description: 'Scrolling promo ticker above the header.' },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        {
          name: 'messages',
          type: 'array',
          admin: { description: 'Shown as a scrolling marquee on desktop/tablet.' },
          fields: [
            { name: 'text', type: 'text', required: true },
            { name: 'active', type: 'checkbox', defaultValue: true, admin: { description: 'Uncheck to hide without deleting.' } },
          ],
          defaultValue: [
            { text: 'Des remises exceptionnelles : -40% -50% -60% sur une sélection de produits, profitez-en vite', active: true },
            { text: 'Livraison partout au Maroc', active: true },
            { text: 'Paiement 100% sécurisé', active: true },
            { text: 'Produits authentiques garantis', active: true },
            { text: 'Conseil pharmacien gratuit', active: true },
            { text: 'Livraison offerte dès 399 MAD', active: true },
          ],
        },
        {
          name: 'marqueeSpeedSec',
          type: 'number',
          admin: { description: 'Seconds for one full loop of the marquee — lower is faster.' },
          defaultValue: 34,
          min: 10,
          max: 90,
        },
        {
          name: 'mobileMessage',
          type: 'text',
          admin: { description: 'A moving ticker is hard to read on a phone — mobile shows this single static message instead.' },
          defaultValue: 'Livraison offerte dès 399 MAD',
        },
      ],
    },
    {
      name: 'topBarAppearance',
      type: 'group',
      admin: {
        description:
          'Couleurs de la top bar. Tout champ laissé vide garde exactement le rendu actuel — rien n\'est écrit tant qu\'une couleur n\'a pas été choisie.',
      },
      fields: [
        chromeColor('backgroundColor', 'Couleur de fond', '--chrome-topbar-bg'),
        chromeColor('textColor', 'Couleur du texte', '--chrome-topbar-text'),
        chromeColor('linkColor', 'Couleur des liens', '--chrome-topbar-link'),
        chromeColor('hoverColor', 'Couleur au survol', '--chrome-topbar-hover'),
        {
          name: 'opacity',
          type: 'number',
          admin: { description: 'Opacité du bandeau, en pourcentage. Vide = 100 %.', step: 1 },
          label: 'Opacité (%)',
          max: 100,
          min: 0,
        },
      ],
      label: 'Apparence de la top bar',
    },
    {
      name: 'headerAppearance',
      type: 'group',
      admin: {
        description:
          'Couleurs de l\'en-tête. Tout champ laissé vide garde exactement le rendu actuel.',
      },
      fields: [
        chromeColor('backgroundColor', 'Fond', '--chrome-header-bg'),
        chromeColor('textColor', 'Texte', '--chrome-header-text'),
        chromeColor('linkColor', 'Liens', '--chrome-header-link'),
        chromeColor('hoverColor', 'Survol', '--chrome-header-hover'),
        chromeColor('iconColor', 'Icônes', '--chrome-header-icon'),
        chromeColor('borderColor', 'Bordure', '--chrome-header-border'),
      ],
      label: 'Apparence de l\'en-tête',
    },
    {
      name: 'footerAppearance',
      type: 'group',
      admin: {
        description: 'Couleurs du pied de page. Tout champ laissé vide garde exactement le rendu actuel.',
      },
      fields: [
        chromeColor('backgroundColor', 'Fond', '--chrome-footer-bg'),
        chromeColor('textColor', 'Texte', '--chrome-footer-text'),
        chromeColor('headingColor', 'Titres', '--chrome-footer-heading'),
        chromeColor('linkColor', 'Liens', '--chrome-footer-link'),
        chromeColor('hoverColor', 'Survol', '--chrome-footer-hover'),
        chromeColor('iconColor', 'Icônes', '--chrome-footer-icon'),
        chromeColor('borderColor', 'Bordure', '--chrome-footer-border'),
      ],
      label: 'Apparence du pied de page',
    },
    {
      // Seasonal coupon popup. Site-wide chrome rather than a homepage
      // section: a campaign popup follows the visitor, and putting it in the
      // ordered homepage stack would have made it a block in the page flow.
      name: 'promoModal',
      type: 'group',
      label: 'Pop-up promo saisonnière',
      admin: { description: "S'affiche une fois par visiteur, après un court délai. Se remet à zéro pour tous dès que le code change." },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false, label: 'Activer la pop-up' },
        { name: 'badge', type: 'text', defaultValue: 'Offre de saison' },
        { name: 'expiryLabel', type: 'text', label: "Mention d'échéance", admin: { description: "Ex. « Jusqu'au 31 juillet ». Texte libre, aucune date n'est calculée." } },
        { name: 'title', type: 'text', defaultValue: 'Pensé pour la saison' },
        { name: 'subtitle', type: 'text', defaultValue: '25% sur votre commande', admin: { description: 'Deuxième ligne du titre, mise en avant.' } },
        { name: 'description', type: 'textarea' },
        { name: 'code', type: 'text', label: 'Code promo', admin: { description: 'Doit correspondre à un coupon actif dans Promotions, sinon il sera refusé au panier.' } },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Copier le code' },
        {
          name: 'conditions',
          type: 'array',
          label: "Conditions d'utilisation",
          maxRows: 4,
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Visuel' },
        { name: 'delaySeconds', type: 'number', defaultValue: 6, min: 0, max: 60, label: 'Délai avant affichage (s)' },
      ],
    },
    {
      name: 'logo',
      type: 'group',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Leave empty to keep the default logo mark.' } },
        { name: 'wordmark', type: 'text', defaultValue: "PARA D'HIVER" },
        { name: 'href', type: 'text', defaultValue: '/' },
      ],
    },
    {
      name: 'headerSearch',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'placeholder', type: 'text', defaultValue: 'Rechercher un produit, une marque…' },
      ],
    },
    {
      name: 'headerActions',
      type: 'array',
      admin: {
        description: 'The 4 header action icons, in display order. "Favoris" and "Panier" keep their real route/behavior — only label, icon and visibility apply to them.',
      },
      minRows: 4,
      maxRows: 4,
      fields: [
        { name: 'key', type: 'select', options: [...HEADER_ACTION_KEYS], required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'icon', type: 'select', options: [...HEADER_ACTION_ICONS], required: true },
        {
          name: 'href',
          type: 'text',
          admin: {
            description: 'Ignored for "Favoris" and "Panier" — their route is fixed in code, never CMS-editable.',
            condition: (_, siblingData) => siblingData?.key === 'services' || siblingData?.key === 'contact',
          },
        },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
      defaultValue: [
        { key: 'services', label: 'Magasin et services', icon: 'MapPin', href: '/services', visible: true },
        { key: 'contact', label: 'Contact', icon: 'MessageCircle', href: '/contact', visible: true },
        { key: 'favoris', label: 'Favoris', icon: 'Heart', visible: true },
        { key: 'panier', label: 'Panier', icon: 'ShoppingBag', visible: true },
      ],
    },
    {
      name: 'footerColumns',
      type: 'array',
      admin: { description: 'Footer link columns, in display order. Reorder by dragging; hide a column without deleting it via "Visible".' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'visible', type: 'checkbox', defaultValue: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
            { name: 'visible', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
      defaultValue: [
        {
          title: 'À propos',
          visible: true,
          links: [
            { label: 'Notre pharmacie', href: '/services', visible: true },
            { label: 'Nos pharmaciens', href: '/services', visible: true },
            { label: 'Contact', href: '/contact', visible: true },
          ],
        },
        {
          title: 'Boutique',
          visible: true,
          links: [
            { label: 'Produits', href: '/shop', visible: true },
            { label: 'Marques', href: '/marques', visible: true },
            { label: 'Promotions', href: '/shop/soldes', visible: true },
            { label: 'Nouveautés', href: '/shop/nouveautes', visible: true },
          ],
        },
        {
          title: 'Conseils',
          visible: true,
          links: [
            { label: 'Conseils pharmaceutiques', href: '/services', visible: true },
            { label: 'Articles', href: '/services', visible: true },
            { label: 'Routines', href: '/services', visible: true },
            { label: 'Préoccupations', href: '/services', visible: true },
          ],
        },
        {
          title: 'Services',
          visible: true,
          links: [
            { label: 'Livraison', href: '/services', visible: true },
            { label: 'Scanner ordonnance', href: '/services', visible: true },
            { label: 'Contact', href: '/contact', visible: true },
            { label: 'FAQ', href: '/services', visible: true },
          ],
        },
      ],
    },
  ],
}
