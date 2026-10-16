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
  const content = orderEmailContent(ctx)
  if (!content) return null
  const name = ctx.customerName || 'Bonjour'
  return layout({
    block: {
      ctaLabel: content.cta?.label,
      ctaPath: content.cta?.path,
      detail: orderDetail(ctx),
      heading: content.heading,
      intro: `${name}, ${content.message}`,
    },
    preheader: content.preheader,
  })
}

type OrderEmailContent = {
  heading: string
  /** The body sentence, without the greeting: the HTML layout prefixes the
   * customer's name, the Resend template has its own "Bonjour …" line. */
  message: string
  preheader: string
  /** Only for orders still on their way; a closed order is not tracked. */
  cta?: { label: string; path: string }
}

/**
 * What each order email says — one copy, shared by the built-in HTML layout
 * and the Resend template, so the two can never tell a customer different
 * things. Null for an event with no customer message.
 */
export function orderEmailContent(ctx: NotificationContext): OrderEmailContent | null {
  const track = { label: 'Suivre ma commande', path: '/suivi-commande' }

  const copy: Partial<Record<OrderNotificationEvent, OrderEmailContent>> = {
    ORDER_CANCELLED: {
      heading: 'Votre commande a été annulée',
      message: `votre commande ${ctx.orderNumber} a été annulée et les articles ont été remis en stock. Si vous n'êtes pas à l'origine de cette annulation, répondez à cet email.`,
      preheader: `Commande ${ctx.orderNumber} annulée`,
    },
    ORDER_CONFIRMED: {
      cta: track,
      heading: 'Votre commande est confirmée',
      message: 'nous avons confirmé votre commande. Nous la préparons dans nos locaux et vous préviendrons dès son expédition.',
      preheader: `Commande ${ctx.orderNumber} confirmée · ${money(ctx.total)}`,
    },
    ORDER_CREATED: {
      cta: track,
      heading: 'Merci pour votre commande',
      message: "nous avons bien reçu votre commande. Vous recevrez un message dès qu'elle sera confirmée par notre équipe.",
      preheader: `Commande ${ctx.orderNumber} reçue · ${money(ctx.total)}`,
    },
    ORDER_DELIVERED: {
      heading: 'Votre commande a été livrée',
      message: "votre commande vous a été remise. Merci de votre confiance — nous serions heureux d'avoir votre avis sur vos produits.",
      preheader: `Commande ${ctx.orderNumber} livrée`,
    },
    ORDER_PREPARING: {
      cta: track,
      heading: 'Votre commande est en préparation',
      message: 'nos pharmaciens préparent actuellement votre commande. Elle partira très prochainement.',
      preheader: `Commande ${ctx.orderNumber} en préparation`,
    },
    ORDER_REFUNDED: {
      heading: 'Votre remboursement a été traité',
      message: `le remboursement de votre commande a été traité pour un montant de ${money(ctx.total)}.`,
      preheader: `Remboursement de la commande ${ctx.orderNumber}`,
    },
    ORDER_RETURNED: {
      heading: 'Nous avons reçu votre retour',
      message: 'votre retour a bien été enregistré. Le remboursement suit sous quelques jours.',
      preheader: `Retour de la commande ${ctx.orderNumber} enregistré`,
    },
    ORDER_SHIPPED: {
      cta: track,
      heading: 'Votre commande est en route',
      message: 'votre commande vient de quitter notre parapharmacie. Vous pouvez suivre son acheminement à tout moment.',
      preheader: `Commande ${ctx.orderNumber} expédiée`,
    },
  }

  return copy[ctx.event] ?? null
}

/**
 * The variables of the Resend template "commande-mise-a-jour" for an order
 * event, or null when the event has no customer message.
 *
 * Every value is HTML-escaped here. The template inserts them with triple
 * braces, and Resend's documentation does not say whether it escapes them:
 * a customer name is user-supplied and must never reach the markup raw.
 *
 * The template always draws a button. A closed order (cancelled, delivered,
 * refunded, returned) is not tracked, so its button leads somewhere useful
 * instead — never "Suivre ma commande".
 */
export function resendTemplateVariables(ctx: NotificationContext): Record<string, string> | null {
  const content = orderEmailContent(ctx)
  if (!content) return null

  const closedCta =
    ctx.event === 'ORDER_DELIVERED'
      ? { label: 'Découvrir nos produits', path: '/catalogue' }
      : { label: 'Nous contacter', path: '/contact' }
  const cta = content.cta ?? closedCta
  const message = content.message.charAt(0).toUpperCase() + content.message.slice(1)
  const items = `${ctx.itemCount} article${ctx.itemCount > 1 ? 's' : ''}`

  const vars: Record<string, string> = {
    CTA_LABEL: esc(cta.label),
    CTA_URL: esc(storefrontUrl(cta.path)),
    EYEBROW: 'Votre commande',
    HEADING: esc(content.heading),
    ITEM_COUNT: esc(items),
    MESSAGE: esc(message),
    ORDER_NUMBER: esc(ctx.orderNumber),
    ORDER_TOTAL: esc(money(ctx.total)),
    PREHEADER: esc(content.preheader),
  }
  // Left out when unknown, so the template's own fallback ("cher client")
  // greets the customer instead of an empty "Bonjour ,".
  if (ctx.customerName?.trim()) vars.CUSTOMER_NAME = esc(ctx.customerName.trim())
  return vars
}
