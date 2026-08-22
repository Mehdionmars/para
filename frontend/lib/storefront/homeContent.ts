// Server-only: live DRAFT Home content for the Storefront Builder's preview
// mode (Next Draft Mode, enabled from /dashboard/storefront). Maps the full
// Home global — every section page.tsx renders gets its data from here when
// previewing, instead of from the sync-cms snapshot in data/home.ts. Product
// references (campaign picks, dermo picks) are resolved live the same way
// rails are, never from the static products snapshot.
import {
  BadgeCheck,
  Gift,
  Headset,
  Heart,
  LifeBuoy,
  MessageCircleQuestion,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { CMS_URL } from "@/lib/dashboard/constants";
import { fetchProductsByIds, resolveMediaUrl, type LiveProduct, type PayloadMediaRef } from "@/lib/storefront/products";
import type { BrandFeatured, RailDef, SectionEntryKey } from "@/data/home";

const ICONS: Record<string, LucideIcon> = { BadgeCheck, Gift, Headset, Heart, LifeBuoy, MessageCircleQuestion, ScanLine, ShieldCheck, Sparkles, Truck };
const resolveIcon = (name: string | undefined) => ICONS[name || ""] || Truck;

type RelRef = { id?: number; name?: string } | number | null | undefined;
const relId = (ref: RelRef): number | null => (typeof ref === "object" && ref ? (ref.id ?? null) : typeof ref === "number" ? ref : null);

type RawCtaTile = { eyebrow?: string; title: string; bg?: string; image?: PayloadMediaRef };
type RawMarketingBanner = {
  campaign?: string;
  imageMode?: "overlay" | "imageOnly";
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  badgeLabel?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  image?: PayloadMediaRef;
  imageMobile?: PayloadMediaRef;
};
type RawRail = {
  key: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  productSource?: string;
  products?: RelRef[];
  category?: string;
  brandFilter?: RelRef;
  limit?: number;
  sortOrder?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  badgeStyle?: string;
  editorialImage?: PayloadMediaRef;
};
type RawBrandFeatured = { brand?: RelRef; phrase?: string; image?: PayloadMediaRef; ctaLabel?: string };
type RawHeroSlide = {
  tag?: string;
  title: string;
  sub?: string;
  cta: string;
  ctaUrl?: string;
  secondaryCta?: string;
  secondaryCtaUrl?: string;
  align?: "left" | "right";
  overlay?: boolean;
  bg?: string;
  image?: PayloadMediaRef;
  mobileImage?: PayloadMediaRef;
  active?: boolean;
};
type RawCoffret = {
  active?: boolean;
  tag?: string;
  title: string;
  sub?: string;
  price: number;
  priceFrom?: boolean;
  image?: PayloadMediaRef;
  ctaLabel?: string;
  ctaUrl?: string;
  toast?: string;
};
type RawCoffretsCopy = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  layout?: "carousel" | "grid";
  visibleDesktop?: number;
  visibleMobile?: number;
};
type RawDermoPick = { product?: RelRef; actif: string; claim: string };
type RawSummerEditHighlight = { icon?: string; label: string };
type RawSummerEditAct = { eyebrow?: string; title: string; description?: string; products?: RelRef[] };
type RawTrustBadge = { title: string; sub?: string; icon?: string };
type RawServiceCard = { title: string; sub?: string; cta?: string; href?: string; icon?: string };

export type LiveHeroSlide = {
  tag: string;
  title: string;
  sub: string;
  cta: string;
  ctaUrl: string;
  secondaryCta: string;
  secondaryCtaUrl: string;
  align: "left" | "right";
  overlay: boolean;
  bg: string;
  img: string;
  mobileImg: string;
};
export type LiveCoffret = { tag: string; title: string; sub: string; price: number; priceFrom?: boolean; img: string; ctaLabel: string; ctaUrl: string; toast: string };
export type LiveCoffretsCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  layout: "carousel" | "grid";
  visibleDesktop: number;
  visibleMobile: number;
};
export type LiveTrustBadge = { title: string; sub: string; icon: LucideIcon };
export type LiveServiceCard = { title: string; sub: string; cta: string; href: string; icon: LucideIcon };

