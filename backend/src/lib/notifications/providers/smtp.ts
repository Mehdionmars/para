import nodemailer, { type Transporter } from 'nodemailer'

import type { DeliveryResult, EmailNotificationProvider, EmailPayload } from '../types'

const env = (key: string) => process.env[key]?.trim() || ''

/**
 * SMTP email, through the mailbox host's own server (e.g. Nindohost).
 *
 * Required env:
 *   SMTP_HOST    e.g. smtp.nindomail.com
 *   SMTP_USER    the mailbox login, e.g. contact@paradhiver.ma
 *   SMTP_PASS    the mailbox password — server-only, never committed
 *   EMAIL_FROM   e.g. "Para d'Hiver <contact@paradhiver.ma>"
 * Optional:
 *   SMTP_PORT    defaults to 465. 465 is implicit TLS; any other port (587)
 *                starts in clear and is upgraded with STARTTLS, which is
 *                then required — a server that won't upgrade is refused
 *                rather than sent the password in clear.
 *
 * Most hosts reject a From that isn't the authenticated mailbox (or lands it
 * in spam), so EMAIL_FROM should use the SMTP_USER address.
 */

let cached: { key: string; transporter: Transporter } | null = null

/**
 * One pooled transporter per distinct configuration, so a burst of order
 * notifications reuses connections instead of re-handshaking TLS per email.
 * Keyed on the config so tests (and a changed env) get a fresh one.
 */
function transporter(): Transporter {
  const port = Number(env('SMTP_PORT') || 465)
  const key = [env('SMTP_HOST'), port, env('SMTP_USER'), env('SMTP_PASS')].join('|')
  if (cached?.key === key) return cached.transporter

  cached?.transporter.close()
  const t = nodemailer.createTransport({
    auth: { pass: env('SMTP_PASS'), user: env('SMTP_USER') },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    host: env('SMTP_HOST'),
    pool: true,
    port,
    requireTLS: port !== 465,
    secure: port === 465,
    socketTimeout: 20_000,
  })
  cached = { key, transporter: t }
  return t
}

export const smtpProvider: EmailNotificationProvider = {
  channel: 'email',

  disabledReason() {
    const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'].filter((k) => !env(k))
    return `SMTP non configuré (variables manquantes : ${missing.join(', ')}).`
  },

  isConfigured() {
    return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS') && env('EMAIL_FROM'))
  },

  async send(payload: EmailPayload): Promise<DeliveryResult> {
    if (!this.isConfigured()) return { ok: false, reason: this.disabledReason(), skipped: true }

    try {
      await transporter().sendMail({
        from: env('EMAIL_FROM'),
        ...(payload.html ? { html: payload.html } : {}),
        subject: payload.subject,
        text: payload.text,
        to: payload.to,
      })
      return { ok: true }
    } catch (err) {
      const e = err as { code?: string; message?: string; responseCode?: number }
      // EAUTH is a wrong password, not a transient fault — naming it is what
      // tells the operator to fix the env rather than wait for a retry.
      if (e.code === 'EAUTH') return { error: `SMTP : authentification refusée (${e.message ?? ''})`, ok: false }
      const prefix = e.responseCode ? `SMTP ${e.responseCode}` : `SMTP ${e.code ?? 'erreur'}`
      return { error: `${prefix}: ${e.message ?? 'erreur inconnue'}`, ok: false }
    }
  },
}
