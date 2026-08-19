import { expect, test, type Page } from '@playwright/test'

/**
 * Responsive regression suite.
 *
 * Guards the bug this was written for: product cards carried a hard-coded
 * 236px width, which divided the row correctly at no viewport at all. At
 * 1366×768 — the reported case — five cards plus their gaps came to 1252px
 * inside a 1216px row, so the fifth was permanently sliced and read as a
 * missing product.
 *
 * The assertions below are deliberately about *measurements*, not
 * screenshots: they fail for the reason the bug existed rather than for any
 * unrelated visual change.
 */

// The shared config leaves baseURL unset (it is used for admin tests that
// target the CMS on :3001), so the storefront origin is pinned here.
test.use({ baseURL: process.env.STOREFRONT_URL || 'http://localhost:3000' })

const VIEWPORTS = [
  { height: 640, name: 'mobile-320', width: 320 },
  { height: 812, name: 'mobile-375', width: 375 },
  { height: 844, name: 'mobile-390', width: 390 },
  { height: 896, name: 'mobile-414', width: 414 },
  { height: 1024, name: 'tablet-768', width: 768 },
  { height: 1180, name: 'tablet-820', width: 820 },
  { height: 768, name: 'tablet-1024', width: 1024 },
  { height: 720, name: 'laptop-1280', width: 1280 },
  { height: 768, name: 'laptop-1366', width: 1366 },
  { height: 900, name: 'laptop-1440', width: 1440 },
  { height: 864, name: 'desktop-1536', width: 1536 },
  { height: 1080, name: 'desktop-1920', width: 1920 },
]

const PAGES = ['/', '/catalogue']

/**
 * An element wider than the viewport is only a defect if nothing clips it.
 *
 * Rails scroll on purpose, and the two marquees (topbar ticker, brand strip)
 * are animated rows deliberately wider than their `overflow: hidden` parent.
 * Rather than maintaining a list of exempt selectors — which silently rots as
 * components are added — this walks up the ancestor chain and skips anything
 * already contained by a clipping or scrolling box. What is left is genuine
 * overflow: an element that really does push the page sideways.
 */
const IS_CLIPPED = `
  (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return true;
    }
    return false;
  }
`

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  // Entrance animations use `rise .5s`; let them finish before measuring.
  await page.waitForTimeout(700)
}

test.describe('Responsive — aucun débordement horizontal', () => {
  for (const vp of VIEWPORTS) {
    for (const path of PAGES) {
      test(`${vp.name} (${vp.width}px) — ${path}`, async ({ page }) => {
        await page.setViewportSize({ height: vp.height, width: vp.width })
        await page.goto(path)
        await settle(page)

        const result = await page.evaluate((isClippedSrc) => {
          const isClipped = eval(isClippedSrc) as (el: HTMLElement) => boolean
          const offenders: string[] = []

          for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0) continue
            if (r.right <= window.innerWidth + 1) continue
            if (isClipped(el)) continue
            offenders.push(
              `<${el.tagName.toLowerCase()} class="${(el.className?.toString?.() || '').slice(0, 40)}"> right=${Math.round(r.right)}`,
            )
          }

          return {
            docScrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            offenders: offenders.slice(0, 5),
          }
        }, IS_CLIPPED)

        expect(result.offenders, `éléments débordants : ${result.offenders.join(' | ')}`).toEqual([])
        expect(result.docScrollWidth).toBeLessThanOrEqual(result.innerWidth)
      })
    }
  }
})

