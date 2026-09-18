import { describe, expect, it } from "vitest";
import { GIFT_OFF, giftProgress, isGiftBrand, parseGiftOffer } from "@/lib/cart/gift";

/**
 * The cart's gift preview must promise exactly what /api/checkout writes on
 * the order (backend/src/lib/giftOffer.ts): units of the brand, one gift, off
 * unless enabled with a brand.
 */

const offer = parseGiftOffer(
  { brand: { name: "Filorga", slug: "filorga" }, enabled: true, giftName: "Summer Trousse offerte", image: { url: "/v.jpg" }, minItems: 3 },
  (m) => (m as { url: string }).url,
);

describe("parseGiftOffer", () => {
  it("reads a populated group", () => {
    expect(offer).toEqual({
      brandName: "Filorga",
      brandSlug: "filorga",
      enabled: true,
      giftName: "Summer Trousse offerte",
      image: "/v.jpg",
      minItems: 3,
    });
  });

  it("is off when disabled, without a brand, or unreadable", () => {
    expect(parseGiftOffer({ brand: { name: "Filorga" }, enabled: false })).toEqual(GIFT_OFF);
    expect(parseGiftOffer({ brand: 7, enabled: true })).toEqual(GIFT_OFF);
    expect(parseGiftOffer(undefined)).toEqual(GIFT_OFF);
  });
});

describe("giftProgress", () => {
  it("counts units of the brand, ignoring case and accents", () => {
    expect(isGiftBrand(offer, "FILORGA")).toBe(true);
    expect(giftProgress(offer, [{ brand: "filorga", qty: 2 }, { brand: "Filorga", qty: 1 }])).toEqual({
      count: 3,
      granted: true,
      remaining: 0,
    });
  });

  it("says how many are still missing, not counting other brands", () => {
    expect(giftProgress(offer, [{ brand: "Filorga", qty: 1 }, { brand: "Uriage", qty: 4 }])).toEqual({
      count: 1,
      granted: false,
      remaining: 2,
    });
  });

  it("promises nothing while the offer is off", () => {
    expect(giftProgress(GIFT_OFF, [{ brand: "Filorga", qty: 9 }]).granted).toBe(false);
  });
});
