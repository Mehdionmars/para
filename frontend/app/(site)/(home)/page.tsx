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
import { FeaturedWithPromo } from "@/components/home/FeaturedWithPromo";
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
import { CategoryTiles } from "@/components/layout/CategoryTiles";
import { CATEGORY_STRIP } from "@/data/nav";
import { fetchLiveHomeContent, fetchPublishedHomeContent } from "@/lib/storefront/homeContent";
import { fetchLiveNavigation, fetchPublishedNavigation } from "@/lib/storefront/siteChromeContent";
import { fetchInstagramPosts } from "@/lib/storefront/instagram";
import { fetchDiscountedProducts, fetchFeaturedProducts, fetchRailProducts } from "@/lib/storefront/products";

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
  "featuredPromo",
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

/**
 * Which movement of the page a section belongs to.
 *
 * The home page is a flat, CMS-ordered stack, and every section carried the
 * same vertical padding — so all ~14 of them read as equal blocks with the
 * identical 96px between each pair. Nothing grouped and nothing led.
 *
 * Naming the movement each section belongs to lets the render below wrap
 * consecutive same-movement sections into one band: the boundary between two
 * movements becomes the page's widest interval, and the commercial core gets
 * the tint that makes it outweigh the editorial sections beneath it.
 *
 * A key absent from this map falls back to "editorial", so a section added in
 * the CMS later still lands somewhere sensible without a deploy.
 */
type Movement = "opening" | "core" | "editorial" | "close";

const SECTION_MOVEMENT: Partial<Record<SectionKey, Movement>> = {
  // A shoppable grid: it belongs to the commercial core, with the rails.
  featuredPromo: "core",
  hero: "opening",
  promotionsGrid: "core",
  newsletter: "close",
  trustBar: "close",
  // `marketingBanner` is deliberately absent. It reads like an opening, but
  // the CMS order puts it well down the page, and pinning it to "opening"
  // there dropped an opening-movement island into the middle of the tail and
  // split the editorial sections in two. It belongs to whatever surrounds it.
};

function movementOf(key: SectionEntryKey): Movement {
  // Every product rail is part of the shop, whatever its key.
  if (key.startsWith("rail:")) return "core";
  return SECTION_MOVEMENT[key as SectionKey] ?? "editorial";
}

/**
 * A lone rail parked in the middle of the editorial sections is not a second
 * shop: banding it would cut the tail into more zones and make the widest
 * interval the page's most repeated one — the same flatness, one size up.
 * The shop is where rails stand *together*, so a core section with no core
 * neighbour joins the tail around it. It is still obviously a rail.
 */
function classifyMovements(entries: SectionEntryKey[]): Movement[] {
  const raw = entries.map(movementOf);
  return raw.map((movement, i) => {
    if (movement !== "core") return movement;
    const hasCoreNeighbour = raw[i - 1] === "core" || raw[i + 1] === "core";
    return hasCoreNeighbour ? "core" : "editorial";
  });
}

/** Consecutive entries of the same movement, in render order. */
function groupIntoMovements(entries: SectionEntryKey[]): { movement: Movement; keys: SectionEntryKey[] }[] {
  const movements = classifyMovements(entries);
  const runs: { movement: Movement; keys: SectionEntryKey[] }[] = [];
  entries.forEach((key, i) => {
    const movement = movements[i];
    const open = runs[runs.length - 1];
    if (open && open.movement === movement) open.keys.push(key);
    else runs.push({ movement, keys: [key] });
  });
  return runs;
}

/**
 * Sections the code can render that the stored order has not heard of yet.
 *
 * Payload backfills new keys into `sections` on read (see Home's afterRead
 * hook), which covers the live path. It does not cover the fallback one: when
 * the CMS is unreachable the order comes from the `data/home.ts` snapshot,
 * frozen at the last `sync-cms`, and a section added since simply never
 * renders. Mirroring the backfill here means a new block appears immediately,
 * in the same place the CMS would have put it, whether or not the CMS answers.
 */
const BACKFILL_AFTER: Partial<Record<SectionKey, SectionEntryKey>> = {
  featuredPromo: "promotionsGrid",
};

