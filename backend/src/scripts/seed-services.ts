/**
 * Loads the institute's real price list into Services: one Service per
 * family (Cheveux, Ongles, Épilation…), each with every prestation and its
 * price, and a photograph of that service.
 *
 * Replaces whatever services exist. Safe to re-run: services are wiped and
 * recreated, and a photo already in Media (same filename) is reused rather
 * than uploaded twice.
 *
 * Photos are CC0 / public domain (rawpixel, StockSnap), read from the folder
 * given as SERVICE_PHOTOS_DIR, named service-<slug>.jpg.
 *
 * Usage: SERVICE_PHOTOS_DIR=/path/to/photos npm run seed:services
 */
import 'dotenv/config'

import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../payload.config'

type Line = { label: string; price?: number; fromPrice?: boolean }

type ServiceSeed = {
  photo: string
  title: string
  subtitle: string
  description: string
  duration: string
  expert: string
  bg: string
  icon: 'Baby' | 'Feather' | 'Palette' | 'ScanFace' | 'Scissors' | 'Droplet'
  benefits: string[]
  steps: { title: string; sub: string }[]
  priceList: Line[]
}

const SERVICES: ServiceSeed[] = [
  {
    photo: 'cheveux',
    title: 'Cheveux',
    subtitle: 'Coupe, coloration, mèches, balayage et coiffage par nos coiffeuses.',
    description:
      "Coupe, couleur, mèches, balayage, brushing ou coiffure d'événement : nos coiffeuses prennent le temps du conseil avant chaque prestation, et utilisent des produits professionnels adaptés à votre type de cheveux.",
    duration: '20 min – 3 h',
    expert: 'Coiffeuse',
    bg: '#F3ECE6',
    icon: 'Scissors',
    benefits: [
      'Conseil couleur et coupe avant la prestation',
      'Produits professionnels',
      "Coiffures d'événement sur demande",
    ],
    steps: [
      { title: 'Conseil', sub: 'On définit ensemble le résultat souhaité.' },
      { title: 'Shampoing', sub: 'Adapté à votre cuir chevelu.' },
      { title: 'Prestation', sub: 'Coupe, couleur ou coiffage.' },
      { title: 'Finition', sub: 'Brushing ou mise en forme.' },
    ],
    priceList: [
      { label: 'Mèches', price: 400 },
      { label: 'Racines mèches', price: 200 },
      { label: 'Ombré', price: 800 },
      { label: 'Application coloration', price: 100 },
      { label: 'Coloration racines', price: 150 },
      { label: 'Coloration', price: 300 },
      { label: 'Balayage', price: 500 },
      { label: 'Rinçage', price: 150 },
      { label: 'Coupe', price: 50 },
      { label: 'Pointes', price: 20 },
      { label: 'Shampoing spécial', price: 20 },
      { label: 'Shampoing', price: 15 },
      { label: 'Touching', price: 20 },
      { label: 'Brushing', price: 35, fromPrice: true },
      { label: 'Wavy', price: 80 },
      { label: 'Babyliss', price: 100 },
      { label: 'Demi-coiffure', price: 150 },
      { label: 'Chignon' },
      { label: 'Coupe frange', price: 20 },
    ],
  },
  {
    photo: 'bar-a-soins',
    title: 'Bar à soins',
    subtitle: 'Soins profonds pour cheveux secs, abîmés ou fragilisés.',
    description:
      "Un soin choisi selon l'état de vos cheveux et de votre cuir chevelu : hydratation, réparation des longueurs ou soin anti-chute. Le soin complet associe plusieurs étapes pour un résultat plus durable.",
    duration: '30 – 90 min',
    expert: 'Coiffeuse',
    bg: '#EAF3F0',
    icon: 'Droplet',
    benefits: [
      'Diagnostic du cheveu et du cuir chevelu',
      'Soin adapté : hydratant, réparateur ou anti-chute',
      'Conseils pour prolonger le soin à la maison',
    ],
    steps: [
      { title: 'Diagnostic', sub: 'État des longueurs et du cuir chevelu.' },
      { title: 'Soin', sub: 'Application et temps de pose.' },
      { title: 'Rinçage', sub: 'Puis séchage ou brushing.' },
    ],
    priceList: [
      { label: 'Soin cheveux express', price: 150 },
      { label: 'Soin cheveux hydratant', price: 200 },
      { label: 'Soin cheveux réparateur', price: 250 },
      { label: 'Soin complet', price: 450 },
      { label: 'Soin anti-chute', price: 300 },
    ],
  },
  {
    photo: 'lissage',
    title: 'Lissage',
    subtitle: 'Des cheveux lisses, disciplinés et brillants pendant des semaines.',
    description:
      "Un lissage longue durée qui discipline les frisottis et facilite le coiffage au quotidien. Le tarif dépend de la longueur et de l'épaisseur des cheveux : il est confirmé avant la prestation.",
    duration: '2 – 4 h',
    expert: 'Coiffeuse',
    bg: '#F2E9F2',
    icon: 'Scissors',
    benefits: [
      'Cheveux lisses et brillants',
      'Coiffage plus rapide au quotidien',
      'Tarif confirmé avant de commencer',
    ],
    steps: [
      { title: 'Conseil', sub: 'Longueur, épaisseur et tarif.' },
      { title: 'Application', sub: 'Mèche par mèche.' },
      { title: 'Lissage', sub: 'Au fer, pour fixer le soin.' },
    ],
    priceList: [{ label: 'Lissage', price: 600, fromPrice: true }],
  },
  {
    photo: 'soins-visage',
    title: 'Soins de visage',
    subtitle: 'Nettoyage, éclat et Hydrafacial pour une peau nette et lumineuse.',
    description:
      "Du nettoyage de base au soin Hydrafacial, chaque soin commence par l'observation de votre peau pour choisir les bons produits. Le modelage peut s'ajouter à n'importe quel soin.",
    duration: '30 – 75 min',
    expert: 'Esthéticienne',
    bg: '#F3ECE6',
    icon: 'ScanFace',
    benefits: [
      'Soin choisi selon votre type de peau',
      'Hydrafacial disponible',
      'Conseils de routine à la maison',
    ],
    steps: [
      { title: 'Démaquillage', sub: 'Et observation de la peau.' },
      { title: 'Nettoyage', sub: 'Gommage et extraction si besoin.' },
      { title: 'Soin', sub: 'Masque et sérum adaptés.' },
      { title: 'Finition', sub: 'Hydratation et protection.' },
    ],
    priceList: [
      { label: 'Soin basic nettoyant', price: 250 },
      { label: 'Soin spécifique éclat', price: 400 },
      { label: 'Soin Hydrafacial', price: 500 },
      { label: 'Modelage', price: 100 },
    ],
  },
  {
    photo: 'ongles',
    title: 'Ongles',
    subtitle: 'Manucure, pédicure, vernis permanent, gel et faux ongles.',
    description:
      'Manucure et pédicure classiques ou spa, vernis permanent, gel, BIAB et faux ongles, avec ou sans design. Le matériel est désinfecté entre chaque cliente.',
    duration: '15 – 90 min',
    expert: 'Prothésiste ongulaire',
    bg: '#F2E9F2',
    icon: 'Palette',
    benefits: [
      'Matériel désinfecté entre chaque cliente',
      'Large choix de couleurs',
      'Designs sur demande',
    ],
    steps: [
      { title: 'Préparation', sub: 'Limage et soin des cuticules.' },
      { title: 'Pose', sub: 'Vernis, gel ou faux ongles.' },
      { title: 'Finition', sub: 'Top coat et huile nourrissante.' },
    ],
    priceList: [
      { label: 'Manucure', price: 70 },
      { label: 'Manucure spa', price: 90 },
      { label: 'Pédicure', price: 100 },
      { label: 'Pédicure spa', price: 140 },
      { label: 'Vernis permanent', price: 100 },
      { label: 'Pose vernis', price: 40 },
      { label: 'BIAB + manucure', price: 200 },
      { label: 'Faux ongles', price: 80 },
      { label: 'Dépose', price: 50 },
      { label: 'Gel', price: 250 },
      { label: 'Remplissage gel', price: 80 },
      { label: 'Design', price: 10 },
      { label: 'Pose French', price: 15 },
    ],
  },
  {
    photo: 'cils-sourcils',
    title: 'Cils et sourcils',
    subtitle: 'Extensions cil à cil, cils en soie et teinture des sourcils.',
    description:
      "Des cils plus longs et un regard intensifié, du plus naturel au plus marqué : extensions cil à cil, faux cils ou cils en soie, et teinture pour des sourcils mieux dessinés.",
    duration: '15 min – 2 h',
    expert: 'Esthéticienne',
    bg: '#EAF3F0',
    icon: 'ScanFace',
    benefits: [
      'Du naturel au plus intense',
      'Pose adaptée à la forme de vos yeux',
      'Teinture des sourcils',
    ],
    steps: [
      { title: 'Conseil', sub: "Longueur et effet souhaités." },
      { title: 'Pose', sub: 'Les yeux fermés, allongée.' },
      { title: 'Conseils', sub: "Pour l'entretien les jours suivants." },
    ],
    priceList: [
      { label: 'Faux cils cil à cil', price: 70 },
      { label: 'Faux cils normaux', price: 30 },
      { label: 'Cils en soie', price: 300 },
      { label: 'Teinture sourcils', price: 20 },
    ],
  },
  {
    photo: 'make-up',
    title: 'Make-up',
    subtitle: 'Maquillage de jour, invitée ou mariée, avec ou sans pose de cils.',
    description:
      "Un maquillage pensé pour l'occasion et votre carnation : naturel pour la journée, plus travaillé pour une invitée, et le maquillage mariée pour le grand jour.",
    duration: '45 min – 2 h',
    expert: 'Maquilleuse',
    bg: '#F3ECE6',
    icon: 'Palette',
    benefits: [
      'Adapté à votre carnation et à votre tenue',
      'Tenue longue durée',
      'Maquillage mariée sur rendez-vous',
    ],
    steps: [
      { title: 'Préparation', sub: 'Soin et base de teint.' },
      { title: 'Teint', sub: 'Fond de teint et correction.' },
      { title: 'Yeux et lèvres', sub: "Selon l'effet choisi." },
      { title: 'Fixation', sub: 'Pour une tenue toute la journée.' },
    ],
    priceList: [
      { label: 'Make-up jour', price: 150 },
      { label: 'Maquillage invitée', price: 250 },
      { label: 'Maquillage et cils', price: 300 },
      { label: 'Maquillage mariée', price: 1000 },
    ],
  },
  {
    photo: 'epilation',
    title: 'Épilation',
    subtitle: 'Visage et corps, à la zone ou en forfait.',
    description:
      'Épilation du visage et du corps, à la zone ou en forfait. Un soin apaisant est appliqué après chaque séance pour limiter les rougeurs.',
    duration: '10 – 60 min',
    expert: 'Esthéticienne',
    bg: '#EAF3F0',
    icon: 'Feather',
    benefits: [
      'Visage et corps',
      'Forfaits plus avantageux',
      'Soin apaisant après la séance',
    ],
    steps: [
      { title: 'Préparation', sub: 'Nettoyage de la zone.' },
      { title: 'Épilation', sub: 'Zone par zone.' },
      { title: 'Soin', sub: 'Apaisant, pour limiter les rougeurs.' },
    ],
    priceList: [
      { label: 'Sourcils', price: 30 },
      { label: 'Duvet', price: 15 },
      { label: 'Menton', price: 15 },
      { label: 'Visage', price: 70 },
      { label: 'Aisselles', price: 30 },
      { label: 'Demi-bras', price: 40 },
      { label: 'Bras entiers', price: 60 },
      { label: 'Maillot intégral', price: 100 },
      { label: 'Bord de maillot', price: 40 },
      { label: 'Demi-jambes', price: 60 },
      { label: 'Jambes entières', price: 120 },
      { label: 'Épilation complète', price: 250 },
      { label: 'Maillot, aisselles, sourcils, duvet', price: 150 },
      { label: 'Demi-jambes, aisselles, maillot', price: 160 },
    ],
  },
]

