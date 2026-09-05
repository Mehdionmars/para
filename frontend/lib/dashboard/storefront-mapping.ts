import {
  type CardCtaAlign,
  type CardImageFraming,
  toCtaAlign,
  toImageFraming,
} from "@/lib/storefront/cardLayout";
import type { SectionEntryKey } from "@/data/home";
import { mediaSrc } from "@/lib/mediaSrc";

/**
 * The homepage section registry — keys, labels and library groups — is no
 * longer defined here. It is generated into data/home.ts by sync-cms, from
 * the single declaration in backend/src/globals/Home.ts.
 *
 * It used to be re-typed in this file, justified at the time as "just display
 * labels". It drifted exactly as that arrangement invites: `featuredPromo` was
 * added to the CMS and never landed here, so the Storefront Builder listed it
 * by its raw camelCase key. Re-exported rather than moved so every existing
 * `@/lib/dashboard/storefront-mapping` import keeps working.
 */
export { SECTION_GROUP_LABELS, SECTION_GROUPS, SECTION_LABELS } from "@/data/home";
export type { SectionEntryKey, SectionKey } from "@/data/home";

export const SUMMER_EDIT_HIGHLIGHT_ICONS = ["Sun", "Droplet", "Leaf", "Sparkles", "ShieldCheck"] as const;
export const SUMMER_EDIT_IMAGE_POSITIONS = [
  { label: "Droite", value: "right" },
  { label: "Gauche", value: "left" },
] as const;
export const SUMMER_EDIT_ANIMATION_SPEEDS = [
  { label: "Lente", value: "slow" },
  { label: "Normale", value: "normal" },
  { label: "Rapide", value: "fast" },
] as const;

export const SERVICE_ICONS = [
  "ScanLine",
  "Truck",
  "MessageCircleQuestion",
  "LifeBuoy",
  "ShieldCheck",
  "BadgeCheck",
  "Headset",
  "Sparkles",
  "Heart",
  "Gift",
] as const;

export const TRUST_ICONS = ["Truck", "ShieldCheck", "BadgeCheck", "Headset"] as const;

export const RAIL_PRODUCT_SOURCES = [
  { label: "Sélection manuelle", value: "manual" },
  { label: "Derniers ajouts", value: "latest" },
  { label: "Produits mis en avant (featured)", value: "featured" },
  { label: "Meilleures ventes", value: "bestSelling" },
  { label: "Par catégorie", value: "category" },
  { label: "Par marque", value: "brand" },
  { label: "En promotion", value: "promotion" },
] as const;

export const RAIL_SORT_ORDERS = [
  { label: "Plus récents", value: "newest" },
  { label: "Prix croissant", value: "price-asc" },
  { label: "Prix décroissant", value: "price-desc" },
  { label: "Nom (A→Z)", value: "name-asc" },
  { label: "Mieux notés", value: "rating-desc" },
] as const;

export const RAIL_BADGE_STYLES = [
  { label: "Aucun", value: "none" },
  { label: '"Nouveau"', value: "new" },
  { label: "Classement (1, 2, 3...)", value: "rank" },
  { label: "\"Sélection de l'équipe\"", value: "team" },
] as const;

export const CATEGORY_OPTIONS = [
  "Visage",
  "Corps",
  "Cheveux",
  "Solaire",
  "Baby & Mom",
  "Maquillage",
  "Bucco-Dentaire",
  "Compléments alimentaires",
  "Hygiène",
] as const;

export const COFFRETS_LAYOUTS = [
  { label: "Carousel horizontal", value: "carousel" },
  { label: "Grille", value: "grid" },
] as const;

// ---- shapes -----------------------------------------------------------

export type ImageRef = { id?: number; url: string };
export type ProductRef = { id: number; label: string };

export type HeroSlide = {
  active: boolean;
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
  image: ImageRef;
  mobileImage: ImageRef;
};
export type CtaTile = { eyebrow: string; title: string; bg: string; image: ImageRef };
export type Rail = {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  productSource: string;
  products: ProductRef[];
  category: string;
  brandFilter: { id?: number; name: string };
  limit: number;
  sortOrder: string;
  ctaLabel: string;
  ctaUrl: string;
  badgeStyle: string;
  editorialImage: ImageRef;
  editorialEyebrow: string;
  editorialTitle: string;
  editorialDescription: string;
  editorialCtaLabel: string;
  editorialCtaUrl: string;
};
export type BrandFeaturedItem = { brand: { id?: number; name: string }; phrase: string; image: ImageRef; ctaLabel: string };
/** Every field of the centred CTA is a plain string, colours included, so the
 * draft round-trips through JSON without a mapper of its own. */
export type CtaBannerCopyDraft = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  bg: string;
  textColor: string;
  ctaColor: string;
};

export type DermoCornerCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  picksTitle: string;
  image: ImageRef;
  autoplay: boolean;
  autoplaySpeedMs: number;
};
export type ImageCarouselCopy = { eyebrow: string; title: string; subtitle: string; ctaLabel: string; ctaUrl: string; picksTitle: string; image: ImageRef };
export type Coffret = { active: boolean; tag: string; title: string; sub: string; price: number; priceFrom: boolean; image: ImageRef; ctaLabel: string; ctaUrl: string; toast: string };
export type CoffretsCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  layout: "carousel" | "grid";
  visibleDesktop: number;
  visibleMobile: number;
};
export type DermoPick = { product: ProductRef | null; actif: string; claim: string };
export type Instagram = { show: boolean; title: string; subtitle: string; username: string; postCount: number; ctaText: string; ctaUrl: string };
export type TrustBadge = { title: string; sub: string; icon: string };
export type ServiceCard = { title: string; sub: string; cta: string; href: string; icon: string };
export type CampaignCopy = { eyebrow: string; title: string; description: string; ctaLabel: string; ctaUrl: string; railTitle: string; image: ImageRef };
export const MARKETING_BANNER_IMAGE_MODES = [
  { label: "Texte en surimpression", value: "overlay" },
  { label: "Image seule (texte déjà intégré)", value: "imageOnly" },
] as const;
export type MarketingBannerImageMode = (typeof MARKETING_BANNER_IMAGE_MODES)[number]["value"];

