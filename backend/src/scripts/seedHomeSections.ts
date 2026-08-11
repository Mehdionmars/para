import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'
import { SECTION_KEYS } from '../globals/Home'

const DEFAULT_SERVICES = [
  { title: 'Scanner une ordonnance', sub: 'Envoyez votre ordonnance, nos pharmaciens préparent votre commande.', cta: 'Envoyer', href: '/services', icon: 'ScanLine' },
  { title: 'Livraison', sub: '24h à Casablanca, 48h partout au Maroc, offerte dès 399 MAD.', cta: 'En savoir plus', href: '/services', icon: 'Truck' },
  { title: 'Conseils pharmaceutiques', sub: 'Un doute sur un produit ? Nos pharmaciens répondent en direct.', cta: 'Poser une question', href: '/services/1', icon: 'MessageCircleQuestion' },
  { title: "Besoin d'aide ?", sub: "Suivi de commande, retours, facturation : l'équipe vous répond 7j/7.", cta: 'Nous contacter', href: '/services', icon: 'LifeBuoy' },
]

async function run() {
  const payload = await getPayload({ config })
  const home = await payload.findGlobal({ slug: 'home' })

  const data: Record<string, unknown> = {}

  if (!home.sections || home.sections.length === 0) {
    data.sections = SECTION_KEYS.map((key) => ({ key, visible: true }))
    payload.logger.info(`Seeding sections order: ${SECTION_KEYS.join(', ')}`)
  }

  if (!home.servicesTeaser || home.servicesTeaser.length === 0) {
    data.servicesTeaser = DEFAULT_SERVICES
    payload.logger.info(`Seeding ${DEFAULT_SERVICES.length} default service cards`)
  }

  if (home._status !== 'published') {
    payload.logger.info(`Publishing home (was "${home._status}")`)
  }
  data._status = 'published'
  await payload.updateGlobal({ slug: 'home', data })
  payload.logger.info('Home global updated and published.')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
