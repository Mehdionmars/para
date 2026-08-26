import { draftMode } from "next/headers";
import { Fragment, type ReactNode } from "react";
import { BrandsFeaturedSection } from "@/components/home/BrandsFeaturedSection";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";
import { CampaignSection } from "@/components/home/CampaignSection";
import { CtaPair } from "@/components/home/CtaPair";
import { DermoCorner } from "@/components/home/DermoCorner";
import { GiftSetsCarousel } from "@/components/home/GiftSetsCarousel";
import { ImageCarousel } from "@/components/home/ImageCarousel";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { MarketingBanner } from "@/components/home/MarketingBanner";
import { Newsletter } from "@/components/home/Newsletter";
import { PromotionsGrid } from "@/components/home/PromotionsGrid";
import { RailSection } from "@/components/home/RailSection";
import { ServicesTeaser } from "@/components/home/ServicesTeaser";
import { SummerEdit } from "@/components/home/SummerEdit";
import { TrustBar } from "@/components/home/TrustBar";
import { HeroCarousel } from "@/components/HeroCarousel";
import {
  BRANDS_FEATURED,
  COFFRETS_COPY,
  CTA_PAIR_1,
  CTA_PAIR_2,
  INSTAGRAM_SECTION,
  MARKETING_BANNERS,
  RAILS,
  SECTION_ORDER,
  type SectionEntryKey,
  type SectionKey,
} from "@/data/home";
import { fetchLiveHomeContent, fetchPublishedHomeContent } from "@/lib/storefront/homeContent";
import { fetchInstagramPosts } from "@/lib/storefront/instagram";
import { fetchRailProducts } from "@/lib/storefront/products";

// Used only if the CMS's `sections` field is ever empty (e.g. before the
// Storefront Builder's first save) — mirrors the current default homepage
// order, with each of the 4 default rails as its own independent entry
// rather than one shared "rails" slot (no more tabs — each rail can move,
// hide and be edited on its own).
// Front-loads the short, commercial path requested for the homepage (hero
// → one banner → sélection du moment, its attached "conseils" editorial
// block, nouveautés, best sellers, promotions) before anything else —
// ctaPair1/ctaPair2 and the rest of the editorial sections still exist,
// just pushed after the core rails instead of stacking at the top.
const DEFAULT_ORDER: { key: SectionEntryKey; visible: boolean }[] = [
  "hero",
  "marketingBanner",
  "rail:saison",
  "rail:nouveautes",
  "rail:best",
  "promotionsGrid",
  "ctaPair1",
  "summerEdit",
  "campaign",
  "services",
  "imageCarousel",
  "dermoCorner",
  "rail:coup-de-coeur",
  "coffrets",
  "brandsFeatured",
  "brandsMarquee",
  "ctaPair2",
  "instagram",
  "newsletter",
  "trustBar",
].map((key) => ({ key: key as SectionEntryKey, visible: true }));

/** A campaign is live when it's marked Active and (if set) the current time
 * falls inside its start/end date window — lets a non-technical editor
 * schedule "Saison été" to switch off automatically at season's end without
 * remembering to come back and toggle it. Only the first match (array
 * order) renders; the rest stay configured, ready to switch on. */
function pickActiveMarketingBanner<T extends { active: boolean; startDate: string; endDate: string }>(banners: T[], now: number): T | undefined {
  return banners.find((b) => {
    if (!b.active) return false;
    if (b.startDate && now < new Date(b.startDate).getTime()) return false;
    if (b.endDate && now > new Date(b.endDate).getTime()) return false;
    return true;
  });
}

