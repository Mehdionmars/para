import type { GlobalConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { revalidateStorefront } from '../lib/revalidateStorefront'

/**
 * The payment methods an order can carry.
 *
 * These are the stored values, not labels. The database previously held the
 * French display string 'À la livraison' on all 323 orders, which meant the
 * dashboard's own PAYMENT_LABELS map (keyed 'cod' / 'cmi') never matched a
 * single row and silently fell through to printing the raw text. Codes here,
 * labels at the edge — a rename of the wording must never rewrite history.
 *
 * There is deliberately no card/CMI value: no online payment provider is
 * integrated anywhere in this project, and an option a customer could pick
 * but not complete is worse than an absent one.
 */
export const PAYMENT_METHOD_OPTIONS = ['cash_on_delivery', 'bank_transfer'] as const

export type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number]

/** Bank fields the customer needs before a transfer can be made at all. */
const REQUIRED_FOR_TRANSFER = ['beneficiary', 'bankName', 'rib'] as const

const bankField = (name: string, label: string, description: string) =>
  ({ name, type: 'text', label, admin: { description } }) as const

export const PaymentSettings: GlobalConfig = {
  slug: 'payment-settings',
  access: {
    // The storefront prints these at checkout, so they are public by design.
    // Nothing secret lives here: a RIB/IBAN is what you hand a payer, unlike
    // an API key. Credentials for a future provider must NOT be added to this
    // global — they belong in environment variables, which are never
    // serialised to the client.
    read: () => true,
    update: canEditContent,
  },
  admin: {
    description:
      'Modes de paiement proposés au checkout et coordonnées bancaires pour le virement. Modifiable ici sans redéploiement.',
    group: 'Configuration',
  },
  hooks: {
    afterChange: [
      async ({ req }) => {
        await revalidateStorefront(req.payload, ['payment-settings'])
      },
    ],
  },
  fields: [
    {
      name: 'codEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Proposer le paiement à la livraison',
    },
    {
      name: 'codDescription',
      type: 'textarea',
      defaultValue: 'Payez en espèces lors de la réception de votre commande.',
      label: 'Description affichée au client',
    },
    {
      name: 'bankTransferEnabled',
      type: 'checkbox',
      // Off until someone fills the details in. A migration must never switch
      // on a payment method whose coordinates are blank — the customer would
      // reach the confirmation screen with nowhere to send the money.
      defaultValue: false,
      label: 'Proposer le virement bancaire',
      admin: {
        description:
          'Nécessite au minimum le bénéficiaire, la banque et le RIB ci-dessous.',
      },
      validate: (value: unknown, { data }: { data?: Record<string, unknown> }) => {
        if (value !== true) return true
        const bank = (data?.bank ?? {}) as Record<string, unknown>
        const missing = REQUIRED_FOR_TRANSFER.filter(
          (k) => typeof bank[k] !== 'string' || !(bank[k] as string).trim(),
        )
        if (missing.length > 0) {
          return `Renseignez d'abord : ${missing.join(', ')} dans « Coordonnées bancaires ».`
        }
        return true
      },
    },
    {
      name: 'bankTransferDescription',
      type: 'textarea',
      defaultValue: "Effectuez un virement bancaire avant l'expédition de votre commande.",
      label: 'Description affichée au client',
    },
    {
      name: 'bank',
      type: 'group',
      label: 'Coordonnées bancaires',
      admin: {
        description:
          "Ces informations sont affichées au client après la commande. Laissez vide tant que vous n'avez pas les valeurs réelles — rien n'est pré-rempli ici volontairement.",
      },
      fields: [
        bankField('beneficiary', 'Nom du bénéficiaire', 'Le titulaire du compte, tel qu’il doit être saisi par le client.'),
        bankField('bankName', 'Banque', 'Ex. Attijariwafa Bank, BMCE, CIH…'),
        bankField('rib', 'RIB', '24 chiffres. Affiché tel quel au client.'),
        bankField('iban', 'IBAN', 'Optionnel. Affiché uniquement si renseigné.'),
        bankField('bic', 'BIC / SWIFT', 'Optionnel. Affiché uniquement si renseigné.'),
        {
          name: 'instructions',
          type: 'textarea',
          label: 'Consigne complémentaire',
          admin: {
            description:
              'Optionnel. Affiché sous les coordonnées, après la référence de commande.',
          },
        },
      ],
    },
  ],
}
