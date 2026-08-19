import type {
  DeliveryResult,
  EmailNotificationProvider,
  EmailPayload,
  PushNotificationProvider,
  PushPayload,
  WhatsAppNotificationProvider,
  WhatsAppPayload,
} from './types'

/**
 * Delivery providers.
 *
 * Every one of these is unconfigured by default and says so. An unconfigured
 * provider returns `{ ok: false, skipped: true }` — it never resolves as a
 * success, so a notification is recorded as `pending` rather than `sent`.
 * Nothing in this file ever pretends a message left the building.
 *
 * Swapping in a real vendor means implementing `send` here (or pointing these
 * at an SDK); no caller changes, because NotificationService only knows the
 * interface.
 */

const env = (key: string) => process.env[key]?.trim() || ''

// ---------------------------------------------------------------- email

/**
 * Generic HTTP email provider.
 *
 * Deliberately vendor-neutral: it posts a JSON body to whatever endpoint
 * EMAIL_API_URL names, with a bearer token. Resend, Postmark, Brevo and
 * Mailgun all accept a shape close enough to this; a vendor that doesn't can
 * be handled by replacing this single function.
 *
 * Required env:
 *   EMAIL_API_URL    e.g. https://api.resend.com/emails
 *   EMAIL_API_KEY    bearer token
 *   EMAIL_FROM       e.g. "Para d'Hiver <commandes@paradhiver.ma>"
 */
export const emailProvider: EmailNotificationProvider = {
  channel: 'email',

  disabledReason() {
    const missing = ['EMAIL_API_URL', 'EMAIL_API_KEY', 'EMAIL_FROM'].filter((k) => !env(k))
    return `Email non configuré (variables manquantes : ${missing.join(', ')}).`
  },

  isConfigured() {
    return Boolean(env('EMAIL_API_URL') && env('EMAIL_API_KEY') && env('EMAIL_FROM'))
  },

  async send(payload: EmailPayload): Promise<DeliveryResult> {
    if (!this.isConfigured()) return { ok: false, reason: this.disabledReason(), skipped: true }

    try {
      const res = await fetch(env('EMAIL_API_URL'), {
        body: JSON.stringify({
          data: payload.data,
          from: env('EMAIL_FROM'),
          subject: payload.subject,
          template: payload.template,
          text: payload.text,
          to: payload.to,
        }),
        headers: {
          Authorization: `Bearer ${env('EMAIL_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return { error: `HTTP ${res.status} ${body.slice(0, 200)}`, ok: false }
      }
      return { ok: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erreur inconnue', ok: false }
    }
  },
}

// ------------------------------------------------------------- whatsapp

/**
 * WhatsApp Cloud API (Meta) provider.
 *
 * Required env:
 *   WHATSAPP_PHONE_NUMBER_ID   the sender's id in Meta Business
 *   WHATSAPP_ACCESS_TOKEN      permanent system-user token
 *   WHATSAPP_API_VERSION       optional, defaults to v21.0
 *
 * Templates must be pre-approved in Meta Business Manager under the exact
 * names listed in templates.ts (order_confirmed, order_preparing, …), each
 * with positional body parameters in the order produced by
 * templateVariables().
 */
export const whatsappProvider: WhatsAppNotificationProvider = {
  channel: 'whatsapp',

  disabledReason() {
    const missing = ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'].filter((k) => !env(k))
    return `WhatsApp non configuré (variables manquantes : ${missing.join(', ')}).`
  },

  isConfigured() {
    return Boolean(env('WHATSAPP_PHONE_NUMBER_ID') && env('WHATSAPP_ACCESS_TOKEN'))
  },

  async send(payload: WhatsAppPayload): Promise<DeliveryResult> {
    if (!this.isConfigured()) return { ok: false, reason: this.disabledReason(), skipped: true }

    const phone = normalizeMoroccanPhone(payload.phone)
    if (!phone) return { error: `Numéro invalide : ${payload.phone}`, ok: false }

    const version = env('WHATSAPP_API_VERSION') || 'v21.0'
    try {
      const res = await fetch(`https://graph.facebook.com/${version}/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          template: {
            components: [
              {
                parameters: Object.values(payload.variables).map((text) => ({ text, type: 'text' })),
                type: 'body',
              },
            ],
            language: { code: 'fr' },
            name: payload.template,
          },
          to: phone,
          type: 'template',
        }),
        headers: {
          Authorization: `Bearer ${env('WHATSAPP_ACCESS_TOKEN')}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return { error: `HTTP ${res.status} ${body.slice(0, 200)}`, ok: false }
      }
      return { ok: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erreur inconnue', ok: false }
    }
  },
}

/**
 * To E.164 without the leading +, which is what the Cloud API expects.
 * Moroccan numbers are commonly stored as 06XXXXXXXX locally.
 */
export function normalizeMoroccanPhone(input: string): string | null {
  const digits = String(input || '').replace(/[^\d+]/g, '')
  if (!digits) return null
  if (digits.startsWith('+')) return digits.slice(1)
  if (digits.startsWith('212')) return digits
  if (digits.startsWith('0') && digits.length === 10) return `212${digits.slice(1)}`
  if (digits.length === 9) return `212${digits}`
  return null
}

// ----------------------------------------------------------------- push

/**
 * Web Push (VAPID) provider.
 *
 * Left unimplemented on purpose: a real send requires signing the request
 * with the VAPID keys and encrypting the payload per RFC 8291, which means
 * pulling in `web-push`. Adding that dependency before any subscription
 * exists would be dead weight, so this reports itself unconfigured and the
 * push channel is skipped.
 *
 * To enable: `npm i web-push`, set the env below, and replace the body of
 * `send` with a `webpush.sendNotification(subscription, JSON.stringify(...))`.
 *
 * Required env:
 *   VAPID_PUBLIC_KEY     also exposed to the browser as NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY    server-only, never exposed
 *   VAPID_SUBJECT        mailto: or https: contact, e.g. mailto:contact@paradhiver.ma
 */
export const pushProvider: PushNotificationProvider = {
  channel: 'push',

  disabledReason() {
    const missing = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'].filter((k) => !env(k))
    return missing.length > 0
      ? `Push non configuré (variables manquantes : ${missing.join(', ')}).`
      : "Push non configuré (clés VAPID présentes mais la dépendance 'web-push' n'est pas installée)."
  },

  isConfigured() {
    // Even with keys present, there is no signing implementation yet, so this
    // stays false rather than letting a caller believe push is live.
    return false
  },

  async send(): Promise<DeliveryResult> {
    return { ok: false, reason: this.disabledReason(), skipped: true }
  },
}
