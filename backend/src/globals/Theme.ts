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
  ],
}
