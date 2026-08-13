/**
 * One-time migration of the Para d'Hiver storefront's original hardcoded
 * content (frontend/data/*.ts) into Payload, so the client can edit it from
 * the admin UI instead of code. Safe to re-run: it wipes and recreates the
 * managed collections/globals each time rather than accumulating duplicates.
 *
 * Usage: npm run seed
 */
import 'dotenv/config'

import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '../payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(dirname, '../../../frontend/public/assets')

const IMG_FILES = {
  arbre: 'arbre-marques.png',
  arbre2: 'arbre-hiver.png',
  baby: 'baby.png',
  cheveux: 'cheveux.png',
  coffret: 'coffrets.png',
  coffret2: 'coffret-hall.png',
  complements: 'complements.png',
  corps: 'nuxe-solaire.jpg',
  dermo: 'dermo.png',
  maquillage: 'maquillage.png',
  solaire: 'solaire.png',
  solaire2: 'solaire-elite.png',
  visage: 'visage.png',
} as const
type ImgKey = keyof typeof IMG_FILES

const BRANDS_IN_MARQUEE_ORDER = [
  'La Roche-Posay',
  'Avène',
  'Bioderma',
  'Vichy',
  'CeraVe',
  'Uriage',
  'Nuxe',
  'Klorane',
  'Ducray',
  'Mustela',
  'Lierac',
  'SVR',
] as const

const CATALOGUE_BRAND_NAMES = [
  'La Roche-Posay',
  'Avène',
  'Bioderma',
  'CeraVe',
  'Vichy',
  'Uriage',
  'Nuxe',
  'Klorane',
  'Ducray',
  'Mustela',
] as const

