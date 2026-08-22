import type { DeliveryResult, EmailNotificationProvider, EmailPayload } from '../types'

const env = (key: string) => process.env[key]?.trim() || ''

/**
 * Resend transactional email.
 *
 * Called over plain fetch rather than through the `resend` SDK: the API is a
 * single authenticated POST, and the package would add a dependency, its own
 * transitive tree and a version to keep current for no behaviour this file
 * doesn't already have. If richer features are ever needed (batch, audiences,
 * attachments), swapping in the SDK is a change confined to this file.
 *
 * Required env:
 *   RESEND_API_KEY   starts with "re_"
 *   EMAIL_FROM       a verified sender, e.g. "Para d'Hiver <commandes@paradhiver.ma>"
 *
 * The domain in EMAIL_FROM must be verified in Resend, with its SPF and DKIM
 * records published. An unverified sender is accepted by the API and then
 * quietly lands in spam — worse than a refusal, which is why it is called out
 * here rather than left to be discovered in production.
 */
export const resendProvider: EmailNotificationProvider = {
  channel: 'email',

  disabledReason() {
    const missing = ['RESEND_API_KEY', 'EMAIL_FROM'].filter((k) => !env(k))
    return `Resend non configuré (variables manquantes : ${missing.join(', ')}).`
  },

  isConfigured() {
    return Boolean(env('RESEND_API_KEY') && env('EMAIL_FROM'))
  },

  async send(payload: EmailPayload): Promise<DeliveryResult> {
    if (!this.isConfigured()) return { ok: false, reason: this.disabledReason(), skipped: true }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        body: JSON.stringify({
          from: env('EMAIL_FROM'),
          // Resend takes the content directly; `template`/`data` are not part
          // of its schema and would be rejected.
          ...(payload.html ? { html: payload.html } : {}),
          subject: payload.subject,
          text: payload.text,
          to: [payload.to],
        }),
        headers: {
          Authorization: `Bearer ${env('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
      })

      const body = (await res.json().catch(() => null)) as { id?: string; message?: string; name?: string } | null

      if (!res.ok) {
        // Resend reports the reason in `message`; surfacing it is what makes a
        // failed delivery diagnosable from the dashboard instead of a bare
        // status code.
        return { error: `Resend ${res.status}: ${body?.message || body?.name || 'erreur inconnue'}`, ok: false }
      }

      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      // A timeout is transient and worth retrying, unlike a rejected payload —
      // the wording tells the operator which one this was.
      return { error: message.includes('timeout') ? 'Délai dépassé côté Resend.' : message, ok: false }
    }
  },
}
