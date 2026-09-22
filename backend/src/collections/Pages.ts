import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

/**
 * The institutional pages — "à propos", CGV, mentions légales, retours.
 *
 * ## Why a select for the slug, and not free text
 *
 * Each row here is rendered by a real Next route that exists in the
 * repository (app/(site)/a-propos, /cgv, …). A free-text slug would let an
 * editor create "nos-valeurs", save it, and get nothing: no route matches, so
 * the document would be invisible and look like a broken save. The list below
 * is therefore the set of pages that have somewhere to render, and adding one
 * is deliberately two steps — a route, then an option here.
 *
 * ## Why sections rather than one rich-text blob
 *
 * A CGV is read by someone looking for one clause. Sections give the page a
 * table of contents, a stable anchor per clause (#article-3), and let the
 * pharmacy fill the document one article at a time instead of facing an empty
 * editor. A page with no section renders as "en cours de publication" and is
 * marked noindex — never as a blank legal document, which is worse than none.
 */
export const PAGE_SLUGS = [
  { label: 'À propos', value: 'a-propos' },
  { label: 'Conditions générales de vente', value: 'cgv' },
  { label: 'Mentions légales', value: 'mentions-legales' },
  { label: 'Politique de confidentialité', value: 'politique-confidentialite' },
  { label: 'Livraison', value: 'livraison' },
  { label: 'Retours et remboursements', value: 'retours' },
] as const

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    // Public: these are the pages a visitor is meant to read before buying.
    read: () => true,
    update: canEditContent,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description:
      'Pages institutionnelles. Le slug correspond à une route du site — une page enregistrée sous un slug absent de la liste n\'aurait nulle part où s\'afficher.',
    useAsTitle: 'title',
  },
  defaultSort: 'slug',
  hooks: {
    // Same contract as Services: the storefront caches these behind the
    // 'pages' tag, so a save has to drop that entry or the correction waits
    // for the cache to expire on its own.
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['pages'])
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['pages'])
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Le H1 de la page.' },
      label: 'Titre',
      required: true,
    },
    {
      name: 'slug',
      type: 'select',
      admin: {
        description: 'La route qui affichera cette page. Une seule page par slug.',
        position: 'sidebar',
      },
      index: true,
      label: 'Page',
      options: [...PAGE_SLUGS],
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        description:
          'Brouillon = la page répond toujours, mais affiche "en cours de publication" et n\'est pas indexée par Google.',
        position: 'sidebar',
      },
      defaultValue: 'draft',
      index: true,
      label: 'Statut',
      options: [
        { label: 'Brouillon', value: 'draft' },
        { label: 'Publiée', value: 'published' },
      ],
      required: true,
    },
    {
      name: 'intro',
      type: 'textarea',
      admin: { description: 'Chapô affiché sous le titre. Optionnel.' },
      label: 'Introduction',
    },
    {
      name: 'sections',
      type: 'array',
      admin: {
        description:
          'Une entrée par article ou par rubrique. L\'ordre ici est l\'ordre affiché, et chaque section reçoit son propre lien ancré.',
      },
      fields: [
        { name: 'title', type: 'text', label: 'Titre de la section', required: true },
        { name: 'body', type: 'richText', label: 'Contenu' },
      ],
      label: 'Sections',
      labels: { plural: 'Sections', singular: 'Section' },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          admin: { description: 'Vide = le titre de la page suivi de "— Para d\'Hiver".' },
          label: 'Titre SEO',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          admin: { description: 'Vide = l\'introduction. 150-160 caractères conseillés.' },
          label: 'Description SEO',
        },
      ],
      label: 'Référencement',
    },
  ],
}
