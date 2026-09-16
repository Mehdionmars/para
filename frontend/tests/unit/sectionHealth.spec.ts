import { describe, expect, it } from "vitest";

import { hiddenReason } from "@/lib/dashboard/sectionHealth";
import type { HomeDraft } from "@/lib/dashboard/storefront-mapping";

/**
 * The builder's "hidden on the site" hints. Each case is one of the five
 * blocks that were ticked visible on preprod and rendered nothing
 * (September 2026), plus the states that must NOT raise a hint.
 */

const NO_IMAGE = { url: "" };
const IMAGE = { id: 1, url: "/api/media/file/x.jpg" };

function draft(patch: Partial<HomeDraft>): HomeDraft {
  const base = {
    brandsFeatured: [],
    campaignProducts: [],
    coffrets: [],
    ctaBannerCopy: { ctaColor: "", ctaLabel: "Nous contacter", ctaUrl: "", bg: "", description: "", eyebrow: "", textColor: "", title: "Un conseil" },
    imageCarouselCopy: { ctaLabel: "", ctaUrl: "", eyebrow: "", image: IMAGE, picksTitle: "", subtitle: "", title: "" },
    imageCarouselProducts: [],
    instagram: { ctaText: "", ctaUrl: "", postCount: 6, show: true, subtitle: "", title: "", username: "" },
    marketingBanners: [],
    servicesTeaser: [],
    summerEditActs: [],
    summerEditCopy: { heroImage: NO_IMAGE },
  };
  return { ...base, ...patch } as unknown as HomeDraft;
}

describe("hiddenReason", () => {
  it("explains the five blocks preprod hid", () => {
    const d = draft({
      campaignProducts: [
        { id: 76, label: "A", sellable: false },
        { id: 56, label: "B", sellable: false },
      ],
      summerEditActs: [{ description: "", eyebrow: "", products: [{ id: 1, label: "x" }], title: "" }] as HomeDraft["summerEditActs"],
    });
    expect(hiddenReason("summerEdit", d)).toBe("aucune image principale");
    expect(hiddenReason("services", d)).toBe("aucune carte service");
    expect(hiddenReason("campaign", d)).toBe("les produits choisis sont non publiés ou en rupture");
    expect(hiddenReason("brandsFeatured", d)).toBe("aucune marque choisie");
    expect(hiddenReason("instagram", d, { instagramPostCount: 0 })).toBe("aucune publication synchronisée");
  });

  it("says nothing about a block that will show", () => {
    const d = draft({
      campaignProducts: [
        { id: 76, label: "A", sellable: false },
        { id: 163, label: "B", sellable: true },
      ],
      coffrets: [{ active: true }] as HomeDraft["coffrets"],
    });
    expect(hiddenReason("campaign", d)).toBeNull();
    expect(hiddenReason("coffrets", d)).toBeNull();
    expect(hiddenReason("ctaBanner", d)).toBeNull();
    expect(hiddenReason("instagram", d, { instagramPostCount: 12 })).toBeNull();
    // Unknown post count: no claim either way.
    expect(hiddenReason("instagram", d)).toBeNull();
    // Rails depend on live stock the draft does not hold.
    expect(hiddenReason("rail:nouveautes", d)).toBeNull();
  });

  it("gives a freshly added pick the benefit of the doubt", () => {
    expect(hiddenReason("campaign", draft({ campaignProducts: [{ id: 9, label: "Nouveau" }] }))).toBeNull();
  });

  it("follows the marketing banner's schedule", () => {
    const now = Date.UTC(2026, 8, 16);
    const banner = { active: true, endDate: "2026-08-31", image: IMAGE, startDate: "" };
    const d = draft({ marketingBanners: [banner] as HomeDraft["marketingBanners"] });
    expect(hiddenReason("marketingBanner", d, { now })).toBe("aucune campagne active à cette date");
    const current = draft({ marketingBanners: [{ ...banner, endDate: "" }] as HomeDraft["marketingBanners"] });
    expect(hiddenReason("marketingBanner", current, { now })).toBeNull();
    const noImage = draft({ marketingBanners: [{ ...banner, endDate: "", image: NO_IMAGE }] as HomeDraft["marketingBanners"] });
    expect(hiddenReason("marketingBanner", noImage, { now })).toBe("la campagne active n'a pas d'image");
  });
});