function withMissingSections(order: { key: SectionEntryKey; visible: boolean }[]) {
  const present = new Set(order.map((s) => s.key));
  const out = [...order];
  for (const [key, after] of Object.entries(BACKFILL_AFTER) as [SectionEntryKey, SectionEntryKey][]) {
    if (present.has(key)) continue;
    const at = out.findIndex((s) => s.key === after);
    out.splice(at === -1 ? out.length : at + 1, 0, { key, visible: true });
  }
  return out;
}

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

  // The quick-category strip is Navigation content, not Home content, but it
  // renders here because above the hero is the only place it belongs.
  const navigation = isPreview
    ? await fetchLiveNavigation().catch(() => null)
    : await fetchPublishedNavigation().catch(() => null);
  const categoryStrip = navigation?.categoryStrip ?? CATEGORY_STRIP;

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
  const brandsFeaturedCopy = live?.brandsFeaturedCopy;
  const featuredPromoCopy = live?.featuredPromo;
  const servicesTeaserCopy = live?.servicesTeaserCopy;
  const newsletterCopy = live?.newsletterSection;

  // Rail copy/config is synced content (data/home.ts, or live draft above);
  // the actual products shown are resolved live against Payload/Postgres on
  // every request either way — a product with stock 0 never appears here.
  const [railProducts, instagramPosts, promotionProducts, featuredProducts] = await Promise.all([
    Promise.all(rails.map((rail) => fetchRailProducts(rail))),
    fetchInstagramPosts(instagramSection.postCount),
    // Same live resolution as the rails: an offer edited in the admin is
    // correct on the next request, not at the next sync-cms.
    fetchDiscountedProducts(promotionsGridCopy?.limit || 8).catch(() => null),
    fetchFeaturedProducts(featuredPromoCopy?.limit || 3).catch(() => []),
  ]);
  const railProductsByKey = new Map(rails.map((rail, i) => [rail.key, railProducts[i]]));
  const activeBanner = pickActiveMarketingBanner(marketingBanners, Date.now());

  // Render order + visibility come from the CMS (edited in the Storefront
  // Builder at /dashboard/storefront). Fixed, singleton sections resolve via
  // this map; each product rail is its own independently orderable entry,
  // addressed as "rail:<railKey>" and resolved dynamically below instead of
  // being grouped under one shared "rails" slot.
  const sectionsByKey: Record<SectionKey, ReactNode> = {
    featuredPromo: <FeaturedWithPromo copy={featuredPromoCopy} products={featuredProducts} />,
    hero: <HeroCarousel slides={heroSlides} />,
    marketingBanner: <MarketingBanner banner={activeBanner} />,
    ctaPair1: <CtaPair tiles={ctaPair1} height={280} />,
    promotionsGrid: <PromotionsGrid copy={promotionsGridCopy} products={promotionProducts ?? undefined} />,
    services: <ServicesTeaser cards={servicesTeaser} copy={servicesTeaserCopy} />,
    coffrets: <GiftSetsCarousel coffrets={coffrets} copy={coffretsCopy} />,
    campaign: <CampaignSection copy={campaignCopy} products={campaignProducts} />,
    dermoCorner: <DermoCorner picks={dermoPicks} copy={dermoCornerCopy} />,
    imageCarousel: <ImageCarousel products={imageCarouselProducts} copy={imageCarouselCopy} />,
    summerEdit: <SummerEdit copy={summerEditCopy} acts={summerEditActs} />,
    brandsFeatured: <BrandsFeaturedSection brands={brandsFeatured} copy={brandsFeaturedCopy} />,
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

  const order = withMissingSections(sectionOrder.length > 0 ? sectionOrder : DEFAULT_ORDER);
  const visibleKeys = order
    .filter((s) => s.visible && (s.key !== "marketingBanner" || activeBanner))
    .map((s) => s.key);

  // Grouped from the order that actually renders, so reordering sections in
  // the Storefront Builder regroups the bands with no code change.
  const movements = groupIntoMovements(visibleKeys);

  return (
    <>
      {/* Deliberately the first thing under the header: a returning shopper
          wants the aisle before the campaign. */}
      <CategoryTiles strip={categoryStrip} />

      {movements.map((run, i) => {
        // classifyMovements has already demoted any stranded rail, so a run
        // that is still "core" here is the shop itself.
        const className = ["home-movement", run.movement === "core" ? "home-movement--core" : ""].filter(Boolean).join(" ");

        return (
          <div key={`${run.movement}-${i}`} className={className}>
            {run.keys.map((key) => (
              <Fragment key={key}>{renderSection(key)}</Fragment>
            ))}
          </div>
        );
      })}
    </>
  );
}
