import type { NotificationContext, OrderNotificationEvent } from './types'

/**
 * Branded HTML bodies for customer emails.
 *
 * Written as tables with inline styles rather than modern CSS: email clients
 * are not browsers. Outlook renders through Word's engine, Gmail strips
 * <style> blocks in some contexts, and flexbox/grid are unreliable across the
 * set. A single centred table with inline styles is the one layout that
 * survives everywhere, which is why this looks a decade out of date on
 * purpose.
 *
 * Every message also ships a plain-text alternative (built in templates.ts)
 * — some clients show it, and spam filters weigh its absence.
 */

const BRAND = {
  border: '#E8E0D5',
  cream: '#F7EEE5',
  ink: '#373020',
  muted: '#757D86',
  plum: '#5E4074',
  sand: '#FAF7F2',
  teal: '#008AA5',
} as const

const money = (n: number) => `${new Intl.NumberFormat('fr-MA').format(Math.round(n))} MAD`

/** Escapes interpolated values. A customer name is user-supplied and ends up
 * inside markup — never trust it raw. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function storefrontUrl(path = ''): string {
  const base = (process.env.FRONTEND_URL || 'https://paradhiver.ma').replace(/\/$/, '')
  return `${base}${path}`
}

type Block = { heading: string; intro: string; detail?: string; ctaLabel?: string; ctaPath?: string }

/**
 * Wraps a message in the Para d'Hiver shell.
 *
 * @param preheader - The grey line clients show next to the subject in the
 *   inbox list. Left unset it leaks the first words of the layout, so it is
 *   set deliberately and hidden in the body.
 */
