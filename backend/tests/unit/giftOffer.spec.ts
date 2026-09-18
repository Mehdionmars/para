import { describe, expect, it } from 'vitest'

import { computeGift, GIFT_DEFAULT_NAME, parseGiftSettings } from '@/lib/giftOffer'

/**
 * The gift offer promises a physical item in the parcel. Each test is a cart
 * that must or must not earn it, or a CMS entry that must switch it off.
 */

const ON = parseGiftSettings({ brand: 7, enabled: true, giftName: 'Summer Trousse offerte', minItems: 3 })

describe('parseGiftSettings', () => {
  it('reads a complete group, with the brand as an id or a populated document', () => {
    expect(ON).toEqual({ brandId: 7, enabled: true, giftName: 'Summer Trousse offerte', minItems: 3 })
    expect(parseGiftSettings({ brand: { id: 7, name: 'Filorga' }, enabled: true, minItems: 3 }).brandId).toBe(7)
  })

  it('is off without a brand, even when enabled', () => {
    expect(parseGiftSettings({ enabled: true, minItems: 3 }).enabled).toBe(false)
  })

  it('is off when not explicitly enabled', () => {
    expect(parseGiftSettings({ brand: 7, minItems: 3 }).enabled).toBe(false)
    expect(parseGiftSettings(null).enabled).toBe(false)
  })

  it('clamps the threshold and names an unnamed gift', () => {
    expect(parseGiftSettings({ brand: 7, enabled: true, minItems: 0 }).minItems).toBe(1)
    expect(parseGiftSettings({ brand: 7, enabled: true, minItems: 500 }).minItems).toBe(20)
    expect(parseGiftSettings({ brand: 7, enabled: true, giftName: '  ' }).giftName).toBe(GIFT_DEFAULT_NAME)
  })
})

describe('computeGift', () => {
  it('counts units of the brand, not distinct products', () => {
    expect(computeGift({ lines: [{ brandId: 7, quantity: 3 }], settings: ON })).toEqual({
      count: 3,
      giftLabel: 'Summer Trousse offerte',
      granted: true,
    })
  })

  it('stops one short of the threshold', () => {
    const result = computeGift({ lines: [{ brandId: 7, quantity: 1 }, { brandId: 7, quantity: 1 }], settings: ON })
    expect(result).toEqual({ count: 2, giftLabel: null, granted: false })
  })

  it('ignores other brands and unbranded products', () => {
    const lines = [
      { brandId: 7, quantity: 2 },
      { brandId: 8, quantity: 5 },
      { brandId: null, quantity: 5 },
    ]
    expect(computeGift({ lines, settings: ON }).granted).toBe(false)
  })

  it('grants one gift however far past the threshold', () => {
    expect(computeGift({ lines: [{ brandId: 7, quantity: 9 }], settings: ON }).giftLabel).toBe('Summer Trousse offerte')
  })

  it('grants nothing while the offer is off', () => {
    const off = { ...ON, enabled: false }
    expect(computeGift({ lines: [{ brandId: 7, quantity: 9 }], settings: off }).granted).toBe(false)
  })
})