const RAW_PRODUCTS = [
  {
    id: 1,
    brand: 'La Roche-Posay',
    name: 'Effaclar Gel Moussant Purifiant',
    size: '400 ml',
    price: 119,
    old: 149,
    cat: 'Visage',
    badge: '−20%',
    rating: 5,
    reviews: 112,
    tint: '#E7EFF3',
    desc: "Nettoyant purifiant pour peaux grasses à imperfections. Élimine l'excès de sébum sans agresser la barrière cutanée, formulé avec de l'eau thermale apaisante.",
    hero: 'dermo' as ImgKey,
    gallery: ['dermo', 'arbre'] as ImgKey[],
  },
  {
    id: 2,
    brand: 'Avène',
    name: 'Eau Thermale Spray Apaisante',
    size: '300 ml',
    price: 89,
    old: 0,
    cat: 'Visage',
    badge: '',
    rating: 4,
    reviews: 340,
    tint: '#E4F1F4',
    desc: 'Apaise instantanément les peaux sensibles et réactives. Idéale après l\'exposition au froid, au vent ou après le rasage.',
    hero: 'arbre' as ImgKey,
    gallery: ['arbre', 'dermo'] as ImgKey[],
  },
  {
    id: 3,
    brand: 'CeraVe',
    name: 'Crème Hydratante Visage & Corps',
    size: '454 g',
    price: 169,
    old: 199,
    cat: 'Corps',
    badge: '−15%',
    rating: 5,
    reviews: 221,
    tint: '#EDF1F6',
    desc: "Développée avec des dermatologues, elle hydrate 24h et restaure la barrière protectrice grâce à 3 céramides essentiels et à l'acide hyaluronique.",
    hero: 'visage' as ImgKey,
    gallery: ['visage', 'corps', 'dermo'] as ImgKey[],
  },
  {
    id: 4,
    brand: 'Bioderma',
    name: 'Sensibio H2O Eau Micellaire',
    size: '500 ml',
    price: 159,
    old: 0,
    cat: 'Visage',
    badge: 'Best-seller',
    rating: 5,
    reviews: 508,
    tint: '#F2E9F2',
    desc: 'Démaquille et nettoie les peaux sensibles en un seul geste, sans rinçage. Sa formule brevetée respecte l\'équilibre de la peau.',
    hero: 'arbre2' as ImgKey,
    gallery: ['arbre2', 'dermo', 'arbre'] as ImgKey[],
  },
  {
    id: 5,
    brand: 'Vichy',
    name: 'Minéral 89 Sérum Fortifiant',
    size: '50 ml',
    price: 279,
    old: 329,
    cat: 'Visage',
    badge: '−15%',
    rating: 5,
    reviews: 187,
    tint: '#E3EEF6',
    desc: "Concentré à 89% d'eau volcanique de Vichy et d'acide hyaluronique. Fortifie la barrière cutanée et repulpe la peau jour après jour.",
    hero: 'visage' as ImgKey,
    gallery: ['visage', 'dermo', 'arbre'] as ImgKey[],
  },
  {
    id: 6,
    brand: 'Uriage',
    name: 'Bariéderm CICA-Crème Réparatrice',
    size: '100 ml',
    price: 129,
    old: 0,
    cat: 'Corps',
    badge: 'Nouveau',
    rating: 4,
    reviews: 76,
    tint: '#EAF3F0',
    desc: 'Répare et isole les zones fragilisées : gerçures, crevasses, tiraillements liés au froid. Sans parfum, testée sur peaux sensibles.',
    hero: 'complements' as ImgKey,
    gallery: ['complements', 'corps', 'dermo'] as ImgKey[],
  },
  {
    id: 7,
    brand: 'Lierac',
    name: 'Hydragenist Sérum Oxygénant',
    size: '30 ml',
    price: 299,
    old: 0,
    cat: 'Visage',
    badge: 'Nouveau',
    rating: 4,
    reviews: 54,
    tint: '#F5E8EC',
    desc: 'Repulpe et oxygène les peaux déshydratées par le froid. Texture fondante à effet immédiat de fraîcheur.',
    hero: 'visage' as ImgKey,
    gallery: ['visage', 'dermo', 'arbre'] as ImgKey[],
  },
  {
    id: 8,
    brand: 'Klorane',
    name: "Shampooing Doux à l'Avoine",
    size: '400 ml',
    price: 99,
    old: 129,
    cat: 'Cheveux',
    badge: '−23%',
    rating: 4,
    reviews: 143,
    tint: '#F5F0E3',
    desc: 'Lavages fréquents, cheveux fins et cuir chevelu sensible. Le lait d\'avoine protège la fibre et apporte de la douceur.',
    hero: 'cheveux' as ImgKey,
    gallery: ['cheveux', 'dermo'] as ImgKey[],
  },
  {
    id: 9,
    brand: 'La Roche-Posay',
    name: 'Anthelios UVMune 400 SPF50+',
    size: '50 ml',
    price: 249,
    old: 0,
    cat: 'Solaire',
    badge: 'Top',
    rating: 5,
    reviews: 298,
    tint: '#F1EBDF',
    desc: 'Très haute protection UVA ultra-longs, y compris en hiver et en altitude. Fini invisible, non collant, résistant à l\'eau.',
    hero: 'solaire' as ImgKey,
    gallery: ['solaire', 'solaire2'] as ImgKey[],
  },
  {
    id: 10,
    brand: 'Nuxe',
    name: 'Huile Prodigieuse Multi-Fonctions',
    size: '100 ml',
    price: 319,
    old: 0,
    cat: 'Corps',
    badge: 'Iconique',
    rating: 5,
    reviews: 412,
    tint: '#F6EDDD',
    desc: 'Huile sèche multi-usages visage, corps et cheveux. Nourrit, répare et sublime avec 7 huiles botaniques précieuses.',
    hero: 'corps' as ImgKey,
    gallery: ['corps', 'dermo'] as ImgKey[],
  },
  {
    id: 11,
    brand: 'Ducray',
    name: 'Kelual DS Shampooing Traitant',
    size: '100 ml',
    price: 145,
    old: 0,
    cat: 'Cheveux',
    badge: '',
    rating: 4,
    reviews: 61,
    tint: '#EDEEF5',
    desc: 'Réduit squames et démangeaisons dès la première semaine. Action kératolytique et apaisante du cuir chevelu.',
    hero: 'cheveux' as ImgKey,
    gallery: ['cheveux', 'dermo'] as ImgKey[],
  },
  {
    id: 12,
    brand: 'Mustela',
    name: 'Baume Nourrissant Bébé Peaux Sèches',
    size: '200 ml',
    price: 139,
    old: 169,
    cat: 'Baby & Mom',
    badge: '−18%',
    rating: 5,
    reviews: 88,
    tint: '#F3EEF7',
    desc: "Nourrit intensément les peaux très sèches des tout-petits. Avocat Perseose breveté, 98% d'ingrédients d'origine naturelle.",
    hero: 'baby' as ImgKey,
    gallery: ['baby', 'dermo'] as ImgKey[],
  },
] as const

