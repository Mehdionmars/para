import { describe, expect, it } from 'vitest'

import {
  computeRoutineDiscount,
  parseRoutineLots,
  parseRoutineSettings,
  type RoutineProductFacts,
  type RoutineSettings,
} from '@/lib/routineOffer'

/**
 * The routine offer is money off an order, decided from a claim the browser
 * makes ("these products are a lot"). Every test below is a claim that must be
 * refused, or an amount computed by hand — so a change that lets a crafted
 * request buy a discount, or quietly changes what one is worth, fails here.
 */

const ON: RoutineSettings = { enabled: true, minItems: 2, percent: 15 }

const facts = (...list: RoutineProductFacts[]) => new Map(list.map((f) => [f.id, f]))
const visage = (id: number, relatedIds: number[] = []): RoutineProductFacts => ({ category: 'Visage', id, relatedIds })
const corps = (id: number, relatedIds: number[] = []): RoutineProductFacts => ({ category: 'Corps', id, relatedIds })

describe('computeRoutineDiscount', () => {
  it('takes 15% off one unit of each product in a valid lot', () => {
    const result = computeRoutineDiscount({
      facts: facts(visage(1), visage(2), visage(3)),
      lines: [
        { price: 400, productId: 1, quantity: 1 },
        { price: 370, productId: 2, quantity: 1 },
        { price: 160, productId: 3, quantity: 1 },
      ],
      lots: [{ anchorId: 1, productIds: [1, 2, 3] }],
      settings: ON,
    })
    // (400 + 370 + 160) × 15% = 139.5
    expect(result.discount).toBe(139.5)
    expect(result.lots).toEqual([{ anchorId: 1, discount: 139.5, productIds: [1, 2, 3] }])
  })

  it('discounts one unit per product, not every unit ordered', () => {
    const result = computeRoutineDiscount({
      facts: facts(visage(1), visage(2)),
      lines: [
        { price: 400, productId: 1, quantity: 3 },
        { price: 370, productId: 2, quantity: 1 },
      ],
      lots: [{ anchorId: 1, productIds: [1, 2] }],
      settings: ON,
    })
    expect(result.discount).toBe(115.5)
  })

  it('counts the cheapest option when a product is ordered under several', () => {
    const result = computeRoutineDiscount({
      facts: facts(visage(1), visage(2)),
      lines: [
        { price: 600, productId: 1, quantity: 1 },
        { price: 300, productId: 1, quantity: 1 },
        { price: 100, productId: 2, quantity: 1 },
      ],
      lots: [{ anchorId: 1, productIds: [1, 2] }],
      settings: ON,
    })
    expect(result.discount).toBe(60)
  })

  it('grants nothing when the offer is switched off', () => {
    const result = computeRoutineDiscount({
      facts: facts(visage(1), visage(2)),
      lines: [
        { price: 400, productId: 1, quantity: 1 },
        { price: 370, productId: 2, quantity: 1 },
      ],
      lots: [{ anchorId: 1, productIds: [1, 2] }],
      settings: { ...ON, enabled: false },
    })
    expect(result).toEqual({ discount: 0, lots: [] })
  })

  it('refuses two unrelated products from different categories', () => {
    // The tampering case: a shopper posts any two products as a "lot".
    const result = computeRoutineDiscount({
      facts: facts(visage(1), corps(2)),
      lines: [
        { price: 400, productId: 1, quantity: 1 },
        { price: 370, productId: 2, quantity: 1 },
      ],
      lots: [{ anchorId: 1, productIds: [1, 2] }],
      settings: ON,
    })
    expect(result.discount).toBe(0)
  })

  it('accepts a cross-category product picked as associated, from either side', () => {
    const fromAnchor = computeRoutineDiscount({
      facts: facts(visage(1, [2]), corps(2)),
      lines: [
        { price: 100, productId: 1, quantity: 1 },
        { price: 100, productId: 2, quantity: 1 },
      ],
      lots: [{ anchorId: 1, productIds: [1, 2] }],
      settings: ON,
    })
    const fromOther = computeRoutineDiscount({
      facts: facts(visage(1), corps(2, [1])),
      lines: [
        { price: 100, productId: 1, quantity: 1 },
        { price: 100, productId: 2, quantity: 1 },
      ],
      lots: [{ anchorId: 1, productIds: [1, 2] }],
      settings: ON,
    })
    expect(fromAnchor.discount).toBe(30)
    expect(fromOther.discount).toBe(30)
  })

  it('refuses a lot below the minimum, above three, or without its anchor', () => {
    const lines = [1, 2, 3, 4].map((productId) => ({ price: 100, productId, quantity: 1 }))
    const all = facts(visage(1), visage(2), visage(3), visage(4))
    const run = (lot: { anchorId: number; productIds: number[] }, settings = ON) =>
      computeRoutineDiscount({ facts: all, lines, lots: [lot], settings }).discount

    expect(run({ anchorId: 1, productIds: [1] })).toBe(0)
    expect(run({ anchorId: 1, productIds: [1, 2] }, { ...ON, minItems: 3 })).toBe(0)
    expect(run({ anchorId: 1, productIds: [1, 2, 3, 4] })).toBe(0)
    expect(run({ anchorId: 9, productIds: [1, 2] })).toBe(0)
  })

  it('refuses a lot naming a product that is not in the order', () => {
    const result = computeRoutineDiscount({
      facts: facts(visage(1), visage(2)),
      lines: [{ price: 400, productId: 1, quantity: 1 }],
      lots: [{ anchorId: 1, productIds: [1, 2] }],
      settings: ON,
    })
    expect(result.discount).toBe(0)
  })

  it('never counts one product towards two lots', () => {
    const result = computeRoutineDiscount({
      facts: facts(visage(1), visage(2), visage(3)),
      lines: [1, 2, 3].map((productId) => ({ price: 100, productId, quantity: 1 })),
      lots: [
        { anchorId: 1, productIds: [1, 2] },
        { anchorId: 3, productIds: [3, 2] },
      ],
      settings: ON,
    })
    expect(result.lots).toHaveLength(1)
    expect(result.discount).toBe(30)
  })
})