test.describe('Rails produits — cartes entières et scrollables', () => {
  /** How many whole cards must be visible at each width. */
  const EXPECTED_FULL_CARDS: [number, number][] = [
    [375, 2],
    [768, 3],
    [1024, 4],
    [1280, 5],
    [1366, 5],
    [1920, 5],
  ]

  for (const [width, expectedCards] of EXPECTED_FULL_CARDS) {
    test(`${width}px — ${expectedCards} cartes entières dans le rail principal`, async ({ page }) => {
      await page.setViewportSize({ height: 900, width })
      await page.goto('/')
      await settle(page)

      const m = await page.evaluate(() => {
        // The first full-width product rail ("Les essentiels de la saison").
        const rail = document.querySelector<HTMLElement>('.rail')
        if (!rail) return null
        const box = rail.getBoundingClientRect()
        const cards = Array.from(rail.children).map((c) => c.getBoundingClientRect())
        return {
          // Sub-pixel layout means an exact fit can land a hair over.
          fullyVisible: cards.filter((c) => c.right - box.left <= box.width + 1).length,
          lastVisibleRight: cards.length ? cards[0].width : 0,
          railWidth: box.width,
          scrollable: rail.scrollWidth > rail.clientWidth + 1,
          total: cards.length,
        }
      })

      expect(m).not.toBeNull()
      expect(m!.total).toBeGreaterThan(expectedCards)
      expect(m!.fullyVisible).toBe(expectedCards)
      // More products than fit means the row must still be reachable.
      expect(m!.scrollable).toBe(true)
      // No card may be wider than the row that holds it.
      expect(m!.lastVisibleRight).toBeLessThanOrEqual(m!.railWidth + 1)
    })
  }

  test('1366×768 — régression : la 5e carte n’est plus tronquée', async ({ page }) => {
    await page.setViewportSize({ height: 768, width: 1366 })
    await page.goto('/')
    await settle(page)

    const fifth = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>('.rail')!
      const box = rail.getBoundingClientRect()
      const card = rail.children[4]?.getBoundingClientRect()
      if (!card) return null
      return { overflowPx: +(card.right - box.right).toFixed(1) }
    })

    expect(fifth).not.toBeNull()
    // Was +36px before the fix.
    expect(fifth!.overflowPx).toBeLessThanOrEqual(1)
  })

  /**
   * Falsification check: proves the assertion above can actually fail.
   *
   * Re-injects the old hard-coded card width at runtime and confirms the same
   * measurement then reports a truncated fifth card. Without this, a test
   * asserting "nothing overflows" would keep passing even if it were pointed
   * at the wrong element.
   */
  test('le contrôle détecte bien une largeur fixe réintroduite', async ({ page }) => {
    await page.setViewportSize({ height: 768, width: 1366 })
    await page.goto('/')
    await settle(page)

    await page.addStyleTag({
      content: '.rail > * { flex: 0 0 236px !important; }',
    })
    await page.waitForTimeout(200)

    const fifth = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>('.rail')!
      const box = rail.getBoundingClientRect()
      const card = rail.children[4].getBoundingClientRect()
      return +(card.right - box.right).toFixed(1)
    })

    // 5 × 236 + 4 × 18 = 1252 in a 1216px row — the original defect.
    expect(fifth).toBeGreaterThan(1)
  })

  test('les flèches font défiler le rail', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1366 })
    await page.goto('/')
    await settle(page)

    const rail = page.locator('.rail').first()
    const before = await rail.evaluate((el) => el.scrollLeft)

    await page.getByRole('button', { name: 'Produits suivants' }).first().click()
    await page.waitForTimeout(700)
    const after = await rail.evaluate((el) => el.scrollLeft)
    expect(after).toBeGreaterThan(before)

    await page.getByRole('button', { name: 'Produits précédents' }).first().click()
    await page.waitForTimeout(700)
    expect(await rail.evaluate((el) => el.scrollLeft)).toBeLessThan(after)
  })

  test('chaque rail affiche au moins une carte produit visible', async ({ page }) => {
    for (const width of [375, 1024, 1366]) {
      await page.setViewportSize({ height: 900, width })
      await page.goto('/')
      await settle(page)

      const hidden = await page.evaluate(() => {
        const bad: number[] = []
        document.querySelectorAll<HTMLElement>('.rail').forEach((rail, i) => {
          const first = rail.firstElementChild as HTMLElement | null
          if (!first) return
          const r = first.getBoundingClientRect()
          const painted = Number(getComputedStyle(first).opacity) > 0.05
          if (r.width < 40 || r.height < 40 || !painted) bad.push(i)
        })
        return bad
      })

      expect(hidden, `rails sans carte visible à ${width}px`).toEqual([])
    }
  })
})
