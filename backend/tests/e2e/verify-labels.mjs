import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { height: 900, width: 1440 } })

await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => {
  localStorage.setItem('pdh-cart', JSON.stringify([{ id: 785, qty: 2 }, { id: 793, qty: 1 }]))
})
await page.goto('http://localhost:3000/panier', { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.getByRole('button', { name: /Passer la commande/i }).click()
await page.waitForTimeout(500)

const labels = await page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('input, select, textarea')) {
    if (el.type === 'hidden' || el.type === 'search') continue
    const lbl = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null
    out.push({
      accessibleName: lbl?.textContent?.trim().replace(/\s+/g, ' ') || el.getAttribute('aria-label') || '❌ AUCUN',
      field: el.tagName + (el.type ? ':' + el.type : ''),
    })
  }
  return out
})
console.log('=== noms accessibles des champs ===')
labels.forEach((l) => console.log(`  ${l.field.padEnd(16)} → ${l.accessibleName}`))

// Submit empty and inspect how the errors are exposed.
await page.getByRole('button', { name: /Confirmer|Commander|Valider/i }).first().click()
await page.waitForTimeout(700)

const errs = await page.evaluate(() => ({
  alerts: [...document.querySelectorAll('[role="alert"]')].map((e) => e.textContent?.trim().slice(0, 46)),
  describedResolves: [...document.querySelectorAll('[aria-describedby]')].every((e) =>
    e.getAttribute('aria-describedby').split(' ').every((id) => document.getElementById(id)),
  ),
  focused:
    document.activeElement?.id && document.querySelector(`label[for="${CSS.escape(document.activeElement.id)}"]`)
      ? document.querySelector(`label[for="${CSS.escape(document.activeElement.id)}"]`).textContent.trim()
      : document.activeElement?.tagName,
  invalid: document.querySelectorAll('[aria-invalid="true"]').length,
}))

console.log('\n=== soumission vide ===')
console.log('  champs aria-invalid :', errs.invalid)
console.log('  messages role=alert :', errs.alerts)
console.log('  aria-describedby pointe vers un élément existant :', errs.describedResolves)
console.log('  focus placé sur      :', errs.focused)

// A valid-looking but malformed email must still be caught.
await page.fill('input[autocomplete="name"]', 'Test Client')
await page.fill('input[autocomplete="email"]', 'pas-un-email')
await page.fill('textarea', '12 rue test')
await page.getByRole('button', { name: /Confirmer|Commander|Valider/i }).first().click()
await page.waitForTimeout(500)
console.log(
  '\n  email malformé →',
  await page.evaluate(() => [...document.querySelectorAll('[role="alert"]')].map((e) => e.textContent?.trim())),
)

await browser.close()