export type LiveHomeContent = {
  sections: { key: SectionEntryKey; visible: boolean }[];
  heroSlides: LiveHeroSlide[];
  rails: RailDef[];
  brandsFeatured: BrandFeatured[];
  promotionsGrid: { title: string; subtitle: string; limit: number };
  ctaPair1: { eyebrow: string; title: string; bg: string; img: string }[];
  ctaPair2: { eyebrow: string; title: string; bg: string; img: string }[];
  marketingBanners: {
    campaign: string;
    imageMode: "overlay" | "imageOnly";
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    badgeLabel: string;
    active: boolean;
    startDate: string;
    endDate: string;
    img: string;
    imgMobile: string;
  }[];
  coffrets: LiveCoffret[];
  coffretsCopy: LiveCoffretsCopy;
  campaignCopy: { eyebrow: string; title: string; description: string; ctaLabel: string; ctaUrl: string; railTitle: string; img: string };
  campaignProducts: LiveProduct[];
  dermoPicks: { product: LiveProduct; actif: string; claim: string }[];
  dermoCornerCopy: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaUrl: string;
    picksTitle: string;
    img: string;
    autoplay: boolean;
    autoplaySpeedMs: number;
  };
  imageCarouselCopy: { eyebrow: string; title: string; subtitle: string; ctaLabel: string; ctaUrl: string; picksTitle: string; img: string };
  imageCarouselProducts: LiveProduct[];
  summerEditCopy: {
    eyebrow: string;
    year: string;
    title: string;
    titleAccent: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    img: string;
    imgMobile: string;
    imagePosition: "left" | "right";
    imageScale: number;
    overlay: boolean;
    highlights: { icon: string; label: string }[];
    carousel: { autoplay: boolean; autoplaySpeedMs: number; showCounter: boolean; showProgress: boolean };
    animation: { enableReveal: boolean; enableParallax: boolean; staggerProducts: boolean; speed: "slow" | "normal" | "fast" };
    colors: { background: string; text: string; accent: string; cta: string };
    fullWidth: boolean;
  };
  summerEditActs: { eyebrow: string; title: string; description: string; products: LiveProduct[] }[];
  brandsMarquee: string[];
  trustBadges: LiveTrustBadge[];
  servicesTeaser: LiveServiceCard[];
  newsletterSection: {
    title: string;
    subtitle: string;
    placeholder: string;
    buttonLabel: string;
    successMessage: string;
    logoEnabled: boolean;
    logoSize: number;
    logoPosition: "left" | "top";
    backgroundColor: string;
    textColor: string;
    ctaColor: string;
    borderRadius: number;
    particlesEnabled: boolean;
    particlesOpacity: number;
  };
  instagramSection: {
    show: boolean;
    title: string;
    subtitle: string;
    username: string;
    postCount: number;
    ctaText: string;
    ctaUrl: string;
  };
};

const ctaTile = (t: RawCtaTile) => ({ eyebrow: t.eyebrow || "", title: t.title, bg: t.bg || "", img: resolveMediaUrl(t.image) });