const RAW_SERVICES = [
  {
    title: 'Diagnostic de peau',
    sub: "Analyse complète du teint, de l'hydratation et de la sensibilité, avec une routine sur mesure.",
    price: 0,
    duration: '30 min',
    expert: 'Pharmacien',
    bg: '#EFE6F3',
    icon: 'ScanFace',
    img: 'dermo' as ImgKey,
    desc: "Un bilan cutané complet réalisé par un pharmacien : mesure de l'hydratation, analyse de la sensibilité et des zones à imperfections. Vous repartez avec une routine écrite, adaptée à votre peau et à votre budget.",
    benefits: [
      'Bilan objectif de votre type de peau',
      'Routine matin et soir écrite',
      "Recommandations produits sans obligation d'achat",
      'Suivi à 6 semaines offert',
    ],
    steps: [
      { title: 'Questionnaire', sub: 'Habitudes, sensibilités, traitements en cours.' },
      { title: 'Mesures', sub: 'Hydratation, sébum et sensibilité par zone.' },
      { title: 'Analyse', sub: 'Lecture des résultats avec le pharmacien.' },
      { title: 'Routine', sub: 'Prescription cosmétique remise par écrit.' },
    ],
  },
  {
    title: 'Soin du visage éclat',
    sub: 'Nettoyage profond, gommage doux et masque hydratant adaptés aux peaux sensibles.',
    price: 299,
    duration: '45 min',
    expert: 'Esthéticienne',
    bg: '#F5E8EC',
    icon: 'Droplet',
    img: 'visage' as ImgKey,
    desc: 'Un protocole en cabine pensé pour les peaux fatiguées par le froid : double nettoyage, exfoliation enzymatique, massage drainant et masque hydratant. Sans parfum, adapté aux peaux réactives.',
    benefits: [
      'Teint visiblement plus lumineux',
      'Peau repulpée et confortable',
      'Protocole sans parfum ni alcool',
      'Convient aux peaux réactives',
    ],
    steps: [
      { title: 'Double nettoyage', sub: 'Huile démaquillante puis gel doux.' },
      { title: 'Exfoliation', sub: 'Gommage enzymatique sans grains.' },
      { title: 'Massage', sub: 'Drainage visage et cou, 10 minutes.' },
      { title: 'Masque', sub: 'Masque hydratant + soin de finition.' },
    ],
  },
  {
    title: 'Soin capillaire',
    sub: 'Diagnostic du cuir chevelu et soin ciblé chute, pellicules ou cheveux abîmés.',
    price: 199,
    duration: '40 min',
    expert: 'Experte cheveux',
    bg: '#F5F0E3',
    icon: 'Scissors',
    img: 'cheveux' as ImgKey,
    desc: 'Diagnostic du cuir chevelu à la caméra, puis soin traitant appliqué en cabine : lotion anti-chute, protocole anti-pellicules ou masque de reconstruction selon le besoin identifié.',
    benefits: [
      'Diagnostic caméra du cuir chevelu',
      'Soin traitant appliqué en cabine',
      'Protocole à poursuivre à la maison',
      "Suivi photo d'une séance à l'autre",
    ],
    steps: [
      { title: 'Diagnostic', sub: 'Caméra cuir chevelu et fibre.' },
      { title: 'Nettoyage', sub: 'Shampooing adapté au diagnostic.' },
      { title: 'Soin', sub: 'Application du traitement ciblé.' },
      { title: 'Conseils', sub: 'Routine et fréquence recommandées.' },
    ],
  },
  {
    title: 'Conseil maquillage',
    sub: 'Teint, correction et sélection de produits adaptés à votre carnation.',
    price: 249,
    duration: '45 min',
    expert: 'Make-up artist',
    bg: '#F3EEF7',
    icon: 'Palette',
    img: 'maquillage' as ImgKey,
    desc: 'Une séance pour trouver la bonne teinte de fond de teint et apprendre des gestes simples : correction des rougeurs, sublimation du regard, tenue longue durée. Le montant est déduit de vos achats du jour.',
    benefits: [
      'Recherche de teinte en lumière neutre',
      'Gestes simples à reproduire seule',
      'Déduit de vos achats du jour',
      'Sélection adaptée aux peaux sensibles',
    ],
    steps: [
      { title: 'Analyse', sub: 'Carnation, sous-ton et attentes.' },
      { title: 'Teint', sub: 'Test de 2 à 3 teintes en lumière du jour.' },
      { title: 'Démonstration', sub: 'Application guidée sur un demi-visage.' },
      { title: 'Sélection', sub: 'Liste des produits testés.' },
    ],
  },
  {
    title: 'Épilation',
    sub: 'Cire tiède hypoallergénique, protocole apaisant avant et après séance.',
    price: 99,
    duration: '20 min',
    expert: 'Esthéticienne',
    bg: '#EAF3F0',
    icon: 'Feather',
    img: 'arbre' as ImgKey,
    desc: 'Épilation à la cire tiède hypoallergénique, précédée d\'un nettoyage antiseptique doux et suivie d\'un soin apaisant post-épilation pour limiter rougeurs et poils incarnés.',
    benefits: [
      'Cire tiède hypoallergénique',
      'Soin apaisant post-épilation inclus',
      'Zones visage et corps',
      'Conseils anti-poils incarnés',
    ],
    steps: [
      { title: 'Préparation', sub: 'Nettoyage antiseptique de la zone.' },
      { title: 'Épilation', sub: 'Cire tiède, travail par bandes.' },
      { title: 'Apaisement', sub: 'Soin calmant et rafraîchissant.' },
      { title: 'Conseils', sub: 'Gommage et hydratation à domicile.' },
    ],
  },
  {
    title: 'Atelier future maman',
    sub: 'Routine grossesse et post-partum, sélection de soins sûrs pour vous et bébé.',
    price: 0,
    duration: '60 min',
    expert: 'Pharmacienne',
    bg: '#F2E9F2',
    icon: 'Baby',
    img: 'baby' as ImgKey,
    desc: "Un atelier en petit comité pour composer une routine sûre pendant la grossesse et l'allaitement : ingrédients à éviter, vergetures, peau du nourrisson et premiers gestes d'hygiène.",
    benefits: [
      'Liste d\'ingrédients à éviter',
      'Routine vergetures et tiraillements',
      'Soins bébé validés pédiatrie',
      'Atelier en petit groupe (6 personnes)',
    ],
    steps: [
      { title: 'Accueil', sub: 'Tour de table et attentes.' },
      { title: 'Ingrédients', sub: "Ce qu'on évite, ce qu'on garde." },
      { title: 'Routine', sub: 'Corps, visage et soins bébé.' },
      { title: 'Questions', sub: 'Échange libre avec la pharmacienne.' },
    ],
  },
] as const

