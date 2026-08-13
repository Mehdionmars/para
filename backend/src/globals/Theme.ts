import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'

export const THEME_PRESETS = ['parad-hiver', 'minimal', 'botanical', 'soft-beauty', 'premium', 'ocean', 'custom'] as const

// Every color here is rendered server-side into a raw inline `<style>` block
// (see frontend/app/(site)/layout.tsx) so the whole storefront can re-theme
// from one saved value with zero component changes — nothing else reads
// this global. That also makes it the one place a malformed value could
// break out of the `<style>` tag (e.g. `#fff}</style><script>...`), so every
// color field is hex-only, validated server-side, not just hinted in the UI.
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/

const colorField = (name: string, label: string, defaultValue: string, cssVar: string) =>
  ({
    name,
    type: 'text',
    admin: { description: `Hex color only. Overrides ${cssVar} everywhere on the storefront.` },
    defaultValue,
    label,
    validate: (value: unknown) => {
      if (typeof value !== 'string' || !HEX_COLOR_RE.test(value)) {
        return 'Doit être une couleur hexadécimale valide, ex. #5E4074'
      }
      return true
    },
  }) as const

const buttonColorField = (name: string, label: string, defaultValue: string) =>
  ({
    name,
    type: 'text',
    admin: { description: 'Hex color only.' },
    defaultValue,
    label,
    validate: (value: unknown) => {
      if (typeof value !== 'string' || !HEX_COLOR_RE.test(value)) {
        return 'Doit être une couleur hexadécimale valide, ex. #5E4074'
      }
      return true
    },
  }) as const

export const Theme: GlobalConfig = {
  slug: 'theme',
  access: {
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description: 'Site-wide color theme — picking a preset or a color here re-colors the whole storefront. Edited from the Storefront Builder\'s "Apparence" tab (/dashboard/storefront).',
  },
  versions: {
    drafts: {
      autosave: false,
    },
    max: 20,
  },
  fields: [
    {
      name: 'preset',
      type: 'select',
      admin: { description: 'Picking a preset fills the colors below; nudging a color afterwards switches this to "Personnalisé".' },
      defaultValue: 'parad-hiver',
      options: [
        { label: "Para d'Hiver", value: 'parad-hiver' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Botanical', value: 'botanical' },
        { label: 'Soft Beauty', value: 'soft-beauty' },
        { label: 'Premium', value: 'premium' },
        { label: 'Ocean', value: 'ocean' },
        { label: 'Personnalisé', value: 'custom' },
      ],
    },
    colorField('colorPrimary', 'Couleur principale', '#5E4074', '--pdh-plum'),
    colorField('colorSecondary', 'Couleur secondaire', '#008AA5', '--pdh-teal'),
    colorField('colorAccent', 'Couleur accent', '#5FBE00', '--pdh-accent'),
    colorField('colorSale', 'Prix promotionnel', '#FF514D', '--pdh-sale'),
    colorField('colorTextPrimary', 'Texte principal', '#373020', '--pdh-ink'),
    colorField('colorTextMuted', 'Texte secondaire', '#757D86', '--pdh-muted'),
    colorField('colorBackgroundSecondary', 'Fond secondaire', '#F7EEE5', '--pdh-cream'),
    {
      type: 'collapsible',
      label: 'Boutons (CTA principal)',
      admin: { description: 'Style des boutons pleins (Découvrir, Ajouter au panier, etc.) — appliqué partout sur le site, y compris dans les sections créées depuis le Builder.' },
      fields: [
        buttonColorField('buttonBg', 'Fond', '#5E4074'),
        buttonColorField('buttonText', 'Texte', '#FFFFFF'),
        buttonColorField('buttonHoverBg', 'Fond (survol)', '#432951'),
        buttonColorField('buttonHoverText', 'Texte (survol)', '#FFFFFF'),
        {
          name: 'buttonRadius',
          type: 'number',
          admin: { description: 'Rayon des coins en pixels — 999 pour un bouton en pilule.' },
          defaultValue: 999,
          label: 'Rayon (px)',
          min: 0,
        },
        {
          name: 'buttonFontWeight',
          type: 'number',
          defaultValue: 600,
          label: 'Graisse du texte',
          max: 900,
          min: 100,
        },
        {
          name: 'buttonLetterSpacing',
          type: 'number',
          admin: { description: 'En em — 0.08 par défaut.', step: 0.01 },
          defaultValue: 0.08,
          label: 'Espacement des lettres (em)',
          min: 0,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Badges produit',
      admin: { description: 'Style par défaut des badges produit (Top, Nouveau, Promo…) — chaque badge peut ensuite surcharger sa propre couleur depuis la fiche produit.' },
      fields: [
        buttonColorField('badgeBg', 'Fond', '#5E4074'),
        buttonColorField('badgeText', 'Texte', '#FFFFFF'),
        {
          name: 'badgeFontSize',
          type: 'number',
          admin: { description: 'En pixels — 10 à 11px recommandé.', step: 0.5 },
          defaultValue: 10.5,
          label: 'Taille du texte (px)',
          min: 8,
          max: 16,
        },
        {
          name: 'badgeFontWeight',
          type: 'number',
          defaultValue: 600,
          label: 'Graisse du texte',
          max: 900,
          min: 100,
        },
        {
          name: 'badgeLetterSpacing',
          type: 'number',
          admin: { description: 'En em — 0.06 par défaut.', step: 0.01 },
          defaultValue: 0.06,
          label: 'Espacement des lettres (em)',
          min: 0,
        },
        {
          name: 'badgeRadius',
          type: 'number',
          admin: { description: '999 pour un badge en pilule.' },
          defaultValue: 999,
          label: 'Rayon (px)',
          min: 0,
        },
        {
          name: 'badgePaddingX',
          type: 'number',
          defaultValue: 11,
          label: 'Padding horizontal (px)',
          min: 0,
          max: 30,
        },
        {
          name: 'badgePaddingY',
          type: 'number',
          admin: { description: 'Vise une hauteur totale de 24-26px avec la taille de texte par défaut.', step: 0.5 },
          defaultValue: 5,
          label: 'Padding vertical (px)',
          min: 0,
          max: 20,
        },
        {
          name: 'badgeGap',
          type: 'number',
          admin: { description: 'Espace vertical entre badges empilés.' },
          defaultValue: 6,
          label: 'Espacement entre badges (px)',
          min: 0,
          max: 20,
        },
      ],
    },
  ],
}