async function main() {
  const photosDir = process.env.SERVICE_PHOTOS_DIR
  if (!photosDir) throw new Error('Set SERVICE_PHOTOS_DIR to the folder holding service-<slug>.jpg')

  const payload = await getPayload({ config })

  const existing = await payload.find({ collection: 'services', limit: 100, depth: 0 })
  for (const doc of existing.docs) {
    await payload.delete({ collection: 'services', id: doc.id })
  }
  payload.logger.info(`Removed ${existing.docs.length} previous services.`)

  for (const [i, service] of SERVICES.entries()) {
    const filename = `service-${service.photo}.jpg`
    const filePath = path.join(photosDir, filename)
    if (!fs.existsSync(filePath)) throw new Error(`Missing photo: ${filePath}`)

    // Uploads are stored as WebP, so a photo sent on an earlier run is found
    // under that name.
    const found = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { in: [filename, filename.replace(/\.jpg$/, '.webp')] } },
    })
    const media =
      found.docs[0] ??
      (await payload.create({ collection: 'media', data: { alt: service.title }, filePath }))

    // The legacy single price is the cheapest line, so anything still
    // reading `price` shows a real "from" figure.
    const prices = service.priceList.map((l) => l.price).filter((p): p is number => typeof p === 'number')

    await payload.create({
      collection: 'services',
      data: {
        title: service.title,
        subtitle: service.subtitle,
        description: service.description,
        price: prices.length > 0 ? Math.min(...prices) : 0,
        duration: service.duration,
        expert: service.expert,
        bg: service.bg,
        icon: service.icon,
        image: media.id,
        sortOrder: i + 1,
        benefits: service.benefits.map((text) => ({ text })),
        steps: service.steps,
        priceList: service.priceList.map((l) => ({ label: l.label, price: l.price ?? null, fromPrice: l.fromPrice ?? false })),
      },
    })
    payload.logger.info(`Service: ${service.title} (${service.priceList.length} tarifs)`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
