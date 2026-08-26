/**
 * Environment validation, run once at import time.
 *
 * The config previously read `process.env.PAYLOAD_SECRET || ''` and
 * `process.env.DATABASE_URI || ''`. Both are the kind of default that turns a
 * missing variable into a *silent* misconfiguration: an empty secret still
 * signs and verifies JWTs, so a deploy with no PAYLOAD_SECRET boots happily
 * and issues tokens anyone can forge. A deploy that is missing something must
 * refuse to start and say what, at the moment the mistake is cheapest to fix.
 *
 * Optional integrations are validated as *groups* rather than individually.
 * Cloudinary with two of its three keys set is not "partly configured", it is
 * broken — and it fails at the first image upload, in production, rather than
 * at boot.
 *
 * ## Classification
 *
 *   SECRET       PAYLOAD_SECRET, DATABASE_URI, CLOUDINARY_API_SECRET,
 *                RESEND_API_KEY, INSTAGRAM_ACCESS_TOKEN,
 *                INSTAGRAM_SYNC_SECRET, REVALIDATE_SECRET, JOBS_SECRET
 *   SERVER-ONLY  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *                CLOUDINARY_FOLDER, EMAIL_FROM, STOCK_ALERT_EMAIL,
 *                INSTAGRAM_BUSINESS_ACCOUNT_ID, PGPOOL_MAX, SERVER_URL,
 *                FRONTEND_URL, ADMIN_URL, STOREFRONT_INTERNAL_URL
 *   PUBLIC       none — nothing in this app is exposed as NEXT_PUBLIC_*.
 *
 * Nothing here may ever be prefixed NEXT_PUBLIC_: that prefix inlines the
 * value into the browser bundle.
 */

const errors: string[] = []

function required(name: string, { minLength = 1 }: { minLength?: number } = {}): string {
  const value = process.env[name]?.trim()
  if (!value) {
    errors.push(`${name} is required but not set.`)
    return ''
  }
  if (value.length < minLength) {
    errors.push(`${name} is too short (${value.length} chars, minimum ${minLength}).`)
  }
  return value
}

/** All-or-nothing: either every key of the group is set, or none is. */
function group(label: string, names: string[]): boolean {
  const present = names.filter((n) => Boolean(process.env[n]?.trim()))
  if (present.length === 0) return false
  if (present.length !== names.length) {
    const missing = names.filter((n) => !present.includes(n))
    errors.push(`${label} is partially configured — missing ${missing.join(', ')}. Set all of them, or none.`)
    return false
  }
  return true
}

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    errors.push(`${name} must be a positive integer (got "${raw}").`)
    return fallback
  }
  return parsed
}

const DATABASE_URI = required('DATABASE_URI')

// 32 characters is the length `openssl rand -base64 32` produces, which is
// what .env.example tells you to run. Anything materially shorter is a
// placeholder someone forgot to replace.
const PAYLOAD_SECRET = required('PAYLOAD_SECRET', { minLength: 32 })

const cloudinaryConfigured = group('Cloudinary', [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
])

/**
 * Email, modelled the way lib/notifications/providers.ts actually resolves it.
 *
 * There are two transports and they share a sender address:
 *
 *   Resend   RESEND_API_KEY + EMAIL_FROM        (preferred when present)
 *   Generic  EMAIL_API_URL + EMAIL_API_KEY + EMAIL_FROM
 *
 * A flat "these two go together" group gets this wrong in both directions: it
 * rejects a valid generic-provider setup (EMAIL_FROM without RESEND_API_KEY)
 * and it says nothing about EMAIL_API_URL. So each transport is checked on
 * its own trigger — the key that says "I intended to use this one".
 */
function emailGroup(): boolean {
  const has = (n: string) => Boolean(process.env[n]?.trim())
  const from = has('EMAIL_FROM')

  const resendIntended = has('RESEND_API_KEY')
  const genericIntended = has('EMAIL_API_URL') || has('EMAIL_API_KEY')

  if (resendIntended && !from) {
    errors.push('RESEND_API_KEY is set but EMAIL_FROM is not — Resend cannot send without a verified sender.')
  }
  if (genericIntended) {
    const missing = ['EMAIL_API_URL', 'EMAIL_API_KEY', 'EMAIL_FROM'].filter((n) => !has(n))
    if (missing.length > 0) {
      errors.push(`Generic email provider is partially configured — missing ${missing.join(', ')}.`)
    }
  }
  // A sender with no transport is the silent case worth naming: it looks
  // configured and delivers nothing.
  if (from && !resendIntended && !genericIntended) {
    errors.push('EMAIL_FROM is set but no transport is — add RESEND_API_KEY, or EMAIL_API_URL + EMAIL_API_KEY.')
  }

  return (resendIntended && from) || (has('EMAIL_API_URL') && has('EMAIL_API_KEY') && from)
}

const emailConfigured = emailGroup()

const instagramConfigured = group('Instagram sync', [
  'INSTAGRAM_ACCESS_TOKEN',
  'INSTAGRAM_BUSINESS_ACCOUNT_ID',
  'INSTAGRAM_SYNC_SECRET',
])

const PGPOOL_MAX = positiveInt('PGPOOL_MAX', 5)

if (errors.length > 0) {
  // Thrown, not `process.exit`: this module is imported by payload.config.ts,
  // which runs inside Next's build and dev server as well as at runtime, and
  // an exit code there is reported as an unexplained crash.
  throw new Error(
    `Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}\n\n` +
      `See backend/.env.example for the full list.`,
  )
}

export const env = {
  DATABASE_URI,
  PAYLOAD_SECRET,
  PGPOOL_MAX,
  cloudinaryConfigured,
  emailConfigured,
  instagramConfigured,
} as const