export type MarketingBanner = {
  id?: string;
  campaign: string;
  image: ImageRef;
  imageMobile: ImageRef;
  imageMode: MarketingBannerImageMode;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: CardCtaAlign;
  imageFraming: CardImageFraming;
  badgeLabel: string;
  active: boolean;
  startDate: string;
  endDate: string;
};
export type NewsletterCopy = {
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
export type SectionEntry = { key: SectionEntryKey; visible: boolean };

export type PromotionsGridCopy = { title: string; subtitle: string; limit: number };

export type HomeDraft = {
  sections: SectionEntry[];
  heroSlides: HeroSlide[];
  marketingBanners: MarketingBanner[];
  ctaPair1: CtaTile[];
  ctaPair2: CtaTile[];
  rails: Rail[];
  brandsFeatured: BrandFeaturedItem[];
  promotionsGrid: PromotionsGridCopy;
  coffrets: Coffret[];
  coffretsCopy: CoffretsCopy;
  campaignCopy: CampaignCopy;
  campaignProducts: ProductRef[];
  dermoPicks: DermoPick[];
  ctaBannerCopy: CtaBannerCopyDraft;
  dermoCornerCopy: DermoCornerCopy;
  imageCarouselCopy: ImageCarouselCopy;
  imageCarouselProducts: ProductRef[];
  summerEditCopy: SummerEditCopyDraft;
  summerEditActs: SummerEditActDraft[];
  instagram: Instagram;
  brandsMarquee: { id: number; name: string }[];
  trustBadges: TrustBadge[];
  servicesTeaser: ServiceCard[];
  newsletterSection: NewsletterCopy;
};

// ---- Payload doc (populated, depth=2) -> builder draft -----------------

type RawMedia = { id?: number; url?: string } | number | null | undefined;
type RawRel = { id?: number; name?: string } | number | null | undefined;

function mediaRef(m: RawMedia): ImageRef {
  if (m && typeof m === "object") {
    // CMS_URL here produced http://backend:3001/... in containers — a host
    // the browser cannot resolve, so every image preview in the builder broke.
    const url = mediaSrc(m.url);
    return { id: m.id, url };
  }
  return { url: "" };
}

function relRef(r: RawRel): { id?: number; name: string } {
  if (r && typeof r === "object") return { id: r.id, name: r.name || "" };
  return { name: "" };
}

function productRef(p: { id?: number; name?: string } | number | null | undefined): ProductRef | null {
  if (p && typeof p === "object" && p.id) return { id: p.id, label: p.name || `#${p.id}` };
  if (typeof p === "number") return { id: p, label: `#${p}` };
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHomeDocToDraft(home: any): HomeDraft {
  return {
    sections: (home.sections || []).map((s: SectionEntry) => ({ key: s.key, visible: s.visible !== false })),
    heroSlides: (home.heroSlides || []).map((s: any) => ({
      active: s.active !== false,
      tag: s.tag || "",
      title: s.title || "",
      sub: s.sub || "",
      cta: s.cta || "",
      ctaUrl: s.ctaUrl || "/catalogue",
      secondaryCta: s.secondaryCta || "",
      secondaryCtaUrl: s.secondaryCtaUrl || "",
      align: s.align || "right",
      overlay: s.overlay !== false,
      bg: s.bg || "",
      image: mediaRef(s.image),
      mobileImage: mediaRef(s.mobileImage),
    })),
    marketingBanners: (home.marketingBanners || []).map((b: any) => ({
      campaign: b.campaign || "",
      image: mediaRef(b.image),
      imageMobile: mediaRef(b.imageMobile),
      imageMode: b.imageMode || "overlay",
      eyebrow: b.eyebrow || "",
      title: b.title || "",
      description: b.description || "",
      ctaLabel: b.ctaLabel || "",
      ctaUrl: b.ctaUrl || "/catalogue",
      ctaAlign: toCtaAlign(b.ctaAlign),
      imageFraming: toImageFraming(b.imageFraming),
      badgeLabel: b.badgeLabel || "",
      active: b.active !== false,
      startDate: b.startDate || "",
      endDate: b.endDate || "",
    })),
    ctaPair1: (home.ctaPair1 || []).map((t: any) => ({ eyebrow: t.eyebrow || "", title: t.title || "", bg: t.bg || "", image: mediaRef(t.image) })),
    ctaPair2: (home.ctaPair2 || []).map((t: any) => ({ eyebrow: t.eyebrow || "", title: t.title || "", bg: t.bg || "", image: mediaRef(t.image) })),
    rails: (home.rails || []).map((r: any) => ({
      key: r.key || "",
      eyebrow: r.eyebrow || "",
      title: r.title || "",
      subtitle: r.subtitle || "",
      productSource: r.productSource || "manual",
      products: (r.products || []).map(productRef).filter(Boolean) as ProductRef[],
      category: r.category || "",
      brandFilter: relRef(r.brandFilter),
      limit: r.limit || 8,
      sortOrder: r.sortOrder || "newest",
      ctaLabel: r.ctaLabel || "Voir tout",
      ctaUrl: r.ctaUrl || "/catalogue",
      badgeStyle: r.badgeStyle || "none",
      editorialImage: mediaRef(r.editorialImage),
      editorialEyebrow: r.editorialEyebrow || "",
      editorialTitle: r.editorialTitle || "",
      editorialDescription: r.editorialDescription || "",
      editorialCtaLabel: r.editorialCtaLabel || "",
      editorialCtaUrl: r.editorialCtaUrl || "",
    })),
    brandsFeatured: (home.brandsFeatured || []).map((b: any) => ({
      brand: relRef(b.brand),
      phrase: b.phrase || "",
      image: mediaRef(b.image),
      ctaLabel: b.ctaLabel || "Découvrir la marque",
    })),
    promotionsGrid: {
      title: home.promotionsGrid?.title || "Les offres du moment",
      subtitle: home.promotionsGrid?.subtitle || "",
      limit: home.promotionsGrid?.limit || 8,
    },
    coffrets: (home.coffrets || []).map((c: any) => ({
      active: c.active !== false,
      tag: c.tag || "",
      title: c.title || "",
      sub: c.sub || "",
      price: c.price || 0,
      priceFrom: !!c.priceFrom,
      image: mediaRef(c.image),
      ctaLabel: c.ctaLabel || "Offrir",
      ctaUrl: c.ctaUrl || "/catalogue",
      toast: c.toast || "",
    })),
    coffretsCopy: {
      eyebrow: home.coffretsCopy?.eyebrow || "Idées cadeaux",
      title: home.coffretsCopy?.title || "Coffrets & cadeaux",
      subtitle: home.coffretsCopy?.subtitle || "",
      ctaLabel: home.coffretsCopy?.ctaLabel || "Tous les coffrets",
      ctaUrl: home.coffretsCopy?.ctaUrl || "/collections",
      layout: home.coffretsCopy?.layout || "carousel",
      visibleDesktop: home.coffretsCopy?.visibleDesktop || 3,
      visibleMobile: home.coffretsCopy?.visibleMobile || 1,
    },
    campaignCopy: {
      eyebrow: home.campaignCopy?.eyebrow || "",
      title: home.campaignCopy?.title || "",
      description: home.campaignCopy?.description || "",
      ctaLabel: home.campaignCopy?.ctaLabel || "",
      ctaUrl: home.campaignCopy?.ctaUrl || "",
      railTitle: home.campaignCopy?.railTitle || "",
      image: mediaRef(home.campaignCopy?.image),
    },
    campaignProducts: (home.campaignProducts || []).map(productRef).filter(Boolean) as ProductRef[],
    dermoPicks: (home.dermoPicks || []).map((d: any) => ({ product: productRef(d.product), actif: d.actif || "", claim: d.claim || "" })),
    ctaBannerCopy: {
      eyebrow: home.ctaBannerCopy?.eyebrow || "",
      title: home.ctaBannerCopy?.title || "",
      description: home.ctaBannerCopy?.description || "",
      ctaLabel: home.ctaBannerCopy?.ctaLabel || "",
      ctaUrl: home.ctaBannerCopy?.ctaUrl || "/contact",
      bg: home.ctaBannerCopy?.bg || "#F7EEE5",
      textColor: home.ctaBannerCopy?.textColor || "#373020",
      ctaColor: home.ctaBannerCopy?.ctaColor || "#5E4074",
    },
    dermoCornerCopy: {
      eyebrow: home.dermoCornerCopy?.eyebrow || "Dermo corner",
      title: home.dermoCornerCopy?.title || "",
      subtitle: home.dermoCornerCopy?.subtitle || "",
      ctaLabel: home.dermoCornerCopy?.ctaLabel || "Voir le rayon dermo",
      ctaUrl: home.dermoCornerCopy?.ctaUrl || "/catalogue",
      picksTitle: home.dermoCornerCopy?.picksTitle || "Nos soins dermo favoris",
      image: mediaRef(home.dermoCornerCopy?.image),
      autoplay: home.dermoCornerCopy?.autoplay !== false,
      autoplaySpeedMs: home.dermoCornerCopy?.autoplaySpeedMs || 4500,
    },
    imageCarouselCopy: {
      eyebrow: home.imageCarouselCopy?.eyebrow || "Sélection",
      title: home.imageCarouselCopy?.title || "",
      subtitle: home.imageCarouselCopy?.subtitle || "",
      ctaLabel: home.imageCarouselCopy?.ctaLabel || "Voir la sélection",
      ctaUrl: home.imageCarouselCopy?.ctaUrl || "/catalogue",
      picksTitle: home.imageCarouselCopy?.picksTitle || "Notre sélection",
      image: mediaRef(home.imageCarouselCopy?.image),
    },
    imageCarouselProducts: (home.imageCarouselProducts || []).map(productRef).filter(Boolean) as ProductRef[],
    summerEditCopy: mapSummerEditCopyDocToDraft(home),
    summerEditActs: mapSummerEditActsDocToDraft(home),
    instagram: {
      show: home.instagram?.show !== false,
      title: home.instagram?.title || "",
      subtitle: home.instagram?.subtitle || "",
      username: home.instagram?.username || "paradhiver",
      postCount: home.instagram?.postCount || 6,
      ctaText: home.instagram?.ctaText || "",
      ctaUrl: home.instagram?.ctaUrl || "",
    },
    brandsMarquee: (home.brands || []).map((b: any) => (typeof b === "object" ? { id: b.id, name: b.name } : { id: b, name: `#${b}` })),
    trustBadges: (home.trustBadges || []).map((b: any) => ({ title: b.title || "", sub: b.sub || "", icon: b.icon || "Truck" })),
    servicesTeaser: (home.servicesTeaser || []).map((s: any) => ({
      title: s.title || "",
      sub: s.sub || "",
      cta: s.cta || "",
      href: s.href || "/services",
      icon: s.icon || "ScanLine",
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
  };
}

// ---- builder draft -> Payload write payload (IDs only) -----------------

export function mapDraftToPayload(draft: HomeDraft): Record<string, unknown> {
  const img = (i: ImageRef) => (i.id ? i.id : null);

  return {
    sections: draft.sections,
    heroSlides: draft.heroSlides.map((s) => ({
      active: s.active,
      tag: s.tag,
      title: s.title,
      sub: s.sub,
      cta: s.cta,
      ctaUrl: s.ctaUrl,
      secondaryCta: s.secondaryCta,
      secondaryCtaUrl: s.secondaryCtaUrl,
      align: s.align,
      overlay: s.overlay,
      bg: s.bg,
      image: img(s.image),
      mobileImage: img(s.mobileImage),
    })),
    marketingBanners: draft.marketingBanners.map((b) => ({
      campaign: b.campaign,
      image: img(b.image),
      imageMobile: img(b.imageMobile),
      imageMode: b.imageMode,
      eyebrow: b.eyebrow,
      title: b.title,
      description: b.description,
      ctaLabel: b.ctaLabel,
      ctaUrl: b.ctaUrl,
      ctaAlign: b.ctaAlign,
      imageFraming: b.imageFraming,
      badgeLabel: b.badgeLabel,
      active: b.active,
      startDate: b.startDate || null,
      endDate: b.endDate || null,
    })),
    ctaPair1: draft.ctaPair1.map((t) => ({ eyebrow: t.eyebrow, title: t.title, bg: t.bg, image: img(t.image) })),
    ctaPair2: draft.ctaPair2.map((t) => ({ eyebrow: t.eyebrow, title: t.title, bg: t.bg, image: img(t.image) })),
    rails: draft.rails.map((r) => ({
      key: r.key,
      eyebrow: r.eyebrow,
      title: r.title,
      subtitle: r.subtitle,
      productSource: r.productSource,
      products: r.products.map((p) => p.id),
      category: r.category || undefined,
      brandFilter: r.brandFilter.id || null,
      limit: r.limit,
      sortOrder: r.sortOrder,
      ctaLabel: r.ctaLabel,
      ctaUrl: r.ctaUrl,
      badgeStyle: r.badgeStyle,
      editorialImage: img(r.editorialImage),
      editorialEyebrow: r.editorialEyebrow,
      editorialTitle: r.editorialTitle,
      editorialDescription: r.editorialDescription,
      editorialCtaLabel: r.editorialCtaLabel,
      editorialCtaUrl: r.editorialCtaUrl,
    })),
    brandsFeatured: draft.brandsFeatured.map((b) => ({
      brand: b.brand.id || null,
      phrase: b.phrase,
      image: img(b.image),
      ctaLabel: b.ctaLabel,
    })),
    promotionsGrid: draft.promotionsGrid,
    coffrets: draft.coffrets.map((c) => ({
      active: c.active,
      tag: c.tag,
      title: c.title,
      sub: c.sub,
      price: c.price,
      priceFrom: c.priceFrom,
      image: img(c.image),
      ctaLabel: c.ctaLabel,
      ctaUrl: c.ctaUrl,
      toast: c.toast,
    })),
    coffretsCopy: draft.coffretsCopy,
    campaignCopy: {
      eyebrow: draft.campaignCopy.eyebrow,
      title: draft.campaignCopy.title,
      description: draft.campaignCopy.description,
      ctaLabel: draft.campaignCopy.ctaLabel,
      ctaUrl: draft.campaignCopy.ctaUrl,
      railTitle: draft.campaignCopy.railTitle,
      image: img(draft.campaignCopy.image),
    },
    campaignProducts: draft.campaignProducts.map((p) => p.id),
    dermoPicks: draft.dermoPicks.map((d) => ({ product: d.product?.id || null, actif: d.actif, claim: d.claim })),
    ctaBannerCopy: { ...draft.ctaBannerCopy },
    dermoCornerCopy: {
      eyebrow: draft.dermoCornerCopy.eyebrow,
      title: draft.dermoCornerCopy.title,
      subtitle: draft.dermoCornerCopy.subtitle,
      ctaLabel: draft.dermoCornerCopy.ctaLabel,
      ctaUrl: draft.dermoCornerCopy.ctaUrl,
      picksTitle: draft.dermoCornerCopy.picksTitle,
      image: img(draft.dermoCornerCopy.image),
      autoplay: draft.dermoCornerCopy.autoplay,
      autoplaySpeedMs: draft.dermoCornerCopy.autoplaySpeedMs,
    },
    imageCarouselCopy: {
      eyebrow: draft.imageCarouselCopy.eyebrow,
      title: draft.imageCarouselCopy.title,
      subtitle: draft.imageCarouselCopy.subtitle,
      ctaLabel: draft.imageCarouselCopy.ctaLabel,
      ctaUrl: draft.imageCarouselCopy.ctaUrl,
      picksTitle: draft.imageCarouselCopy.picksTitle,
      image: img(draft.imageCarouselCopy.image),
    },
    imageCarouselProducts: draft.imageCarouselProducts.map((p) => p.id),
    summerEditCopy: mapSummerEditCopyDraftToPayload(draft.summerEditCopy),
    summerEditActs: mapSummerEditActsDraftToPayload(draft.summerEditActs),
    instagram: draft.instagram,
    brands: draft.brandsMarquee.map((b) => b.id),
    trustBadges: draft.trustBadges,
    servicesTeaser: draft.servicesTeaser,
    newsletterSection: draft.newsletterSection,
  };
}

// ---- Global chrome (Top Bar / Header / Footer) — a separate Payload global
// ("site-chrome") from Home, shown on every route rather than just "/". ----

export const HEADER_ACTION_KEYS = ["services", "contact", "favoris", "panier"] as const;
export const HEADER_ACTION_ICONS = ["MapPin", "MessageCircle", "Phone", "Mail", "HelpCircle", "Heart", "ShoppingBag"] as const;

export type TopBarMessage = { text: string; active: boolean };
export type TopBarDraft = { enabled: boolean; messages: TopBarMessage[]; marqueeSpeedSec: number; mobileMessage: string };
export type LogoDraft = { image: ImageRef; wordmark: string; href: string };
export type HeaderSearchDraft = { enabled: boolean; placeholder: string };
export type HeaderActionDraft = { key: string; label: string; icon: string; href: string; visible: boolean };
export type FooterLinkDraft = { label: string; href: string; visible: boolean };
export type FooterColumnDraft = { title: string; visible: boolean; links: FooterLinkDraft[] };

/**
 * The colour overrides for one chrome surface, as the dashboard edits them.
 *
 * `""` is the meaningful empty state everywhere here: it means "not
 * configured", and it is what the draft round-trips to Payload so the column
 * stays NULL. There is no default — the storefront keeps its own colour for
 * every field left blank (see lib/chromeAppearance.ts).
 */
export type ChromeColorsDraft = {
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  hoverColor: string;
  iconColor: string;
  borderColor: string;
  /** Top bar only. `null` means "not configured", not 0. */
  opacity: number | null;
};

export const emptyChromeColors = (): ChromeColorsDraft => ({
  backgroundColor: "",
  borderColor: "",
  headingColor: "",
  hoverColor: "",
  iconColor: "",
  linkColor: "",
  opacity: null,
  textColor: "",
});

/** Which fields each surface actually exposes. The editors read this so one
 * control list drives all three panels instead of three hand-kept copies. */
export const CHROME_SURFACE_FIELDS = {
  topBar: ["backgroundColor", "textColor", "linkColor", "hoverColor"],
  header: ["backgroundColor", "textColor", "linkColor", "hoverColor", "iconColor", "borderColor"],
  footer: ["backgroundColor", "textColor", "headingColor", "linkColor", "hoverColor", "iconColor", "borderColor"],
} as const satisfies Record<string, readonly (keyof ChromeColorsDraft)[]>;

export const CHROME_FIELD_LABELS: Record<keyof ChromeColorsDraft, string> = {
  backgroundColor: "Couleur de fond",
  borderColor: "Couleur de bordure",
  headingColor: "Couleur des titres",
  hoverColor: "Couleur au survol",
  iconColor: "Couleur des icônes",
  linkColor: "Couleur des liens",
  opacity: "Opacité",
  textColor: "Couleur du texte",
};

export type SiteChromeDraft = {
  topBar: TopBarDraft;
  logo: LogoDraft;
  headerSearch: HeaderSearchDraft;
  headerActions: HeaderActionDraft[];
  footerColumns: FooterColumnDraft[];
  topBarAppearance: ChromeColorsDraft;
  headerAppearance: ChromeColorsDraft;
  footerAppearance: ChromeColorsDraft;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chromeColorsFromDoc(group: any): ChromeColorsDraft {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const opacityRaw = group?.opacity;
  return {
    backgroundColor: text(group?.backgroundColor),
    borderColor: text(group?.borderColor),
    headingColor: text(group?.headingColor),
    hoverColor: text(group?.hoverColor),
    iconColor: text(group?.iconColor),
    linkColor: text(group?.linkColor),
    // Explicitly not `|| null`: 0 is a legitimate opacity and must survive.
    opacity: opacityRaw === null || opacityRaw === undefined || opacityRaw === "" ? null : Number(opacityRaw),
    textColor: text(group?.textColor),
  };
}

/** Blank fields go back as null, not as "": an empty string would be stored
 * and would then read as a configured-but-empty colour. */
function chromeColorsToPayload(draft: ChromeColorsDraft, fields: readonly (keyof ChromeColorsDraft)[]) {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = draft[field];
    out[field] = typeof value === "string" && value.trim() ? value.trim() : null;
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSiteChromeDocToDraft(chrome: any): SiteChromeDraft {
  return {
    topBar: {
      enabled: chrome.topBar?.enabled !== false,
      messages: (chrome.topBar?.messages || []).map((m: any) => ({ text: m.text || "", active: m.active !== false })),
      marqueeSpeedSec: chrome.topBar?.marqueeSpeedSec || 34,
      mobileMessage: chrome.topBar?.mobileMessage || "Livraison offerte dès 399 MAD",
    },
    logo: {
      image: mediaRef(chrome.logo?.image),
      wordmark: chrome.logo?.wordmark || "PARA D'HIVER",
      href: chrome.logo?.href || "/",
    },
    headerSearch: {
      enabled: chrome.headerSearch?.enabled !== false,
      placeholder: chrome.headerSearch?.placeholder || "Rechercher un produit, une marque…",
    },
    headerActions: (chrome.headerActions || []).map((a: any) => ({
      key: a.key,
      label: a.label || "",
      icon: a.icon || "MapPin",
      href: a.href || "",
      visible: a.visible !== false,
    })),
    footerColumns: (chrome.footerColumns || []).map((c: any) => ({
      title: c.title || "",
      visible: c.visible !== false,
      links: (c.links || []).map((l: any) => ({ label: l.label || "", href: l.href || "", visible: l.visible !== false })),
    })),
    topBarAppearance: chromeColorsFromDoc(chrome.topBarAppearance),
    headerAppearance: chromeColorsFromDoc(chrome.headerAppearance),
    footerAppearance: chromeColorsFromDoc(chrome.footerAppearance),
  };
}

export function mapSiteChromeDraftToPayload(draft: SiteChromeDraft): Record<string, unknown> {
  const img = (i: ImageRef) => (i.id ? i.id : null);
  return {
    topBar: draft.topBar,
    logo: { image: img(draft.logo.image), wordmark: draft.logo.wordmark, href: draft.logo.href },
    headerSearch: draft.headerSearch,
    headerActions: draft.headerActions,
    footerColumns: draft.footerColumns,
    topBarAppearance: {
      ...chromeColorsToPayload(draft.topBarAppearance, CHROME_SURFACE_FIELDS.topBar),
      opacity: draft.topBarAppearance.opacity,
    },
    headerAppearance: chromeColorsToPayload(draft.headerAppearance, CHROME_SURFACE_FIELDS.header),
    footerAppearance: chromeColorsToPayload(draft.footerAppearance, CHROME_SURFACE_FIELDS.footer),
  };
}

// ---- Theme (site-wide color tokens) — a separate Payload global ("theme")
// generating the :root CSS variable overrides in app/(site)/layout.tsx. ----

export const THEME_PRESETS = [
  { label: "Para d'Hiver", value: "parad-hiver" },
  { label: "Minimal", value: "minimal" },
  { label: "Botanical", value: "botanical" },
  { label: "Soft Beauty", value: "soft-beauty" },
  { label: "Premium", value: "premium" },
  { label: "Ocean", value: "ocean" },
] as const;

export type ThemeDraft = {
  preset: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorSale: string;
  colorTextPrimary: string;
  colorTextMuted: string;
  colorBackgroundSecondary: string;
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
  buttonHoverText: string;
  buttonRadius: number;
  buttonFontWeight: number;
  buttonLetterSpacing: number;
  badgeBg: string;
  badgeText: string;
  badgeFontSize: number;
  badgeFontWeight: number;
  badgeLetterSpacing: number;
  badgeRadius: number;
  badgePaddingX: number;
  badgePaddingY: number;
  badgeGap: number;
};

// Same size/weight/tracking/radius/padding/gap across every preset — these
// are typographic/spacing tokens, not part of a palette's identity. Only
// badgeBg/badgeText vary per preset (mirroring that preset's button colors).
const BADGE_STYLE_DEFAULTS = {
  badgeFontSize: 10.5,
  badgeFontWeight: 600,
  badgeLetterSpacing: 0.06,
  badgeRadius: 999,
  badgePaddingX: 11,
  badgePaddingY: 5,
  badgeGap: 6,
};

// Curated starting palettes — picking one in the builder fills every color
// field below with these values (the client can still nudge a color
// afterwards, which flips `preset` to "custom" client-side).
export const THEME_PRESET_VALUES: Record<string, Omit<ThemeDraft, "preset">> = {
  "parad-hiver": {
    colorPrimary: "#5E4074",
    colorSecondary: "#008AA5",
    colorAccent: "#5FBE00",
    colorSale: "#FF514D",
    colorTextPrimary: "#373020",
    colorTextMuted: "#757D86",
    colorBackgroundSecondary: "#F7EEE5",
    buttonBg: "#5E4074",
    buttonText: "#FFFFFF",
    buttonHoverBg: "#432951",
    buttonHoverText: "#FFFFFF",
    buttonRadius: 999,
    buttonFontWeight: 600,
    buttonLetterSpacing: 0.08,
    badgeBg: "#5E4074",
    badgeText: "#FFFFFF",
    ...BADGE_STYLE_DEFAULTS,
  },
  minimal: {
    colorPrimary: "#1A1A1A",
    colorSecondary: "#6B6B6B",
    colorAccent: "#2F2F2F",
    colorSale: "#D64545",
    colorTextPrimary: "#111111",
    colorTextMuted: "#8A8A8A",
    colorBackgroundSecondary: "#F5F5F5",
    // Every preset's button pair keeps >= 4.5:1 contrast with white text
    // (checked against WCAG AA) — botanical/ocean use their own primary as-is
    // (already accessible), soft-beauty's is deliberately darkened since its
    // pale pink primary fails contrast outright at ~2.3:1.
    buttonBg: "#1A1A1A",
    buttonText: "#FFFFFF",
    buttonHoverBg: "#141414",
    buttonHoverText: "#FFFFFF",
    buttonRadius: 999,
    buttonFontWeight: 600,
    buttonLetterSpacing: 0.08,
    badgeBg: "#1A1A1A",
    badgeText: "#FFFFFF",
    ...BADGE_STYLE_DEFAULTS,
  },
  botanical: {
    colorPrimary: "#3F6B4A",
    colorSecondary: "#A9906B",
    colorAccent: "#6B8F3F",
    colorSale: "#C0563A",
    colorTextPrimary: "#2B2B22",
    colorTextMuted: "#7C8577",
    colorBackgroundSecondary: "#F1EEE3",
    buttonBg: "#3F6B4A",
    buttonText: "#FFFFFF",
    buttonHoverBg: "#31533A",
    buttonHoverText: "#FFFFFF",
    buttonRadius: 999,
    buttonFontWeight: 600,
    buttonLetterSpacing: 0.08,
    badgeBg: "#3F6B4A",
    badgeText: "#FFFFFF",
    ...BADGE_STYLE_DEFAULTS,
  },
  "soft-beauty": {
    colorPrimary: "#D89AA8",
    colorSecondary: "#C9A88A",
    colorAccent: "#E8B4C2",
    colorSale: "#E0637A",
    colorTextPrimary: "#4A3B3D",
    colorTextMuted: "#9B8689",
    colorBackgroundSecondary: "#FBF1EE",
    buttonBg: "#77555C",
    buttonText: "#FFFFFF",
    buttonHoverBg: "#5D4248",
    buttonHoverText: "#FFFFFF",
    buttonRadius: 999,
    buttonFontWeight: 600,
    buttonLetterSpacing: 0.08,
    badgeBg: "#77555C",
    badgeText: "#FFFFFF",
    ...BADGE_STYLE_DEFAULTS,
  },
  premium: {
    colorPrimary: "#5B4636",
    colorSecondary: "#C9A063",
    colorAccent: "#8A6A45",
    colorSale: "#B5453A",
    colorTextPrimary: "#362B22",
    colorTextMuted: "#8C7E6E",
    colorBackgroundSecondary: "#F5EEE0",
    buttonBg: "#5B4636",
    buttonText: "#FFFFFF",
    buttonHoverBg: "#47372A",
    buttonHoverText: "#FFFFFF",
    buttonRadius: 999,
    buttonFontWeight: 600,
    buttonLetterSpacing: 0.08,
    badgeBg: "#5B4636",
    badgeText: "#FFFFFF",
    ...BADGE_STYLE_DEFAULTS,
  },
  ocean: {
    colorPrimary: "#1D6FA5",
    colorSecondary: "#2FB6B0",
    colorAccent: "#4FA0D9",
    colorSale: "#E0554A",
    colorTextPrimary: "#1C2B33",
    colorTextMuted: "#7C919B",
    colorBackgroundSecondary: "#EAF6F6",
    buttonBg: "#1D6FA5",
    buttonText: "#FFFFFF",
    buttonHoverBg: "#175781",
    buttonHoverText: "#FFFFFF",
    buttonRadius: 999,
    buttonFontWeight: 600,
    buttonLetterSpacing: 0.08,
    badgeBg: "#1D6FA5",
    badgeText: "#FFFFFF",
    ...BADGE_STYLE_DEFAULTS,
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapThemeDocToDraft(theme: any): ThemeDraft {
  return {
    preset: theme.preset || "parad-hiver",
    colorPrimary: theme.colorPrimary || "#5E4074",
    colorSecondary: theme.colorSecondary || "#008AA5",
    colorAccent: theme.colorAccent || "#5FBE00",
    colorSale: theme.colorSale || "#FF514D",
    colorTextPrimary: theme.colorTextPrimary || "#373020",
    colorTextMuted: theme.colorTextMuted || "#757D86",
    colorBackgroundSecondary: theme.colorBackgroundSecondary || "#F7EEE5",
    buttonBg: theme.buttonBg || "#5E4074",
    buttonText: theme.buttonText || "#FFFFFF",
    buttonHoverBg: theme.buttonHoverBg || "#432951",
    buttonHoverText: theme.buttonHoverText || "#FFFFFF",
    buttonRadius: typeof theme.buttonRadius === "number" ? theme.buttonRadius : 999,
    buttonFontWeight: typeof theme.buttonFontWeight === "number" ? theme.buttonFontWeight : 600,
    buttonLetterSpacing: typeof theme.buttonLetterSpacing === "number" ? theme.buttonLetterSpacing : 0.08,
    badgeBg: theme.badgeBg || "#5E4074",
    badgeText: theme.badgeText || "#FFFFFF",
    badgeFontSize: typeof theme.badgeFontSize === "number" ? theme.badgeFontSize : 10.5,
    badgeFontWeight: typeof theme.badgeFontWeight === "number" ? theme.badgeFontWeight : 600,
    badgeLetterSpacing: typeof theme.badgeLetterSpacing === "number" ? theme.badgeLetterSpacing : 0.06,
    badgeRadius: typeof theme.badgeRadius === "number" ? theme.badgeRadius : 999,
    badgePaddingX: typeof theme.badgePaddingX === "number" ? theme.badgePaddingX : 11,
    badgePaddingY: typeof theme.badgePaddingY === "number" ? theme.badgePaddingY : 5,
    badgeGap: typeof theme.badgeGap === "number" ? theme.badgeGap : 6,
  };
}

export function mapThemeDraftToPayload(draft: ThemeDraft): Record<string, unknown> {
  return { ...draft };
}

// ---- Summer Edit (seasonal campaign block on Home) — separate from
// Dermo Corner and Campaign ("Nos coups de cœur"). ----

export type SummerEditHighlightDraft = { icon: string; label: string };
export type SummerEditCarouselDraft = { autoplay: boolean; autoplaySpeedMs: number; showCounter: boolean; showProgress: boolean };
export type SummerEditAnimationDraft = { enableReveal: boolean; enableParallax: boolean; staggerProducts: boolean; speed: "slow" | "normal" | "fast" };
export type SummerEditColorsDraft = { background: string; text: string; accent: string; cta: string };
export type SummerEditCopyDraft = {
  eyebrow: string;
  year: string;
  title: string;
  titleAccent: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  heroImage: ImageRef;
  heroImageMobile: ImageRef;
  imagePosition: "left" | "right";
  imageScale: number;
  overlay: boolean;
  highlights: SummerEditHighlightDraft[];
  carousel: SummerEditCarouselDraft;
  animation: SummerEditAnimationDraft;
  colors: SummerEditColorsDraft;
  fullWidth: boolean;
};
export type SummerEditActDraft = { eyebrow: string; title: string; description: string; products: ProductRef[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSummerEditCopyDocToDraft(home: any): SummerEditCopyDraft {
  return {
    eyebrow: home.summerEditCopy?.eyebrow || "01 / Summer Edit",
    year: home.summerEditCopy?.year || "",
    title: home.summerEditCopy?.title || "L'été commence",
    titleAccent: home.summerEditCopy?.titleAccent || "par la peau",
    description: home.summerEditCopy?.description || "",
    ctaLabel: home.summerEditCopy?.ctaLabel || "Découvrir la sélection",
    ctaUrl: home.summerEditCopy?.ctaUrl || "/catalogue",
    heroImage: mediaRef(home.summerEditCopy?.heroImage),
    heroImageMobile: mediaRef(home.summerEditCopy?.heroImageMobile),
    imagePosition: home.summerEditCopy?.imagePosition || "right",
    imageScale: home.summerEditCopy?.imageScale || 1.06,
    overlay: home.summerEditCopy?.overlay === true,
    highlights: (home.summerEditCopy?.highlights || []).map((h: { icon?: string; label?: string }) => ({ icon: h.icon || "Sun", label: h.label || "" })),
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
      speed: home.summerEditCopy?.animation?.speed || "normal",
    },
    colors: {
      background: home.summerEditCopy?.colors?.background || "#F7EEE5",
      text: home.summerEditCopy?.colors?.text || "#373020",
      accent: home.summerEditCopy?.colors?.accent || "#6D28D9",
      cta: home.summerEditCopy?.colors?.cta || "#6D28D9",
    },
    fullWidth: home.summerEditCopy?.fullWidth === true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSummerEditActsDocToDraft(home: any): SummerEditActDraft[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (home.summerEditActs || []).map((a: any) => ({
    eyebrow: a.eyebrow || "",
    title: a.title || "",
    description: a.description || "",
    products: (a.products || []).map(productRef).filter(Boolean) as ProductRef[],
  }));
}

export function mapSummerEditCopyDraftToPayload(draft: SummerEditCopyDraft): Record<string, unknown> {
  const img = (i: ImageRef) => (i.id ? i.id : null);
  return {
    eyebrow: draft.eyebrow,
    year: draft.year,
    title: draft.title,
    titleAccent: draft.titleAccent,
    description: draft.description,
    ctaLabel: draft.ctaLabel,
    ctaUrl: draft.ctaUrl,
    heroImage: img(draft.heroImage),
    heroImageMobile: img(draft.heroImageMobile),
    imagePosition: draft.imagePosition,
    imageScale: draft.imageScale,
    overlay: draft.overlay,
    highlights: draft.highlights,
    carousel: draft.carousel,
    animation: draft.animation,
    colors: draft.colors,
    fullWidth: draft.fullWidth,
  };
}

export function mapSummerEditActsDraftToPayload(draft: SummerEditActDraft[]): Record<string, unknown>[] {
  return draft.map((a) => ({
    eyebrow: a.eyebrow,
    title: a.title,
    description: a.description,
    products: a.products.map((p) => p.id),
  }));
}

// ---- Navigation (main nav + every mega menu) — a separate Payload global
// ("navigation"), decoupled from the Categories collection on purpose. ----

export const NAV_LINK_TYPES = [
  { label: "Catégorie", value: "category" },
  { label: "Marque", value: "brand" },
  { label: "Collection", value: "collection" },
  { label: "Page", value: "page" },
  { label: "URL personnalisée", value: "custom" },
] as const;

export const MEGA_LINK_TYPES = [
  { label: "Catégorie", value: "category" },
  { label: "Marque", value: "brand" },
  { label: "URL personnalisée", value: "custom" },
] as const;

export const NAV_BADGE_COLORS = [
  { label: "Aucun", value: "none" },
  { label: "Plum", value: "plum" },
  { label: "Teal", value: "teal" },
  { label: "Promo", value: "sale" },
] as const;

export const NAV_COLLECTION_ROUTES = [
  { label: "Catalogue complet", value: "/catalogue" },
  { label: "Toutes les marques", value: "/marques" },
  { label: "Coffrets & cadeaux", value: "/collections" },
  { label: "Soldes", value: "/shop/soldes" },
  { label: "Nouveautés", value: "/shop/nouveautes" },
] as const;

export const NAV_PAGE_ROUTES = [
  { label: "Accueil", value: "/" },
  { label: "Services", value: "/services" },
  { label: "Contact", value: "/contact" },
] as const;

export type CategoryRef = { id?: number; name: string };

/**
 * Presentation fields the Storefront Builder does not (yet) edit, carried
 * verbatim through the draft round-trip.
 *
 * Without this the Builder was destructive: it rebuilt every nav link from
 * the handful of fields it knows about, so saving the Navigation tab silently
 * wiped any colour, opacity, badge or blink configured in Payload admin —
 * which is exactly why mega-menu links stopped blinking. Passing the whole
 * sub-object through means the Builder can only change what it actually
 * shows, and nothing else.
 */
export type NavLinkStylePassthrough = {
  openInNewTab?: boolean;
  badgeLabel?: string;
  badgeColor?: string;
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  appearance?: Record<string, unknown>;
  animation?: Record<string, unknown>;
};

export type NavLinkDraft = {
  label: string;
  visible: boolean;
  type: string;
  category: CategoryRef;
  brand: { id?: number; name: string };
  collectionRoute: string;
  pageRoute: string;
  customUrl: string;
  /** Not rendered by the Builder — preserved so saving never destroys it. */
  style?: NavLinkStylePassthrough;
};
export type NavMegaColumnDraft = { title: string; links: NavLinkDraft[] };
export type NavPromoDraft = { image: ImageRef; title: string; description: string; ctaLabel: string; ctaUrl: string };
export type NavItemDraft = NavLinkDraft & {
  badgeLabel: string;
  badgeColor: string;
  megaMenuEnabled: boolean;
  megaMenuSubtitle: string;
  megaMenuColumns: NavMegaColumnDraft[];
  megaMenuPromo: NavPromoDraft;
};
/** One chip of the mobile quick-category strip. `NavLinkDraft` rather than a
 * bespoke shape: a chip points at a category, a brand or a route the same way
 * every other navigation link does, so it shares the link mapper and the
 * LinkPicker instead of growing a parallel way to describe a destination. */
export type CategoryChipDraft = NavLinkDraft;

export type CategoryStripDraft = {
  enabled: boolean;
  showAllChip: boolean;
  allChipLabel: string;
  items: CategoryChipDraft[];
};

export type NavigationDraft = { items: NavItemDraft[]; catStrip: CategoryStripDraft };

export const EMPTY_CATEGORY_CHIP: CategoryChipDraft = {
  brand: { name: "" },
  category: { name: "" },
  collectionRoute: "",
  customUrl: "",
  label: "Nouvelle catégorie",
  pageRoute: "",
  type: "category",
  visible: true,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNavLinkDocToDraft(l: any): NavLinkDraft {
  return {
    label: l.label || "",
    visible: l.visible !== false,
    type: l.type || "custom",
    category: relRef(l.category),
    brand: relRef(l.brand),
    collectionRoute: l.collectionRoute || "",
    pageRoute: l.pageRoute || "",
    customUrl: l.customUrl || "",
    style: {
      animation: l.animation ?? undefined,
      appearance: l.appearance ?? undefined,
      badgeBackgroundColor: l.badgeBackgroundColor ?? undefined,
      badgeColor: l.badgeColor ?? undefined,
      badgeLabel: l.badgeLabel ?? undefined,
      badgeTextColor: l.badgeTextColor ?? undefined,
      openInNewTab: l.openInNewTab ?? undefined,
    },
  };
}

function mapNavLinkDraftToPayload(l: NavLinkDraft): Record<string, unknown> {
  return {
    label: l.label,
    visible: l.visible,
    type: l.type,
    category: l.category.id || null,
    brand: l.brand.id || null,
    collectionRoute: l.collectionRoute || undefined,
    pageRoute: l.pageRoute || undefined,
    customUrl: l.customUrl,
    // Spread last so the preserved values are written back unchanged.
    ...(l.style ?? {}),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNavigationDocToDraft(nav: any): NavigationDraft {
  return {
    catStrip: {
      allChipLabel: nav.catStrip?.allChipLabel || "Tout",
      enabled: nav.catStrip?.enabled === true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (nav.catStrip?.items || []).map((i: any) => mapNavLinkDocToDraft(i)),
      showAllChip: nav.catStrip?.showAllChip !== false,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (nav.items || []).map((item: any) => ({
      ...mapNavLinkDocToDraft(item),
      badgeLabel: item.badgeLabel || "",
      badgeColor: item.badgeColor || "none",
      megaMenuEnabled: item.megaMenuEnabled === true,
      megaMenuSubtitle: item.megaMenu?.subtitle || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      megaMenuColumns: (item.megaMenu?.columns || []).map((c: any) => ({
        title: c.title || "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        links: (c.links || []).map((l: any) => mapNavLinkDocToDraft(l)),
      })),
      megaMenuPromo: {
        image: mediaRef(item.megaMenu?.promo?.image),
        title: item.megaMenu?.promo?.title || "",
        description: item.megaMenu?.promo?.description || "",
        ctaLabel: item.megaMenu?.promo?.ctaLabel || "",
        ctaUrl: item.megaMenu?.promo?.ctaUrl || "",
      },
    })),
  };
}

export function mapNavigationDraftToPayload(draft: NavigationDraft): Record<string, unknown> {
  const img = (i: ImageRef) => (i.id ? i.id : null);
  return {
    catStrip: {
      allChipLabel: draft.catStrip.allChipLabel,
      enabled: draft.catStrip.enabled,
      // The chips carry no badge or animation of their own — a strip is a row
      // of plain shortcuts — so only the link half of the shared mapper is
      // meaningful here. Writing the style passthrough too would store fields
      // the Payload field group does not define.
      items: draft.catStrip.items.map((chip) => {
        const { label, visible, type, category, brand, collectionRoute, pageRoute, customUrl } =
          mapNavLinkDraftToPayload(chip) as Record<string, unknown>;
        return { brand, category, collectionRoute, customUrl, label, pageRoute, type, visible };
      }),
      showAllChip: draft.catStrip.showAllChip,
    },
    items: draft.items.map((item) => ({
      ...mapNavLinkDraftToPayload(item),
      // The Builder *does* edit these two, so its values win over the
      // passthrough copy spread in above.
      badgeLabel: item.badgeLabel,
      badgeColor: item.badgeColor,
      megaMenuEnabled: item.megaMenuEnabled,
      megaMenu: {
        subtitle: item.megaMenuSubtitle,
        columns: item.megaMenuColumns.map((c) => ({
          title: c.title,
          links: c.links.map(mapNavLinkDraftToPayload),
        })),
        promo: {
          image: img(item.megaMenuPromo.image),
          title: item.megaMenuPromo.title,
          description: item.megaMenuPromo.description,
          ctaLabel: item.megaMenuPromo.ctaLabel,
          ctaUrl: item.megaMenuPromo.ctaUrl,
        },
      },
    })),
  };
}