function layout({ block, preheader }: { block: Block; preheader: string }): string {
  const cta = block.ctaLabel
    ? `
        <tr>
          <td align="center" style="padding:8px 0 4px">
            <a href="${storefrontUrl(block.ctaPath || '/suivi-commande')}"
               style="display:inline-block;background:${BRAND.plum};color:#ffffff;text-decoration:none;
                      font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
                      padding:14px 28px;border-radius:999px">${esc(block.ctaLabel)}</a>
          </td>
        </tr>`
    : ''

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(block.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.sand};font-family:Helvetica,Arial,sans-serif;color:${BRAND.ink}">
  <!-- Preheader: shown in the inbox list, never in the message itself. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.sand};padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden">

          <tr>
            <td align="center" style="background:${BRAND.cream};padding:26px 24px">
              <div style="font-size:19px;letter-spacing:.22em;text-transform:uppercase;color:${BRAND.plum}">
                Para d&rsquo;Hiver
              </div>
              <div style="margin-top:5px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${BRAND.teal}">
                Parapharmacie
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 28px 8px">
              <h1 style="margin:0 0 14px;font-size:21px;font-weight:400;line-height:1.3;color:${BRAND.ink}">
                ${esc(block.heading)}
              </h1>
              <p style="margin:0 0 14px;font-size:14.5px;line-height:1.7;color:${BRAND.ink}">${esc(block.intro)}</p>
              ${
                block.detail
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                            style="background:${BRAND.sand};border-radius:12px;margin:0 0 18px">
                       <tr><td style="padding:14px 16px;font-size:13.5px;line-height:1.7;color:${BRAND.ink}">
                         ${block.detail}
                       </td></tr>
                     </table>`
                  : ''
              }
            </td>
          </tr>
          ${cta}

          <tr>
            <td style="padding:22px 28px 28px">
              <p style="margin:0;font-size:12.5px;line-height:1.7;color:${BRAND.muted}">
                Une question&nbsp;? Répondez simplement à cet email, nous vous r&eacute;pondrons.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:${BRAND.cream};padding:18px 24px">
              <p style="margin:0;font-size:11.5px;line-height:1.6;color:${BRAND.muted}">
                Para d&rsquo;Hiver &middot; Parapharmacie &middot; Maroc<br>
                Vous recevez cet email car vous avez pass&eacute; une commande sur notre site.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** The order summary block, shared by the messages that should show it. */
function orderDetail(ctx: NotificationContext): string {
  const items = `${ctx.itemCount} article${ctx.itemCount > 1 ? 's' : ''}`
  return `
    <strong>Commande ${esc(ctx.orderNumber)}</strong><br>
    ${esc(items)} &middot; Total ${esc(money(ctx.total))}
  `.trim()
}

/**
 * Returns the HTML body for a customer-facing order event, or null when the
 * event has no customer message (nothing is invented to fill a gap).
 */
export function renderEmailHtml(ctx: NotificationContext): string | null {
  const name = ctx.customerName || 'Bonjour'
  const track = { ctaLabel: 'Suivre ma commande', ctaPath: '/suivi-commande' }

  const blocks: Partial<Record<OrderNotificationEvent, { block: Block; preheader: string }>> = {
    ORDER_CANCELLED: {
      block: {
        detail: orderDetail(ctx),
        heading: 'Votre commande a été annulée',
        intro: `${name}, votre commande ${ctx.orderNumber} a été annulée et les articles ont été remis en stock. Si vous n'êtes pas à l'origine de cette annulation, répondez à cet email.`,
      },
      preheader: `Commande ${ctx.orderNumber} annulée`,
    },
    ORDER_CONFIRMED: {
      block: {
        ...track,
        detail: orderDetail(ctx),
        heading: 'Votre commande est confirmée',
        intro: `${name}, nous avons confirmé votre commande. Nous la préparons dans nos locaux et vous préviendrons dès son expédition.`,
      },
      preheader: `Commande ${ctx.orderNumber} confirmée · ${money(ctx.total)}`,
    },
    ORDER_CREATED: {
      block: {
        ...track,
        detail: orderDetail(ctx),
        heading: 'Merci pour votre commande',
        intro: `${name}, nous avons bien reçu votre commande. Vous recevrez un message dès qu'elle sera confirmée par notre équipe.`,
      },
      preheader: `Commande ${ctx.orderNumber} reçue · ${money(ctx.total)}`,
    },
    ORDER_DELIVERED: {
      block: {
        detail: orderDetail(ctx),
        heading: 'Votre commande a été livrée',
        intro: `${name}, votre commande vous a été remise. Merci de votre confiance — nous serions heureux d'avoir votre avis sur vos produits.`,
      },
      preheader: `Commande ${ctx.orderNumber} livrée`,
    },
    ORDER_PREPARING: {
      block: {
        ...track,
        detail: orderDetail(ctx),
        heading: 'Votre commande est en préparation',
        intro: `${name}, nos pharmaciens préparent actuellement votre commande. Elle partira très prochainement.`,
      },
      preheader: `Commande ${ctx.orderNumber} en préparation`,
    },
    ORDER_REFUNDED: {
      block: {
        detail: orderDetail(ctx),
        heading: 'Votre remboursement a été traité',
        intro: `${name}, le remboursement de votre commande a été traité pour un montant de ${money(ctx.total)}.`,
      },
      preheader: `Remboursement de la commande ${ctx.orderNumber}`,
    },
    ORDER_RETURNED: {
      block: {
        detail: orderDetail(ctx),
        heading: 'Nous avons reçu votre retour',
        intro: `${name}, votre retour a bien été enregistré. Le remboursement suit sous quelques jours.`,
      },
      preheader: `Retour de la commande ${ctx.orderNumber} enregistré`,
    },
    ORDER_SHIPPED: {
      block: {
        ...track,
        detail: orderDetail(ctx),
        heading: 'Votre commande est en route',
        intro: `${name}, votre commande vient de quitter notre parapharmacie. Vous pouvez suivre son acheminement à tout moment.`,
      },
      preheader: `Commande ${ctx.orderNumber} expédiée`,
    },
  }

  const entry = blocks[ctx.event]
  return entry ? layout(entry) : null
}
