import { chromium } from 'playwright'

const WIDTHS = [320, 375, 390, 414, 768, 1024, 1366, 1920]
const CREDS = { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD }
const ORDER_ID = process.env.E2E_ORDER_ID

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { height: 900, width: 1440 } })
const page = await ctx.newPage()

// Sign in once; the session cookie then covers every viewport below.
await page.goto('http://localhost:3000/dashboard/login', { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', CREDS.email)
await page.fill('input[type="password"]', CREDS.password)
await page.click('button[type="submit"]')
await page.waitForURL(/\/dashboard(?!\/login)/, { timeout: 20000 })
console.log('connecté ✓')

const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 110)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 110))
})

for (const width of WIDTHS) {
  await page.setViewportSize({ height: 900, width })
  await page.goto(`http://localhost:3000/dashboard/orders/${ORDER_ID}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(350)

  const r = await page.evaluate(() => {
    const clipped = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX
        if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return true
      }
      return false
    }
    const over = []
    for (const el of document.querySelectorAll('main *')) {
      const b = el.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) continue
      if (b.right > window.innerWidth + 1 && !clipped(el)) {
        over.push(`<${el.tagName.toLowerCase()} class="${(el.className?.toString?.() || '').slice(0, 34)}">`)
      }
    }

    const summary = [...document.querySelectorAll('section')].find((s) =>
      s.textContent?.includes('Résumé'),
    )
    const details = document.querySelectorAll('details')

    return {
      docScroll: document.documentElement.scrollWidth,
      accordions: details.length,
      accordionsClosed: [...details].filter((d) => !d.open).length,
      contentHeight: Math.round(document.querySelector('main')?.scrollHeight ?? 0),
      inner: window.innerWidth,
      over: [...new Set(over)].slice(0, 3),
      summarySticky: summary ? getComputedStyle(summary).position : 'introuvable',
    }
  })

  const overflow = r.docScroll > r.inner || r.over.length > 0
  console.log(
    `${String(width).padStart(5)}px  ${overflow ? '❌ OVERFLOW ' + r.over.join(' ') : '✓ pas de débordement'}` +
      `  | résumé: ${r.summarySticky} | accordéons: ${r.accordionsClosed}/${r.accordions} fermés | hauteur: ${r.contentHeight}px`,
  )
}

// Keyboard reachability of the collapsibles.
await page.setViewportSize({ height: 900, width: 1366 })
await page.goto(`http://localhost:3000/dashboard/orders/${ORDER_ID}`, { waitUntil: 'networkidle' })
const kb = await page.evaluate(() => {
  const s = document.querySelector('details summary')
  if (!s) return 'aucun accordéon'
  s.focus()
  return document.activeElement === s ? 'focusable ✓' : 'NON focusable ✗'
})
console.log('accordéon au clavier :', kb)

await page.locator('details summary').first().press('Enter')
await page.waitForTimeout(200)
console.log('Entrée ouvre :', await page.evaluate(() => document.querySelector('details')?.open))

await page.setViewportSize({ height: 900, width: 1366 })
await page.screenshot({ path: 'order-desktop.png', fullPage: true })
await page.setViewportSize({ height: 812, width: 375 })
await page.reload({ waitUntil: 'networkidle' })
await page.screenshot({ path: 'order-mobile.png', fullPage: true })

console.log('erreurs console/hydratation :', errors.length ? errors.slice(0, 2) : 'aucune')
await browser.close()
