/**
 * One-off, non-destructive content update matching a client-supplied
 * wireframe: a new top-nav taxonomy (Soldes, K Beauty, Bébé & Maman,
 * Bucco-dentaire, Compléments alimentaires, Nouveautés added), a "Coup de
 * cœur" product rail, and a 4th coffret tile.
 *
 * Unlike seed.ts, this never wipes products/brands/media/stores — it only
 * replaces the `categories` collection (pure nav labels, safe to rebuild)
 * and appends to the existing Home global content. Safe to re-run: it
 * clears categories before recreating them, and the Home global additions
 * are keyed so a second run replaces rather than duplicates them.
 *
 * Usage: npx tsx src/scripts/update-wireframe-content.ts
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

// Level 0 = navbar entries, level 1 = mega-menu columns, level 2 = items.
// Marques/Visage/Cheveux/Corps/Maquillage keep the site's existing approved
// taxonomy; the rest are new, matching the wireframe's nav row.
const CATEGORY_TREE: { name: string; columns: { title: string; items: string[] }[] }[] = [
  {
    name: 'Soldes',
    columns: [{ title: 'Promotions', items: ['Ventes flash', "Jusqu'à -50%", 'Fins de série', 'Derniers coups de cœur'] }],
  },
  {
    name: 'Marques',
    columns: [
      { title: 'Dermocosmétique', items: ['La Roche-Posay', 'Avène', 'Bioderma', 'CeraVe', 'Vichy', 'Uriage'] },
      { title: 'Autres marques', items: ['Nuxe', 'Klorane', 'Ducray', 'Mustela', 'Lierac', 'SVR'] },
    ],
  },
  {
    name: 'Visage',
    columns: [
      { title: 'Nettoyants', items: ['Eaux micellaires', 'Gels moussants', 'Démaquillants', 'Lotions toniques'] },
      { title: 'Sérums', items: ['Anti-taches', 'Anti-âge', 'Hydratants', 'Vitamine C'] },
      { title: 'Crèmes', items: ['Peaux sèches', 'Peaux sensibles', 'Contour des yeux', 'Nuit'] },
      { title: 'Masques', items: ['Purifiants', 'Hydratants', 'Peelings doux', 'Patchs'] },
    ],
  },
  {
    name: 'Cheveux',
    columns: [
      { title: 'Shampoings & soins', items: ['Shampoings traitants', 'Après-shampoings', 'Masques capillaires', 'Sérums cheveux'] },
      { title: 'Besoins', items: ['Chute de cheveux', 'Pellicules', 'Cheveux secs', 'Cuir chevelu sensible'] },
    ],
  },
  {
    name: 'Corps',
    columns: [
      { title: 'Hygiène', items: ['Gels et huiles lavants', 'Savon dermatologique', 'Déodorants', 'Anti-transpirants', 'Hygiène intime'] },
      { title: 'Soins ciblés', items: ['Crèmes cicatrisantes', 'Cellulite & vergetures', 'Huiles & crèmes minceur', 'Soins mains & pieds'] },
      { title: 'Hydratation', items: ['Laits corps', 'Baumes réparateurs', 'Gommages & exfoliants', 'Huiles sèches'] },
      { title: 'Épilation', items: ['Crèmes dépilatoires', 'Épilateurs', 'Après-épilation', 'Accessoires'] },
    ],
  },
  {
    name: 'K Beauty',
    columns: [{ title: 'Rituel coréen', items: ['Nettoyants', 'Essences & sérums', 'Masques tissu', 'Crèmes hydratantes'] }],
  },
  {
    name: 'Maquillage',
    columns: [
      { title: 'Teint', items: ['Fond de teint', 'Correcteurs', 'Poudres'] },
      { title: 'Yeux & sourcils', items: ['Mascaras', 'Eyeliners', 'Sourcils'] },
      { title: 'Lèvres', items: ['Rouges à lèvres', 'Baumes teintés', 'Gloss'] },
    ],
  },
  {
    name: 'Bébé & Maman',
    columns: [
      { title: 'Bébé', items: ['Soins du change', 'Toilette douce', 'Crèmes hydratantes', 'Solaire bébé'] },
      { title: 'Maman', items: ['Grossesse', 'Allaitement', 'Vergetures'] },
    ],
  },
  {
    name: 'Bucco-dentaire',
    columns: [{ title: 'Hygiène bucco-dentaire', items: ['Dentifrices', 'Brosses à dents', 'Bains de bouche', 'Fil dentaire'] }],
  },
  {
    name: 'Compléments alimentaires',
    columns: [{ title: 'Compléments', items: ['Vitalité & immunité', 'Cheveux & ongles', 'Sommeil & stress', 'Digestion'] }],
  },
  {
    name: 'Nouveautés',
    columns: [{ title: 'Dernières arrivées', items: ['Nouveaux soins visage', 'Nouveaux soins corps', 'Nouvelles marques'] }],
  },
]

const COUP_DE_COEUR_KEY = 'coup-de-coeur'
const COUP_DE_COEUR_PRODUCT_NAMES = [
  'Hydragenist Sérum Oxygénant',
  'Huile Prodigieuse Multi-Fonctions',
  'Anthelios UVMune 400 SPF50+',
  'Kelual DS Shampooing Traitant',
]

const FOURTH_COFFRET_TITLE = 'Coffret Bébé & Maman'

async function run() {
  const payload = await getPayload({ config })
  payload.logger.info("Applying wireframe content update (nav taxonomy, Coup de cœur rail, 4th coffret)...")

  // --- Categories: rebuild only, never touches products/brands/media ---
  const { docs: existingCategories } = await payload.find({ collection: 'categories', limit: 1000, pagination: false })
  for (const doc of existingCategories) {
    await payload.delete({ collection: 'categories', id: doc.id })
  }

  let categoryCount = 0
  for (let i = 0; i < CATEGORY_TREE.length; i++) {
    const top = CATEGORY_TREE[i]
    const topDoc = await payload.create({ collection: 'categories', data: { isActive: true, name: top.name, order: i } })
    categoryCount++
    for (let c = 0; c < top.columns.length; c++) {
      const column = top.columns[c]
      const columnDoc = await payload.create({
        collection: 'categories',
        data: { isActive: true, name: column.title, order: c, parent: topDoc.id },
      })
      categoryCount++
      for (let it = 0; it < column.items.length; it++) {
        await payload.create({
          collection: 'categories',
          data: { isActive: true, name: column.items[it], order: it, parent: columnDoc.id },
        })
        categoryCount++
      }
    }
  }
  payload.logger.info(`Categories: ${categoryCount} created (${CATEGORY_TREE.length} top-level).`)

  // --- Home global: add a "Coup de cœur" rail + a 4th coffret, without
  // touching anything else already configured there. ---
  const home = await payload.findGlobal({ slug: 'home' })

  const existingProducts = await payload.find({
    collection: 'products',
    limit: 200,
    pagination: false,
    where: { name: { in: COUP_DE_COEUR_PRODUCT_NAMES } },
  })
  const productIdByName = new Map(existingProducts.docs.map((p) => [p.name, p.id]))
  const coupDeCoeurProductIds = COUP_DE_COEUR_PRODUCT_NAMES.map((n) => productIdByName.get(n)).filter(
    (id): id is number => typeof id === 'number',
  )

  const existingRails = ((home.rails as { key: string }[]) || []).filter((r) => r.key !== COUP_DE_COEUR_KEY)
  const bestIndex = existingRails.findIndex((r) => r.key === 'best')
  const newRail = {
    key: COUP_DE_COEUR_KEY,
    eyebrow: 'Nos coups de cœur',
    title: "Ce qu'on adore en ce moment",
    subtitle: "La sélection de l'équipe, tous rayons confondus.",
    products: coupDeCoeurProductIds,
  }
  const nextRails =
    bestIndex === -1
      ? [...existingRails, newRail]
      : [...existingRails.slice(0, bestIndex + 1), newRail, ...existingRails.slice(bestIndex + 1)]

  const babyMedia = await payload.find({ collection: 'media', limit: 1, where: { alt: { equals: 'baby' } } })
  const babyMediaId = babyMedia.docs[0]?.id

  const existingCoffrets = ((home.coffrets as { title: string }[]) || []).filter((c) => c.title !== FOURTH_COFFRET_TITLE)
  const nextCoffrets = [
    ...existingCoffrets,
    {
      tag: 'Idée cadeau',
      title: FOURTH_COFFRET_TITLE,
      sub: 'Une sélection tendre pour les futures et jeunes mamans, prête à offrir.',
      price: 349,
      priceFrom: true,
      image: babyMediaId,
      toast: 'Coffret Bébé & Maman ajouté au panier 🎁',
    },
  ]

  await payload.updateGlobal({ slug: 'home', data: { coffrets: nextCoffrets, rails: nextRails } })
  payload.logger.info(
    `Home global updated: rail "${COUP_DE_COEUR_KEY}" (${coupDeCoeurProductIds.length} products), coffrets now ${nextCoffrets.length}.`,
  )

  process.exit(0)
}

run().catch((err) => {
  console.error('Wireframe content update failed:', err)
  process.exit(1)
})
