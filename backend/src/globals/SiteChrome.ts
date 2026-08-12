import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'

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
            { label: 'Marques', href: '/shop/brands', visible: true },
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
