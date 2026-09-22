import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { slugField } from '../lib/slugField'
import { revalidateStorefront } from '../lib/revalidateStorefront'

/**
 * The blog — conseils, routines, dossiers.
 *
 * The footer has advertised an "Articles" link since the shop opened; it has
 * always pointed at /services for want of anywhere else to go. This is that
 * destination, and it is a collection rather than a global because the number
 * of articles is not known in advance and each one needs its own URL.
 *
 * `status` rather than Payload versions: nothing else in this project is
 * versioned (PRODUCT.md — "Products are not versioned in Payload; globals
 * are"), and a draft/published select keeps the schema and the admin
 * consistent with Products and Services rather than introducing a second way
 * of doing the same thing.
 */
export const POST_CATEGORIES = [
  { label: 'Conseils', value: 'conseils' },
  { label: 'Routines', value: 'routines' },
  { label: 'Ingrédients', value: 'ingredients' },
  { label: 'Actualités', value: 'actualites' },
] as const

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    description: 'Articles du blog. Un article publié apparaît sur /blog et dans le sitemap.',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  hooks: {
    // publishedAt filled on first publish, so an editor never has to remember
    // it and the blog cannot show an article dated 1970.
    beforeChange: [
      ({ data }) => {
        if (data?.status === 'published' && !data?.publishedAt) {
          return { ...data, publishedAt: new Date().toISOString() }
        }
        return data
      },
    ],
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['posts'])
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['posts'])
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Titre', required: true },
    slugField('title'),
    {
      name: 'excerpt',
      type: 'textarea',
      admin: { description: 'Résumé affiché sur la carte de l\'article et utilisé comme description SEO par défaut.' },
      label: 'Résumé',
    },
    {
      name: 'featuredImage',
      type: 'upload',
      // Not required at the DB level, for the same reason as Services.image:
      // requiring it would block deleting the Media document.
      admin: { description: 'Image de couverture. Sans elle, la carte affiche un aplat de la charte.' },
      label: 'Image de couverture',
      relationTo: 'media',
    },
    { name: 'content', type: 'richText', label: 'Contenu' },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          index: true,
          label: 'Catégorie',
          options: [...POST_CATEGORIES],
        },
        {
          name: 'author',
          type: 'text',
          admin: { description: 'Ex. "Dr. Untel, pharmacien". Optionnel.' },
          label: 'Auteur',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'draft',
          index: true,
          label: 'Statut',
          options: [
            { label: 'Brouillon', value: 'draft' },
            { label: 'Publié', value: 'published' },
          ],
          required: true,
        },
        {
          name: 'publishedAt',
          type: 'date',
          admin: {
            description: 'Date affichée et date de tri. Vide à la publication = maintenant.',
          },
          label: 'Date de publication',
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Titre SEO' },
        { name: 'metaDescription', type: 'textarea', label: 'Description SEO' },
      ],
      label: 'Référencement',
    },
  ],
}
