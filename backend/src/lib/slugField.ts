import type { Field } from 'payload'

const COMBINING_DIACRITICS = new RegExp('[̀-ͯ]', 'g')

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Text field that auto-fills from `sourceField` (e.g. "title") the first time it's saved, unless the editor set it explicitly. */
export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  admin: {
    position: 'sidebar',
  },
  hooks: {
    beforeValidate: [
      ({ data, value }) => {
        if (value) return value
        const source = data?.[sourceField]
        return typeof source === 'string' && source ? slugify(source) : value
      },
    ],
  },
  index: true,
  unique: true,
})
