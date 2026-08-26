/**
 * Interactive-surface audit.
 *
 * Walks the storefront (and, with a session, the dashboard) and measures every
 * interactive element against two things a screenshot cannot tell you:
 *
 *   OVERSIZED  the element's box is far wider than the ink inside it — the
 *              "whole row is a link" problem. Measured as the gap between the
 *              element's width and the union of its text/icon children, so a
 *              deliberately full-width CTA whose label is centred still reads
 *              as oversized only when the padding is doing nothing.
 *
 *   SMALL      a tap target under 44x44, which on a phone means a control the
 *              thumb misses.
 *
 * Both are reported, never "fixed" automatically: a full-width "Ajouter au
 * panier" and a full-width contact line look identical to a measurement and
 * are opposite judgements. The list is for a human to read.
 *
 * Usage:
 *   node tests/audit/clickTargets.mjs [--width 390]
 */
import { chromium } from '@playwright/test'

const SHOP = process.env.AUDIT_SHOP_URL || 'http://paradhiver.test:3002'
const DASH = process.env.AUDIT_DASH_URL || 'http://localhost:3002'
const WIDTH = Number(process.argv.includes('--width') ? process.argv[process.argv.indexOf('--width') + 1] : 390)

const SHOP_PAGES = ['/', '/catalogue', '/marques', '/contact', '/services', '/panier']
const DASH_PAGES = ['/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/notifications']

/** How much wider than its own content an element may be before it is worth
 * a human look. Generous: real buttons carry real padding. */
const OVERSIZE_RATIO = 2.5
const OVERSIZE_ABSOLUTE_PX = 120
const MIN_TAP = 44

const MEASURE = ({ minTap, ratio, absolute }) => {
  const results = { oversized: [], small: [] }
  const selector = 'a, button, [role="button"], input, select, textarea, summary'

  for (const el of document.querySelectorAll(selector)) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none') continue

    // Off-canvas drawers (the dashboard sidebar parks at x = -220 on a phone)
    // and anything scrolled far out of view are not surfaces anyone can tap.
    // Counting them turned a desktop-only 24px affordance into a "mobile tap
    // target too small" finding, which is exactly the kind of noise that makes
    // an audit report get ignored.
    if (rect.right <= 0 || rect.left >= window.innerWidth) continue
    if (el.closest('[aria-hidden="true"]')) continue

    const describe = () =>
      (el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName).replace(/\s+/g, ' ').slice(0, 42)

    // Tap size: only for controls small enough that a thumb is the input, and
    // only for genuinely interactive ones (a disabled control is not a target).
    if ((rect.width < minTap || rect.height < minTap) && !el.hasAttribute('disabled')) {
      results.small.push({
        h: Math.round(rect.height),
        tag: el.tagName.toLowerCase(),
        text: describe(),
        w: Math.round(rect.width),
      })
    }

    // Ink width: the union of the element's own text runs and replaced
    // children. Ranges give the real drawn width of text, which is the whole
    // point — `el.scrollWidth` would just report the padded box again.
    let inkLeft = Infinity
    let inkRight = -Infinity
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      if (node.textContent.trim()) {
        const range = document.createRange()
        range.selectNodeContents(node)
        const r = range.getBoundingClientRect()
        if (r.width > 0) {
          inkLeft = Math.min(inkLeft, r.left)
          inkRight = Math.max(inkRight, r.right)
        }
      }
      node = walker.nextNode()
    }
    for (const child of el.querySelectorAll('svg, img, canvas')) {
      const r = child.getBoundingClientRect()
      if (r.width > 0) {
        inkLeft = Math.min(inkLeft, r.left)
        inkRight = Math.max(inkRight, r.right)
      }
    }
    if (inkRight <= inkLeft) continue

    const ink = inkRight - inkLeft
    const slack = rect.width - ink
    if (rect.width > ink * ratio && slack > absolute) {
      results.oversized.push({
        ink: Math.round(ink),
        slack: Math.round(slack),
        tag: el.tagName.toLowerCase(),
        text: describe(),
        w: Math.round(rect.width),
      })
    }
  }
  return results
}

async function auditPages(browser, base, paths, { cookies } = {}) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 900 } })
  if (cookies) await ctx.addCookies(cookies)
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('hmr') && consoleErrors.push(m.text()))
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

  for (const path of paths) {
    try {
      await page.goto(base + path, { waitUntil: 'networkidle', timeout: 45000 })
    } catch {
      console.log(`  ${path}: injoignable`)
      continue
    }
    await page.waitForTimeout(600)
    const r = await page.evaluate(MEASURE, { absolute: OVERSIZE_ABSOLUTE_PX, minTap: MIN_TAP, ratio: OVERSIZE_RATIO })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )

    console.log(
      `  ${path.padEnd(24)} surdimensionnés ${String(r.oversized.length).padStart(2)} · ` +
        `cibles <44px ${String(r.small.length).padStart(2)} · overflow ${overflow}px`,
    )
    for (const o of r.oversized.slice(0, 6)) {
      console.log(`      [large] <${o.tag}> "${o.text}" — ${o.w}px de large pour ${o.ink}px de contenu`)
    }
    for (const s of r.small.slice(0, 6)) {
      console.log(`      [petit] <${s.tag}> "${s.text}" — ${s.w}x${s.h}`)
    }
  }
  if (consoleErrors.length) {
    console.log(`  erreurs console: ${consoleErrors.length}`)
    consoleErrors.slice(0, 3).forEach((e) => console.log('      ' + e.slice(0, 120)))
  }
  await ctx.close()
}

const browser = await chromium.launch({ args: ['--host-resolver-rules=MAP paradhiver.test 127.0.0.1'] })

console.log(`\n=== STOREFRONT @ ${WIDTH}px ===`)
await auditPages(browser, SHOP, SHOP_PAGES)

// The dashboard needs a session; skipped silently when no credentials are
// supplied rather than reporting a login page as if it were the dashboard.
if (process.env.AUDIT_EMAIL && process.env.AUDIT_PASSWORD) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${DASH}/dashboard/login`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.fill('input[type=email]', process.env.AUDIT_EMAIL)
  await page.fill('input[type=password]', process.env.AUDIT_PASSWORD)
  await Promise.all([page.waitForNavigation({ timeout: 45000 }).catch(() => {}), page.click('button[type=submit]')])
  const cookies = await ctx.cookies()
  await ctx.close()

  console.log(`\n=== DASHBOARD @ ${WIDTH}px ===`)
  await auditPages(browser, DASH, DASH_PAGES, { cookies })
} else {
  console.log('\n=== DASHBOARD: ignoré (AUDIT_EMAIL / AUDIT_PASSWORD non fournis) ===')
}

await browser.close()