// Navbar/mega-menu taxonomy. Level 0 = navbar entries, level 1 = mega-menu
// columns, level 2 = items inside a column. "Services" is intentionally
// excluded — it stays a plain top-level nav link outside this CMS taxonomy.
// Matches the client-supplied wireframe's nav row (see
// scripts/update-wireframe-content.ts, which applied this non-destructively
// to the live DB — kept in sync here so a future full reseed matches too).
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

// Store 1 is the client's real details. Store 2 and both stores' opening
// hours are clearly-marked placeholders — the client asked for these
// specifically so she can fill them in herself from the admin later.
const RAW_STORES = [
  {
    address: '4A Allée des Amandiers, Aïn Sebaâ, Casablanca 20000',
    email: 'paradhiver@gmail.com',
    hours: [{ days: 'Horaires à compléter', hours: '—' }],
    mapUrl: '',
    name: "Para d'Hiver — Aïn Sebaâ",
    phone: '06 19 96 90 07',
  },
  {
    address: 'Adresse à compléter',
    email: '',
    hours: [{ days: 'Horaires à compléter', hours: '—' }],
    mapUrl: '',
    name: "Para d'Hiver — Magasin 2 (à compléter)",
    phone: 'Téléphone à compléter',
  },
] as const

async function run() {
  const payload = await getPayload({ config })
  payload.logger.info('Seeding Para d\'Hiver content...')

  // --- Wipe managed collections so re-running this script doesn't duplicate data ---
  // Globals first, emptied out: they hold relationships into products/media
  // that would otherwise block deleting the docs those relationships point to.
  await payload.updateGlobal({
    slug: 'home',
    data: {
      brands: [],
      campaignProducts: [],
      coffrets: [],
      ctaPair1: [],
      ctaPair2: [],
      dermoPicks: [],
      heroSlides: [],
      rails: [],
      reviewBars: [],
      sampleReviews: [],
      trustBadges: [],
    },
  })
  await payload.updateGlobal({ slug: 'collections-page', data: { cards: [] } })
  await payload.updateGlobal({
    slug: 'catalogue-page',
    data: {
      brands: [],
      editorialTiles: [],
      featuredTile: {},
      guide: {},
      needs: [],
      quickFilters: [],
      seoIntro: {},
      tagToCategory: [],
    },
  })

  for (const collection of ['products', 'services', 'brands', 'categories', 'stores', 'media'] as const) {
    const { docs } = await payload.find({ collection, limit: 1000, pagination: false })
    for (const doc of docs) {
      await payload.delete({ collection, id: doc.id })
    }
  }

  // --- Media ---
  const mediaByKey = new Map<ImgKey, number>()
  for (const [key, filename] of Object.entries(IMG_FILES) as [ImgKey, string][]) {
    const existing = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { equals: filename } },
    })
    const doc =
      existing.docs[0] ??
      (await payload.create({
        collection: 'media',
        data: { alt: key },
        filePath: path.join(assetsDir, filename),
      }))
    mediaByKey.set(key, doc.id as number)
  }
  const img = (key: ImgKey) => mediaByKey.get(key)!
  payload.logger.info(`Media: ${mediaByKey.size} images ready.`)

  // --- Brands ---
  const brandByName = new Map<string, number>()
  for (const name of BRANDS_IN_MARQUEE_ORDER) {
    const doc = await payload.create({ collection: 'brands', data: { name } })
    brandByName.set(name, doc.id as number)
  }
  payload.logger.info(`Brands: ${brandByName.size} created.`)

  // --- Categories (navbar / mega menu) ---
  let categoryCount = 0
  for (let i = 0; i < CATEGORY_TREE.length; i++) {
    const top = CATEGORY_TREE[i]
    const topDoc = await payload.create({
      collection: 'categories',
      data: { isActive: true, name: top.name, order: i },
    })
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
  payload.logger.info(`Categories: ${categoryCount} created.`)

  // --- Stores ---
  for (let i = 0; i < RAW_STORES.length; i++) {
    const s = RAW_STORES[i]
    await payload.create({
      collection: 'stores',
      data: {
        address: s.address,
        email: s.email || undefined,
        hours: s.hours.map((h) => ({ ...h })),
        mapUrl: s.mapUrl || undefined,
        name: s.name,
        order: i,
        phone: s.phone,
      },
    })
  }
  payload.logger.info(`Stores: ${RAW_STORES.length} created.`)

  // --- Products ---
  const productByLegacyId = new Map<number, number>()
  for (const p of RAW_PRODUCTS) {
    const doc = await payload.create({
      collection: 'products',
      data: {
        badges: p.badge ? [{ enabled: true, type: 'custom' as const, text: p.badge }] : [],
        brand: brandByName.get(p.brand)!,
        category: p.cat,
        description: p.desc,
        gallery: p.gallery.map((key) => ({ image: img(key) })),
        image: img(p.hero),
        isPublished: true,
        name: p.name,
        oldPrice: p.old || undefined,
        price: p.price,
        rating: p.rating,
        reviews: p.reviews,
        size: p.size,
        stock: 50,
        tint: p.tint,
      },
    })
    productByLegacyId.set(p.id, doc.id as number)
  }
  payload.logger.info(`Products: ${productByLegacyId.size} created.`)
  const product = (legacyId: number) => productByLegacyId.get(legacyId)!

  // --- Services ---
  for (const s of RAW_SERVICES) {
    await payload.create({
      collection: 'services',
      data: {
        benefits: s.benefits.map((text) => ({ text })),
        bg: s.bg,
        description: s.desc,
        duration: s.duration,
        expert: s.expert,
        icon: s.icon,
        image: img(s.img),
        price: s.price,
        steps: s.steps.map((step) => ({ ...step })),
        subtitle: s.sub,
        title: s.title,
      },
    })
  }
  payload.logger.info(`Services: ${RAW_SERVICES.length} created.`)

  // --- Home global ---
  await payload.updateGlobal({
    slug: 'home',
    data: {
      brands: BRANDS_IN_MARQUEE_ORDER.map((name) => brandByName.get(name)!),
      campaignProducts: [12, 6, 3, 2, 10, 4].map(product),
      coffrets: [
        {
          image: img('coffret'),
          price: 549,
          priceFrom: false,
          sub: 'Nettoyant doux, sérum hydratant et baume réparateur, dans une boîte cadeau.',
          tag: 'Édition limitée',
          title: "Coffret Rituel d'Hiver",
          toast: "Coffret Rituel d'Hiver ajouté au panier",
        },
        {
          image: img('coffret2'),
          price: 319,
          priceFrom: false,
          sub: 'Le duo eau thermale + cicaplast, pour les peaux réactives.',
          tag: 'Best-seller',
          title: 'Coffret Peau Sensible',
          toast: 'Coffret Peau Sensible ajouté au panier',
        },
        {
          image: img('corps'),
          price: 200,
          priceFrom: true,
          sub: 'De 200 à 2 000 MAD, valable en ligne et en institut.',
          tag: 'Nouveau',
          title: 'Carte cadeau',
          toast: 'Carte cadeau ajoutée au panier',
        },
      ],
      ctaPair1: [
        { bg: '#EFE6F3', eyebrow: 'Dermocosmétique', image: img('dermo'), title: 'Prenez soin de votre peau' },
        { bg: '#E4F1F4', eyebrow: 'Cheveux', image: img('cheveux'), title: 'Révélez la beauté de vos cheveux' },
      ],
      ctaPair2: [
        { bg: '#F2E9F2', eyebrow: 'Visage', image: img('maquillage'), title: 'Une routine adaptée à votre peau' },
        { bg: '#F5F0E3', eyebrow: 'Corps', image: img('complements'), title: 'Des soins pour chaque moment' },
      ],
      dermoPicks: [
        { actif: 'Acide hyaluronique', claim: 'Barrière cutanée fortifiée', product: product(5) },
        { actif: 'Zinc PCA', claim: 'Peaux grasses à imperfections', product: product(1) },
        { actif: 'Céramides', claim: 'Hydratation 24 h', product: product(3) },
        { actif: 'Cica', claim: 'Zones fragilisées, gerçures', product: product(6) },
        { actif: 'UVMune 400', claim: 'Très haute protection UVA', product: product(9) },
      ],
      freeShippingThreshold: 399,
      heroSlides: [
        {
          bg: 'linear-gradient(120deg,#2f1f3d,#5E4074 60%,#4b3563)',
          cta: 'Découvrir',
          image: img('visage'),
          sub: "Sélection dermatologique testée par nos pharmaciens : barrière cutanée, froid, vent et lumière bleue.",
          tag: 'Édition hiver',
          title: "La peau protégée, tout l'hiver",
        },
        {
          bg: 'linear-gradient(120deg,#123a44,#008AA5 65%,#0d5f70)',
          cta: 'Voir les offres',
          image: img('solaire'),
          sub: "Sérums, crèmes et nettoyants des grandes marques dermatologiques à prix réduits, jusqu'à dimanche.",
          tag: "Jusqu'à −50%",
          title: 'Ventes flash soins visage',
        },
        {
          bg: 'linear-gradient(120deg,#3a3324,#5b4e33 60%,#373020)',
          cta: 'Composer ma routine',
          image: img('corps'),
          sub: 'Baumes, huiles sèches et cicatrisants pour les peaux très sèches. Formules sans parfum.',
          tag: 'Nouveauté',
          title: 'Rituel corps nutrition intense',
        },
      ],
      // No instagramPosts here: real posts sync automatically from
      // @paradhiver into the "Instagram Posts" collection (see
      // src/lib/instagramSync.ts) — never mock/demo images.
      rails: [
        {
          editorialImage: img('arbre'),
          eyebrow: 'Sélection du moment',
          key: 'saison',
          products: [1, 3, 5, 2, 6, 9, 10, 4].map(product),
          subtitle: 'Découvrez notre sélection pensée pour prendre soin de vous au quotidien.',
          title: 'Les essentiels de la saison',
        },
        {
          brandFeature: {
            bg: '#E7EFF3',
            desc: "Recommandée par plus de 90 000 dermatologues dans le monde. Des formules minimalistes à l'eau thermale, pensées pour les peaux les plus sensibles.",
            image: img('dermo'),
            name: 'LA ROCHE-POSAY',
          },
          eyebrow: 'Nouveautés',
          key: 'nouveautes',
          products: [7, 6, 12, 11, 9, 2, 5, 8].map(product),
          subtitle: 'Les dernières références entrées en pharmacie.',
          title: 'Les nouveautés à découvrir',
        },
        {
          brandFeature: {
            bg: '#E4F1F4',
            desc: "L'eau thermale d'Avène, apaisante et anti-irritante, au cœur de soins simples pour les peaux réactives — du nettoyant au solaire.",
            image: img('arbre'),
            name: 'AVÈNE',
          },
          eyebrow: 'Best sellers',
          key: 'best',
          products: [4, 10, 9, 1, 3, 5, 2, 12].map(product),
          subtitle: 'Les produits préférés de nos clientes et clients cette saison.',
          title: 'Les meilleures ventes',
        },
      ],
      reviewBars: [
        { n: '5', pct: 72 },
        { n: '4', pct: 19 },
        { n: '3', pct: 6 },
        { n: '2', pct: 2 },
        { n: '1', pct: 1 },
      ],
      sampleReviews: [
        {
          date: 'il y a 3 jours',
          name: 'Salma B.',
          stars: 5,
          text: "Texture très légère, ma peau ne tiraille plus du tout depuis le début de l'hiver. Je rachèterai.",
        },
        {
          date: 'il y a 2 semaines',
          name: 'Yasmine E.',
          stars: 5,
          text: 'Conseillé par la pharmacienne pour ma peau réactive : aucune rougeur, et la livraison à Casablanca était rapide.',
        },
        {
          date: 'le mois dernier',
          name: 'Nabil R.',
          stars: 4,
          text: "Efficace, mais j'aurais aimé un format plus grand. Le flacon pompe est pratique au quotidien.",
        },
      ],
      trustBadges: [
        { icon: 'Truck', sub: '24h à Casablanca', title: 'Livraison partout au Maroc' },
        { icon: 'ShieldCheck', sub: 'CMI, carte ou à la livraison', title: 'Paiement 100% sécurisé' },
        { icon: 'BadgeCheck', sub: 'Circuit pharmaceutique', title: 'Produits authentiques' },
        { icon: 'Headset', sub: 'Pharmaciens 7j/7', title: 'Service client expert' },
      ],
    },
  })
  payload.logger.info('Home global updated.')

  // --- Collections page global ---
  await payload.updateGlobal({
    slug: 'collections-page',
    data: {
      cards: [
        {
          count: '24 produits',
          image: img('visage'),
          sub: 'Nettoyer, réparer, protéger : la routine froid et vent.',
          title: "Rituel d'hiver",
        },
        {
          count: '38 produits',
          image: img('dermo'),
          sub: 'Formules minimalistes, sans parfum, testées sous contrôle dermatologique.',
          title: 'Peaux sensibles',
        },
        {
          count: '31 produits',
          image: img('cheveux'),
          sub: 'Chute, pellicules, longueurs abîmées : protocoles ciblés.',
          title: 'Cheveux & cuir chevelu',
        },
        {
          count: '18 produits',
          image: img('solaire'),
          sub: 'SPF 50+ visage et corps, y compris en altitude.',
          title: 'Solaire toute l\'année',
        },
        {
          count: '27 produits',
          image: img('baby'),
          sub: 'Grossesse, post-partum et peau des tout-petits.',
          title: 'Bébé & maman',
        },
        {
          count: '12 coffrets',
          image: img('coffret'),
          sub: 'Rituels prêts à offrir, emballés à la main.',
          title: 'Coffrets & cadeaux',
        },
      ],
    },
  })
  payload.logger.info('Collections page global updated.')

  // --- Catalogue page global ---
  await payload.updateGlobal({
    slug: 'catalogue-page',
    data: {
      brands: CATALOGUE_BRAND_NAMES.map((name) => brandByName.get(name)!),
      editorialTiles: [
        { image: img('visage'), sub: 'Les dernières références en rayon', title: 'Nouveautés' },
        { image: img('arbre'), sub: 'Formules sans parfum', title: 'Peaux sensibles' },
        { image: img('coffret'), sub: 'Prêts à offrir', title: 'Coffrets' },
      ],
      featuredTile: {
        image: img('dermo'),
        sub: 'Les marques prescrites en pharmacie, à prix parapharmacie.',
        title: 'Le rayon dermocosmétique',
      },
      guide: {
        body: "Peau sèche, mixte ou réactive : nos pharmaciens décryptent les textures, les actifs à privilégier en hiver et les associations à éviter avec un traitement dermatologique.",
        cta: 'Lire le guide',
        eyebrow: "Guide d'achat",
        image: img('visage'),
        title: 'Comment choisir sa crème hydratante ?',
      },
      needs: [
        { icon: 'Droplets', sub: 'Baumes riches, céramides et huiles nourrissantes.', title: 'Peau sèche & tiraillements' },
        { icon: 'Sparkles', sub: 'Zinc, acide salicylique et nettoyants purifiants.', title: 'Imperfections' },
        { icon: 'Star', sub: 'Rétinol, vitamine C et peptides, progressivement.', title: 'Anti-âge & fermeté' },
        { icon: 'ListChecks', sub: 'Trois gestes validés par nos pharmaciens.', title: 'Routine complète' },
      ],
      quickFilters: [
        '−25% sélection soin',
        'Nouveautés',
        'Meilleures ventes',
        'Exclusivités pharmacie',
        'Minis & formats voyage',
        'Coffrets',
        'Peaux sensibles',
        'Anti-âge',
        'Hydratation',
        'Bio & naturel',
        'Sans parfum',
        'Solaire SPF 50+',
      ].map((label) => ({ label })),
      seoIntro: {
        eyebrow: 'Le conseil Para d\'Hiver',
        paragraphs: [
          {
            text: "Une routine efficace tient en trois gestes : un nettoyant adapté à votre type de peau, un soin hydratant riche en céramides ou en acide hyaluronique, et une protection solaire portée toute l'année. En hiver, le froid et le vent fragilisent la barrière cutanée : privilégiez les textures baume et les formules sans parfum.",
          },
          {
            text: 'Tous les produits vendus sur Para d\'Hiver proviennent du circuit pharmaceutique officiel et sont contrôlés par notre équipe de pharmaciens. Un doute sur une association d\'actifs, une grossesse en cours ou un traitement dermatologique ? Nos pharmaciens répondent gratuitement, 7j/7.',
          },
        ],
        title: 'Bien choisir sa parapharmacie en ligne',
      },
      tagToCategory: [
        { category: 'Visage', tag: 'Nettoyants visage' },
        { category: 'Visage', tag: 'Sérums' },
        { category: 'Visage', tag: 'Crèmes de jour' },
        { category: 'Visage', tag: 'Contour des yeux' },
        { category: 'Corps', tag: 'Baumes corps' },
        { category: 'Cheveux', tag: 'Shampooings traitants' },
        { category: 'Solaire', tag: 'Écrans solaires' },
        { category: 'Corps', tag: 'Compléments' },
        { category: 'Visage', tag: 'Peaux sensibles' },
        { category: 'Corps', tag: 'Peaux sèches' },
        { category: 'Visage', tag: 'Imperfections' },
        { category: 'Visage', tag: 'Anti-âge' },
        { category: 'Visage', tag: 'Rougeurs' },
        { category: 'Cheveux', tag: 'Chute de cheveux' },
        { category: 'Baby & Mom', tag: 'Grossesse' },
        { category: 'Baby & Mom', tag: 'Bébé' },
        { category: 'Corps', tag: 'Peau sèche & tiraillements' },
        { tag: 'Routine complète' },
      ],
    },
  })
  payload.logger.info('Catalogue page global updated.')

  payload.logger.info('Seed complete.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
