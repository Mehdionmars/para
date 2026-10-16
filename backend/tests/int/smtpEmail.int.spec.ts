// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sendMail = vi.fn()
const createTransport = vi.fn(() => ({ close: vi.fn(), sendMail }))
vi.mock('nodemailer', () => ({ default: { createTransport } }))

const { emailProvider } = await import('@/lib/notifications/providers')
const { smtpProvider } = await import('@/lib/notifications/providers/smtp')

const payload = {
  data: {},
  html: '<p>Bonjour</p>',
  subject: 'Commande expédiée',
  template: 'order-shipped',
  text: 'Bonjour',
  to: 'client@paradhiver.test',
}

describe('SMTP email provider', () => {
  const originalEnv = { ...process.env }
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_API_URL
    delete process.env.EMAIL_API_KEY
    process.env.SMTP_HOST = 'smtp.nindomail.test'
    process.env.SMTP_USER = 'contact@paradhiver.test'
    process.env.SMTP_PASS = 'secret'
    process.env.EMAIL_FROM = "Para d'Hiver <contact@paradhiver.test>"
    delete process.env.SMTP_PORT
    sendMail.mockReset()
    createTransport.mockClear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    fetchSpy.mockRestore()
  })

  it('sans mot de passe : rien n’est envoyé', async () => {
    delete process.env.SMTP_PASS
    const result = await smtpProvider.send(payload)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.skipped).toBe(true)
    expect(smtpProvider.disabledReason()).toContain('SMTP_PASS')
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('envoie via SMTP en TLS implicite sur le port 465 par défaut', async () => {
    sendMail.mockResolvedValue({ messageId: 'x' })
    const result = await emailProvider.send(payload)

    expect(result.ok).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: { pass: 'secret', user: 'contact@paradhiver.test' },
        host: 'smtp.nindomail.test',
        port: 465,
        secure: true,
      }),
    )
    expect(sendMail).toHaveBeenCalledWith({
      from: "Para d'Hiver <contact@paradhiver.test>",
      html: '<p>Bonjour</p>',
      subject: 'Commande expédiée',
      text: 'Bonjour',
      to: 'client@paradhiver.test',
    })
  })

  it('exige STARTTLS sur le port 587', async () => {
    process.env.SMTP_PORT = '587'
    sendMail.mockResolvedValue({})
    await smtpProvider.send(payload)
    expect(createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ port: 587, requireTLS: true, secure: false }),
    )
  })

  it('nomme un échec d’authentification', async () => {
    sendMail.mockRejectedValue(Object.assign(new Error('Invalid login'), { code: 'EAUTH', responseCode: 535 }))
    const result = await smtpProvider.send(payload)
    expect(result.ok).toBe(false)
    expect(!result.ok && 'error' in result && result.error).toContain('authentification refusée')
  })

  it('Resend prime sur SMTP quand les deux sont configurés', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ id: 'x' }), { status: 200 }))
    await emailProvider.send(payload)
    expect(sendMail).not.toHaveBeenCalled()
    expect((fetchSpy.mock.calls[0] as [string])[0]).toBe('https://api.resend.com/emails')
  })
})