export async function fetchLiveHomeContent(): Promise<LiveHomeContent> {
  const res = await fetch(`${CMS_URL}/api/globals/home?draft=true&depth=2`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch draft home content (${res.status})`);
  const home = await res.json();

  const rails: RailDef[] = (home.rails || []).map((r: RawRail) => ({
    key: r.key,
    eyebrow: r.eyebrow || "",
    title: r.title,
    subtitle: r.subtitle || "",
    productSource: (r.productSource || "manual") as RailDef["productSource"],
    productIds: (r.products || []).map(relId).filter((id): id is number => id !== null),
    category: r.category || "",
    brandFilterId: relId(r.brandFilter),
    limit: r.limit || 8,
    sortOrder: (r.sortOrder || "newest") as RailDef["sortOrder"],
    ctaLabel: r.ctaLabel || "Voir tout",
    ctaUrl: r.ctaUrl || "/catalogue",
    badgeStyle: (r.badgeStyle || "none") as RailDef["badgeStyle"],
    ...(r.editorialImage ? { editorial: { image: resolveMediaUrl(r.editorialImage) } } : {}),
  }));

  const brandsFeatured: BrandFeatured[] = (home.brandsFeatured || [])
    .filter((b: RawBrandFeatured) => b.brand)
    .map((b: RawBrandFeatured) => ({
      name: typeof b.brand === "object" && b.brand ? b.brand.name || "" : "",
      slug: typeof b.brand === "object" && b.brand && "slug" in b.brand ? (b.brand as { slug?: string }).slug || "" : "",
      phrase: b.phrase || "",
      img: resolveMediaUrl(b.image),
      ctaLabel: b.ctaLabel || "Découvrir la marque",
    }));

  const heroSlides: LiveHeroSlide[] = (home.heroSlides || [])
    .filter((s: RawHeroSlide) => s.active !== false)
    .map((s: RawHeroSlide) => ({
      tag: s.tag || "",
      title: s.title,
      sub: s.sub || "",
      cta: s.cta,
      ctaUrl: s.ctaUrl || "/catalogue",
      secondaryCta: s.secondaryCta || "",
      secondaryCtaUrl: s.secondaryCtaUrl || "",
      align: s.align || "right",
      overlay: s.overlay !== false,
      bg: s.bg || "",
      img: resolveMediaUrl(s.image),
      mobileImg: resolveMediaUrl(s.mobileImage),
    }));

  const coffrets: LiveCoffret[] = (home.coffrets || [])
    .filter((c: RawCoffret) => c.active !== false)
    .map((c: RawCoffret) => ({
      tag: c.tag || "",
      title: c.title,
      sub: c.sub || "",
      price: c.price,
      priceFrom: !!c.priceFrom,
      img: resolveMediaUrl(c.image),
      ctaLabel: c.ctaLabel || "Offrir",
      ctaUrl: c.ctaUrl || "/catalogue",
      toast: c.toast || "",
    }));
  const coffretsCopy: LiveCoffretsCopy = {
    eyebrow: (home.coffretsCopy as RawCoffretsCopy)?.eyebrow || "Idées cadeaux",
    title: (home.coffretsCopy as RawCoffretsCopy)?.title || "Coffrets & cadeaux",
    subtitle: (home.coffretsCopy as RawCoffretsCopy)?.subtitle || "",
    ctaLabel: (home.coffretsCopy as RawCoffretsCopy)?.ctaLabel || "Tous les coffrets",
    ctaUrl: (home.coffretsCopy as RawCoffretsCopy)?.ctaUrl || "/collections",
    layout: (home.coffretsCopy as RawCoffretsCopy)?.layout || "carousel",
    visibleDesktop: (home.coffretsCopy as RawCoffretsCopy)?.visibleDesktop || 3,
    visibleMobile: (home.coffretsCopy as RawCoffretsCopy)?.visibleMobile || 1,
  };

  const campaignProductIds = (home.campaignProducts || []).map(relId).filter((id: number | null): id is number => id !== null);
  const dermoProductIds = (home.dermoPicks || []).map((d: RawDermoPick) => relId(d.product)).filter((id: number | null): id is number => id !== null);
  const imageCarouselProductIds = (home.imageCarouselProducts || []).map(relId).filter((id: number | null): id is number => id !== null);
  const rawSummerEditActs = (home.summerEditActs || []) as RawSummerEditAct[];
  const summerEditProductIds = rawSummerEditActs
    .flatMap((a) => (a.products || []).slice(0, 4).map(relId))
    .filter((id: number | null): id is number => id !== null);

  const [campaignProducts, dermoProducts, imageCarouselProducts, summerEditProducts] = await Promise.all([
    fetchProductsByIds(campaignProductIds),
    fetchProductsByIds(dermoProductIds),
    fetchProductsByIds(imageCarouselProductIds),
    fetchProductsByIds(summerEditProductIds),
  ]);
  const dermoById = new Map(dermoProducts.map((p) => [p.id, p]));
  const summerEditById = new Map(summerEditProducts.map((p) => [p.id, p]));

  const summerEditActs = rawSummerEditActs.map((a) => ({
    eyebrow: a.eyebrow || "",
    title: a.title,
    description: a.description || "",
    products: (a.products || [])
      .slice(0, 4)
      .map(relId)
      .filter((id: number | null): id is number => id !== null)
      .map((id: number) => summerEditById.get(id))
      .filter((p: LiveProduct | undefined): p is LiveProduct => p !== undefined),
  }));

  const dermoPicks = (home.dermoPicks || [])
    .map((d: RawDermoPick) => {
      const id = relId(d.product);
      const product = id !== null ? dermoById.get(id) : undefined;
      return product ? { product, actif: d.actif, claim: d.claim } : null;
    })
    .filter((d: unknown): d is { product: LiveProduct; actif: string; claim: string } => d !== null);

  return {
    sections: (home.sections || []).map((s: { key: SectionEntryKey; visible?: boolean }) => ({ key: s.key, visible: s.visible !== false })),
    heroSlides,
    rails,
    brandsFeatured,
    promotionsGrid: {
      title: home.promotionsGrid?.title || "Les offres du moment",
      subtitle: home.promotionsGrid?.subtitle || "",
      limit: home.promotionsGrid?.limit || 8,
    },
    ctaPair1: (home.ctaPair1 || []).map(ctaTile),
    ctaPair2: (home.ctaPair2 || []).map(ctaTile),
    marketingBanners: (home.marketingBanners || []).map((b: RawMarketingBanner) => ({
      campaign: b.campaign || "",
      imageMode: b.imageMode || "overlay",
      eyebrow: b.eyebrow || "",
      title: b.title || "",
      description: b.description || "",
      ctaLabel: b.ctaLabel || "",
      ctaUrl: b.ctaUrl || "/catalogue",
      badgeLabel: b.badgeLabel || "",
      active: b.active !== false,
      startDate: b.startDate || "",
      endDate: b.endDate || "",
      img: resolveMediaUrl(b.image),
      imgMobile: resolveMediaUrl(b.imageMobile),
    })),
    coffrets,
    coffretsCopy,
    campaignCopy: {
      eyebrow: home.campaignCopy?.eyebrow || "",
      title: home.campaignCopy?.title || "",
      description: home.campaignCopy?.description || "",
      ctaLabel: home.campaignCopy?.ctaLabel || "",
      ctaUrl: home.campaignCopy?.ctaUrl || "/catalogue",
      railTitle: home.campaignCopy?.railTitle || "",
      img: resolveMediaUrl(home.campaignCopy?.image),
    },
    campaignProducts,
    dermoPicks,
    dermoCornerCopy: {
      eyebrow: home.dermoCornerCopy?.eyebrow || "Dermo corner",
      title: home.dermoCornerCopy?.title || "La sélection dermatologique du moment",
      subtitle: home.dermoCornerCopy?.subtitle || "",
      ctaLabel: home.dermoCornerCopy?.ctaLabel || "Voir le rayon dermo",
      ctaUrl: home.dermoCornerCopy?.ctaUrl || "/catalogue",
      picksTitle: home.dermoCornerCopy?.picksTitle || "Nos soins dermo favoris",
      img: resolveMediaUrl(home.dermoCornerCopy?.image),
      autoplay: home.dermoCornerCopy?.autoplay !== false,
      autoplaySpeedMs: home.dermoCornerCopy?.autoplaySpeedMs || 4500,
    },
    imageCarouselCopy: {
      eyebrow: home.imageCarouselCopy?.eyebrow || "Sélection",
      title: home.imageCarouselCopy?.title || "Nos incontournables du moment",
      subtitle: home.imageCarouselCopy?.subtitle || "",
      ctaLabel: home.imageCarouselCopy?.ctaLabel || "Voir la sélection",
      ctaUrl: home.imageCarouselCopy?.ctaUrl || "/catalogue",
      picksTitle: home.imageCarouselCopy?.picksTitle || "Notre sélection",
      img: resolveMediaUrl(home.imageCarouselCopy?.image),
    },
    imageCarouselProducts,
    summerEditCopy: {
      eyebrow: home.summerEditCopy?.eyebrow || "01 / Summer Edit",
      year: home.summerEditCopy?.year || "",
      title: home.summerEditCopy?.title || "L'été commence",
      titleAccent: home.summerEditCopy?.titleAccent || "par la peau",
      description: home.summerEditCopy?.description || "",
      ctaLabel: home.summerEditCopy?.ctaLabel || "Découvrir la sélection",
      ctaUrl: home.summerEditCopy?.ctaUrl || "/catalogue",
      img: resolveMediaUrl(home.summerEditCopy?.heroImage),
      imgMobile: resolveMediaUrl(home.summerEditCopy?.heroImageMobile),
      imagePosition: (home.summerEditCopy?.imagePosition || "right") as "left" | "right",
      imageScale: home.summerEditCopy?.imageScale || 1.06,
      overlay: home.summerEditCopy?.overlay === true,
      highlights: ((home.summerEditCopy?.highlights || []) as RawSummerEditHighlight[]).map((h) => ({ icon: h.icon || "Sun", label: h.label })),
      carousel: {
        autoplay: home.summerEditCopy?.carousel?.autoplay !== false,
        autoplaySpeedMs: home.summerEditCopy?.carousel?.autoplaySpeedMs || 5000,
        showCounter: home.summerEditCopy?.carousel?.showCounter !== false,
        showProgress: home.summerEditCopy?.carousel?.showProgress !== false,
      },
      animation: {
        enableReveal: home.summerEditCopy?.animation?.enableReveal !== false,
        enableParallax: home.summerEditCopy?.animation?.enableParallax !== false,
        staggerProducts: home.summerEditCopy?.animation?.staggerProducts !== false,
        speed: (home.summerEditCopy?.animation?.speed || "normal") as "slow" | "normal" | "fast",
      },
      colors: {
        background: home.summerEditCopy?.colors?.background || "#F7EEE5",
        text: home.summerEditCopy?.colors?.text || "#373020",
        accent: home.summerEditCopy?.colors?.accent || "#6D28D9",
        cta: home.summerEditCopy?.colors?.cta || "#6D28D9",
      },
      fullWidth: home.summerEditCopy?.fullWidth === true,
    },
    summerEditActs,
    brandsMarquee: (home.brands || []).map((b: RelRef) => (typeof b === "object" && b ? b.name || "" : "")).filter(Boolean),
    trustBadges: (home.trustBadges || []).map((b: RawTrustBadge) => ({ title: b.title, sub: b.sub || "", icon: resolveIcon(b.icon) })),
    servicesTeaser: (home.servicesTeaser || []).map((s: RawServiceCard) => ({
      title: s.title,
      sub: s.sub || "",
      cta: s.cta || "",
      href: s.href || "/services",
      icon: resolveIcon(s.icon),
    })),
    newsletterSection: {
      title: home.newsletterSection?.title || "",
      subtitle: home.newsletterSection?.subtitle || "",
      placeholder: home.newsletterSection?.placeholder || "",
      buttonLabel: home.newsletterSection?.buttonLabel || "",
      successMessage: home.newsletterSection?.successMessage || "",
      logoEnabled: home.newsletterSection?.logoEnabled !== false,
      logoSize: home.newsletterSection?.logoSize || 76,
      logoPosition: home.newsletterSection?.logoPosition === "top" ? "top" : "left",
      backgroundColor: home.newsletterSection?.backgroundColor || "#5E4074",
      textColor: home.newsletterSection?.textColor || "#FFFFFF",
      ctaColor: home.newsletterSection?.ctaColor || "#008AA5",
      borderRadius: typeof home.newsletterSection?.borderRadius === "number" ? home.newsletterSection.borderRadius : 26,
      particlesEnabled: home.newsletterSection?.particlesEnabled !== false,
      particlesOpacity: typeof home.newsletterSection?.particlesOpacity === "number" ? home.newsletterSection.particlesOpacity : 0.18,
    },
    instagramSection: {
      show: home.instagram?.show !== false,
      title: home.instagram?.title || "",
      subtitle: home.instagram?.subtitle || "",
      username: home.instagram?.username || "paradhiver",
      postCount: home.instagram?.postCount || 6,
      ctaText: home.instagram?.ctaText || "Nous suivre",
      ctaUrl: home.instagram?.ctaUrl || "https://www.instagram.com/paradhiver/",
    },
  };
}
