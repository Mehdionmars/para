// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderEmailHtml } from '@/lib/notifications/emailTemplates'
import { emailProvider } from '@/lib/notifications/providers'
import { resendProvider } from '@/lib/notifications/providers/resend'
import type { NotificationContext } from '@/lib/notifications/types'

const ctx: NotificationContext = {
  customerEmail: 'client@paradhiver.test',
  customerName: 'Amina',
  customerPhone: '0600112233',
  event: 'ORDER_SHIPPED',
  itemCount: 3,
  orderId: 42,
  orderNumber: 'PDH-260822-AB12',
  status: 'shipped',
  total: 489,
}

describe('Email client', () => {
  const originalEnv = { ...process.env }
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    fetchSpy.mockRestore()
  })

  // ---------------------------------------------------------- templates

  it('produit un HTML de marque contenant les informations de la commande', () => {
    const html = renderEmailHtml(ctx)
    expect(html).toBeTruthy()
    expect(html).toContain('PDH-260822-AB12')
    expect(html).toContain('Amina')
    expect(html).toContain('489 MAD')
    expect(html).toContain('3 articles')
    expect(html).toContain('Para d&rsquo;Hiver')
  })

  it('inclut un lien de suivi vers le storefront', () => {
    const html = renderEmailHtml(ctx)!
    expect(html).toContain('/suivi-commande')
    expect(html).toContain('Suivre ma commande')
  })

  it('échappe le nom du client — il est fourni par l’utilisateur', () => {
    const html = renderEmailHtml({ ...ctx, customerName: '<script>alert(1)</script>' })!
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('couvre chaque événement de commande', () => {
    const events = [
      'ORDER_CREATED',
      'ORDER_CONFIRMED',
      'ORDER_PREPARING',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'ORDER_RETURNED',
      'ORDER_REFUNDED',
    ] as const

    for (const event of events) {
      const html = renderEmailHtml({ ...ctx, event })
      expect(html, `manque un template pour ${event}`).toBeTruthy()
      expect(html).toContain('<!doctype html>')
    }
  })

  it('les messages terminaux ne proposent pas de suivre la commande', () => {
    // Suivre un colis déjà livré ou une commande annulée n'a pas de sens.
    for (const event of ['ORDER_DELIVERED', 'ORDER_CANCELLED', 'ORDER_REFUNDED'] as const) {
      expect(renderEmailHtml({ ...ctx, event })).not.toContain('Suivre ma commande')
    }
  })

  // ----------------------------------------------------------- provider

  it('sans clé : rien n’est envoyé et rien n’est prétendu envoyé', async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    delete process.env.EMAIL_API_URL

    const result = await emailProvider.send({
      data: {},
      subject: 'Test',
      template: 'order-shipped',
      text: 'Corps',
      to: 'client@paradhiver.test',
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.skipped).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('le message d’aide nomme les deux configurations possibles', () => {
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_API_URL
    const reason = emailProvider.disabledReason()
    expect(reason).toContain('RESEND_API_KEY')
    expect(reason).toContain('EMAIL_API_URL')
  })

  it('avec une clé : appelle l’API Resend au bon format', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.EMAIL_FROM = "Para d'Hiver <commandes@paradhiver.test>"

    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ id: 'msg_123' }), { headers: { 'Content-Type': 'application/json' }, status: 200 }),
    )

    const result = await resendProvider.send({
      data: {},
      html: '<p>Bonjour</p>',
      subject: 'Commande expédiée',
      template: 'order-shipped',
      text: 'Bonjour',
      to: 'client@paradhiver.test',
    })

    expect(result.ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key')

    const body = JSON.parse(init.body as string)
    expect(body.to).toEqual(['client@paradhiver.test'])
    expect(body.html).toBe('<p>Bonjour</p>')
    expect(body.text).toBe('Bonjour')
    // `template` et `data` ne font pas partie du schéma Resend et seraient rejetés.
    expect(body.template).toBeUndefined()
    expect(body.data).toBeUndefined()
  })

  it('remonte le message d’erreur de Resend, pas un code nu', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.EMAIL_FROM = 'test@paradhiver.test'

    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ message: 'The from address is not verified.', name: 'validation_error' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 403,
      }),
    )

    const result = await resendProvider.send({
      data: {},
      subject: 'Test',
      template: 't',
      text: 'Corps',
      to: 'client@paradhiver.test',
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && 'error' in result && result.error).toContain('not verified')
  })

  it('Resend prime sur le provider HTTP générique quand les deux sont configurés', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.EMAIL_FROM = 'test@paradhiver.test'
    process.env.EMAIL_API_URL = 'https://autre-fournisseur.test/send'
    process.env.EMAIL_API_KEY = 'autre'

    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ id: 'x' }), { status: 200 }))

    await emailProvider.send({ data: {}, subject: 'S', template: 't', text: 'T', to: 'a@b.test' })

    const [url] = fetchSpy.mock.calls[0] as [string]
    expect(url).toBe('https://api.resend.com/emails')
  })
})
