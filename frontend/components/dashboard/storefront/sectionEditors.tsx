"use client";

import type { ReactNode } from "react";
import {
  BrandsFeaturedEditor,
  BrandsMarqueeEditor,
  CampaignEditor,
  CoffretsCopyEditor,
  CoffretsEditor,
  CtaPairEditor,
  CtaBannerEditor,
  DermoCornerCopyEditor,
  DermoPicksEditor,
  HeroSlidesEditor,
  ImageCarouselEditor,
  InstagramEditor,
  MarketingBannersEditor,
  NewsletterEditor,
  PromotionsGridEditor,
  ServicesEditor,
  SummerEditActsEditor,
  SummerEditCopyEditor,
  TrustBadgesEditor,
} from "@/components/dashboard/storefront/editors";
import type { HomeDraft, SectionKey } from "@/lib/dashboard/storefront-mapping";

export type BrandOption = { id: number; name: string; slug: string };

export type SectionEditorContext = {
  draft: HomeDraft;
  update: (patch: Partial<HomeDraft>) => void;
  brands: BrandOption[];
};

/**
 * Which editor answers for each homepage section.
 *
 * The type is the point. `Record<SectionKey, …>` is exhaustive, so adding a
 * section to the CMS and forgetting to wire an editor is a compile error
 * rather than a silent blank panel — which is exactly what used to happen:
 * this dispatch was a `switch` ending in `default: return null`, and
 * `featuredPromo` had no case, so selecting it in the builder showed nothing
 * at all and gave the operator no way to tell a missing editor from a section
 * with no settings.
 *
 * `null` states that distinction explicitly: the section is real and can be
 * reordered or hidden, but has no editable content. It is a deliberate entry,
 * not an omission — and the compiler still demands one.
 *
 * Two sections that pair a copy editor with a list editor render both here
 * rather than in a wrapper, so the registry stays the one place that answers
 * "what do I see when I select this?".
 */
export const SECTION_EDITORS: Record<SectionKey, ((ctx: SectionEditorContext) => ReactNode) | null> = {
  hero: ({ draft, update, brands }) => (
    <HeroSlidesEditor value={draft.heroSlides} onChange={(heroSlides) => update({ heroSlides })} brands={brands} />
  ),

  marketingBanner: ({ draft, update }) => (
    <MarketingBannersEditor
      value={draft.marketingBanners}
      onChange={(marketingBanners) => update({ marketingBanners })}
    />
  ),

  ctaPair1: ({ draft, update }) => (
    <CtaPairEditor
      title="CTA — paire d'images (haut)"
      value={draft.ctaPair1}
      onChange={(ctaPair1) => update({ ctaPair1 })}
    />
  ),

  ctaPair2: ({ draft, update }) => (
    <CtaPairEditor
      title="CTA — paire d'images (bas)"
      value={draft.ctaPair2}
      onChange={(ctaPair2) => update({ ctaPair2 })}
    />
  ),

  promotionsGrid: ({ draft, update }) => (
    <PromotionsGridEditor value={draft.promotionsGrid} onChange={(promotionsGrid) => update({ promotionsGrid })} />
  ),

  /**
   * No CMS fields exist for this section — it is a key, a label and a group in
   * globals/Home.ts and nothing more, so /api/globals/home returns no
   * `featuredPromo` object and the storefront component falls back to its own
   * copy. Reordering and hiding it work; there is simply nothing to edit yet.
   */
  featuredPromo: null,

  coffrets: ({ draft, update }) => (
    <div className="flex flex-col gap-6">
      <CoffretsCopyEditor value={draft.coffretsCopy} onChange={(coffretsCopy) => update({ coffretsCopy })} />
      <div className="border-t border-gray-100 pt-4">
        <CoffretsEditor value={draft.coffrets} onChange={(coffrets) => update({ coffrets })} />
      </div>
    </div>
  ),

  campaign: ({ draft, update }) => (
    <CampaignEditor
      copy={draft.campaignCopy}
      products={draft.campaignProducts}
      onChangeCopy={(campaignCopy) => update({ campaignCopy })}
      onChangeProducts={(campaignProducts) => update({ campaignProducts })}
    />
  ),

  ctaBanner: ({ draft, update }) => (
    <CtaBannerEditor value={draft.ctaBannerCopy} onChange={(ctaBannerCopy) => update({ ctaBannerCopy })} />
  ),

  dermoCorner: ({ draft, update }) => (
    <div className="flex flex-col gap-6">
      <DermoCornerCopyEditor
        value={draft.dermoCornerCopy}
        onChange={(dermoCornerCopy) => update({ dermoCornerCopy })}
      />
      <div className="border-t border-gray-100 pt-4">
        <DermoPicksEditor value={draft.dermoPicks} onChange={(dermoPicks) => update({ dermoPicks })} />
      </div>
    </div>
  ),

  imageCarousel: ({ draft, update }) => (
    <ImageCarouselEditor
      copy={draft.imageCarouselCopy}
      products={draft.imageCarouselProducts}
      onChangeCopy={(imageCarouselCopy) => update({ imageCarouselCopy })}
      onChangeProducts={(imageCarouselProducts) => update({ imageCarouselProducts })}
    />
  ),

  summerEdit: ({ draft, update }) => (
    <div className="flex flex-col gap-6">
      <SummerEditCopyEditor value={draft.summerEditCopy} onChange={(summerEditCopy) => update({ summerEditCopy })} />
      <div className="border-t border-gray-100 pt-4">
        <SummerEditActsEditor value={draft.summerEditActs} onChange={(summerEditActs) => update({ summerEditActs })} />
      </div>
    </div>
  ),

  brandsFeatured: ({ draft, update, brands }) => (
    <BrandsFeaturedEditor
      value={draft.brandsFeatured}
      onChange={(brandsFeatured) => update({ brandsFeatured })}
      brands={brands}
    />
  ),

  brandsMarquee: ({ draft, update, brands }) => (
    <BrandsMarqueeEditor
      value={draft.brandsMarquee}
      allBrands={brands}
      onChange={(brandsMarquee) => update({ brandsMarquee })}
    />
  ),

  instagram: ({ draft, update }) => (
    <InstagramEditor value={draft.instagram} onChange={(instagram) => update({ instagram })} />
  ),

  trustBar: ({ draft, update }) => (
    <TrustBadgesEditor value={draft.trustBadges} onChange={(trustBadges) => update({ trustBadges })} />
  ),

  services: ({ draft, update }) => (
    <ServicesEditor value={draft.servicesTeaser} onChange={(servicesTeaser) => update({ servicesTeaser })} />
  ),

  newsletter: ({ draft, update }) => (
    <NewsletterEditor
      value={draft.newsletterSection}
      onChange={(newsletterSection) => update({ newsletterSection })}
    />
  ),
};

/**
 * Sections that can be ordered and hidden but carry no editable content.
 *
 * Derived from the registry rather than hand-listed, so the list and the
 * dispatch cannot disagree about which sections those are.
 */
export const CONTENT_LESS_SECTIONS = (Object.keys(SECTION_EDITORS) as SectionKey[]).filter(
  (key) => SECTION_EDITORS[key] === null,
);