describe('parseRoutineSettings', () => {
  it('reads a configured offer', () => {
    expect(parseRoutineSettings({ enabled: true, minItems: 3, percent: 15 })).toEqual({ enabled: true, minItems: 3, percent: 15 })
  })

  it('switches the offer off rather than guess an unset or absurd percentage', () => {
    expect(parseRoutineSettings(undefined).enabled).toBe(false)
    expect(parseRoutineSettings({ enabled: true }).enabled).toBe(false)
    expect(parseRoutineSettings({ enabled: true, percent: 150 }).enabled).toBe(false)
    expect(parseRoutineSettings({ enabled: true, percent: -5 }).enabled).toBe(false)
  })

  it('keeps the minimum between two and three products', () => {
    expect(parseRoutineSettings({ enabled: true, minItems: 1, percent: 10 }).minItems).toBe(2)
    expect(parseRoutineSettings({ enabled: true, minItems: 9, percent: 10 }).minItems).toBe(3)
  })
})

describe('parseRoutineLots', () => {
  it('drops malformed entries instead of throwing', () => {
    expect(parseRoutineLots('nope')).toEqual([])
    expect(
      parseRoutineLots([
        null,
        { anchorId: 'x', productIds: [1] },
        { anchorId: 1, productIds: 'x' },
        { anchorId: 1, productIds: [1, '2', 2, -3, 4.5] },
      ]),
    ).toEqual([{ anchorId: 1, productIds: [1, 2] }])
  })

  it('bounds how many lots a request can claim', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ anchorId: i + 1, productIds: [i + 1] }))
    expect(parseRoutineLots(many)).toHaveLength(5)
  })
})