export default async function HomePage() {
  // When the Storefront Builder's Preview is active (Next Draft Mode), pull
  // section order/visibility, rail config, CTA banners and Instagram config
  // live from the unpublished draft instead of the synced snapshot — see
  // lib/storefront/homeContent.ts for exactly which fields this covers.
  // Preview reads the unpublished draft, everyone else the published global.
  // This used to be `: null` outside preview, which sent every visitor to the
  // generated data/home.ts snapshot — so rails, bannières and coffrets edited
  // in the Storefront Builder only ever reached the previewer. The snapshot
  // stays the fallback below for when the CMS is unreachable.
  const isPreview = (await draftMode()).isEnabled;
  const live = isPreview
    ? await fetchLiveHomeContent().catch(() => null)
    : await fetchPublishedHomeContent().catch(() => null);

  const rails = live?.rails ?? RAILS;
  const brandsFeatured = live?.brandsFeatured ?? BRANDS_FEATURED;
  const marketingBanners = live?.marketingBanners ?? MARKETING_BANNERS;
  const ctaPair1 = live?.ctaPair1 ?? CTA_PAIR_1;
  const ctaPair2 = live?.ctaPair2 ?? CTA_PAIR_2;
  const instagramSection = live?.instagramSection ?? INSTAGRAM_SECTION;
  const sectionOrder = live?.sections ?? SECTION_ORDER;
  const heroSlides = live?.heroSlides;
  const promotionsGridCopy = live?.promotionsGrid;
  const coffrets = live?.coffrets;
  const coffretsCopy = live?.coffretsCopy ?? COFFRETS_COPY;
  const campaignCopy = live?.campaignCopy;
  const campaignProducts = live?.campaignProducts;
  const dermoPicks = live?.dermoPicks;
  const dermoCornerCopy = live?.dermoCornerCopy;
  const imageCarouselCopy = live?.imageCarouselCopy;
  const imageCarouselProducts = live?.imageCarouselProducts;
  const summerEditCopy = live?.summerEditCopy;
  const summerEditActs = live?.summerEditActs;
  const brandsMarquee = live?.brandsMarquee;
  const trustBadges = live?.trustBadges;
  const servicesTeaser = live?.servicesTeaser;
  const newsletterCopy = live?.newsletterSection;

  // Rail copy/config is synced content (data/home.ts, or live draft above);
  // the actual products shown are resolved live against Payload/Postgres on
  // every request either way — a product with stock 0 never appears here.
  const [railProducts, instagramPosts] = await Promise.all([
    Promise.all(rails.map((rail) => fetchRailProducts(rail))),
    fetchInstagramPosts(instagramSection.postCount),
  ]);
  const railProductsByKey = new Map(rails.map((rail, i) => [rail.key, railProducts[i]]));
  const activeBanner = pickActiveMarketingBanner(marketingBanners, Date.now());

  // Render order + visibility come from the CMS (edited in the Storefront
  // Builder at /dashboard/storefront). Fixed, singleton sections resolve via
  // this map; each product rail is its own independently orderable entry,
  // addressed as "rail:<railKey>" and resolved dynamically below instead of
  // being grouped under one shared "rails" slot.
  const sectionsByKey: Record<SectionKey, ReactNode> = {
    hero: <HeroCarousel slides={heroSlides} />,
    marketingBanner: <MarketingBanner banner={activeBanner} />,
    ctaPair1: <CtaPair tiles={ctaPair1} height={280} />,
    promotionsGrid: <PromotionsGrid copy={promotionsGridCopy} />,
    services: <ServicesTeaser cards={servicesTeaser} />,
    coffrets: <GiftSetsCarousel coffrets={coffrets} copy={coffretsCopy} />,
    campaign: <CampaignSection copy={campaignCopy} products={campaignProducts} />,
    dermoCorner: <DermoCorner picks={dermoPicks} copy={dermoCornerCopy} />,
    imageCarousel: <ImageCarousel products={imageCarouselProducts} copy={imageCarouselCopy} />,
    summerEdit: <SummerEdit copy={summerEditCopy} acts={summerEditActs} />,
    brandsFeatured: <BrandsFeaturedSection brands={brandsFeatured} />,
    brandsMarquee: <BrandsMarquee brands={brandsMarquee} />,
    ctaPair2: <CtaPair tiles={ctaPair2} height={260} />,
    instagram: <InstagramGrid posts={instagramPosts} config={instagramSection} />,
    newsletter: <Newsletter copy={newsletterCopy} />,
    trustBar: <TrustBar badges={trustBadges} />,
  };

  function renderSection(key: SectionEntryKey): ReactNode {
    if (key.startsWith("rail:")) {
      const railKey = key.slice("rail:".length);
      const rail = rails.find((r) => r.key === railKey);
      if (!rail) return null;
      return <RailSection rail={rail} products={railProductsByKey.get(railKey) ?? []} />;
    }
    return sectionsByKey[key as SectionKey] ?? null;
  }

  const order = sectionOrder.length > 0 ? sectionOrder : DEFAULT_ORDER;

  return (
    <>
      {order
        .filter((s) => s.visible && (s.key !== "marketingBanner" || activeBanner))
        .map((s) => (
          <Fragment key={s.key}>{renderSection(s.key)}</Fragment>
        ))}
    </>
  );
}
