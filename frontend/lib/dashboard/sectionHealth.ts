import type { HomeDraft, ProductRef, SectionEntryKey } from "@/lib/dashboard/storefront-mapping";

/**
 * Why a homepage section ticked "visible" in the Storefront Builder would
 * still render nothing on the site — or null when it will show.
 *
 * Every home component hides itself rather than print an empty shell (Summer
 * Edit with no image, "Nos services" with no card…), which is right for
 * shoppers and baffling in the builder: the list said 22 visible blocks and
 * the preview showed 17, with nothing to say which five were missing or why.
 * Each rule here mirrors that component's own early `return null`, from the
 * draft the builder already holds, so the list can say it before the editor
 * goes looking.
 *
 * Only certain reasons are reported. A rail whose products all sold out, or a
 * promotions grid with no discounted product, depend on live catalogue data
 * the draft does not carry, and a guess would be worse than silence.
 */

export type SectionHealthContext = {
  /** Published Instagram posts. Undefined when it could not be counted. */
  instagramPostCount?: number;
  now?: number;
};

/** A picked product the storefront will actually show: published, not
 * discontinued, in stock. Picks added in this session carry no such facts and
 * are given the benefit of the doubt. */
const sellable = (p: ProductRef) => p.sellable !== false;

export function hiddenReason(key: SectionEntryKey, draft: HomeDraft, ctx: SectionHealthContext = {}): string | null {
  const now = ctx.now ?? Date.now();

  switch (key) {
    case "summerEdit": {
      if (!draft.summerEditCopy.heroImage.url && !draft.summerEditCopy.heroImage.id) return "aucune image principale";
      const acts = draft.summerEditActs.filter((a) => a.products.some(sellable));
      return acts.length === 0 ? "aucun produit en vente dans les actes" : null;
    }

    case "marketingBanner": {
      const live = draft.marketingBanners.find((b) => {
        if (!b.active) return false;
        if (b.startDate && now < new Date(b.startDate).getTime()) return false;
        if (b.endDate && now > new Date(b.endDate).getTime()) return false;
        return true;
      });
      if (!live) return "aucune campagne active à cette date";
      return live.image.url || live.image.id ? null : "la campagne active n'a pas d'image";
    }

    case "services":
      return draft.servicesTeaser.length === 0 ? "aucune carte service" : null;

    case "coffrets":
      return draft.coffrets.some((c) => c.active !== false) ? null : "aucun coffret actif";

    case "campaign":
      if (draft.campaignProducts.length === 0) return "aucun produit choisi";
      return draft.campaignProducts.some(sellable) ? null : "les produits choisis sont non publiés ou en rupture";

    case "imageCarousel":
      if (!draft.imageCarouselCopy.image.url && !draft.imageCarouselCopy.image.id) return "aucune image";
      if (draft.imageCarouselProducts.length === 0) return "aucun produit choisi";
      return draft.imageCarouselProducts.some(sellable) ? null : "les produits choisis sont non publiés ou en rupture";

    case "brandsFeatured":
      return draft.brandsFeatured.length === 0 ? "aucune marque choisie" : null;

    case "ctaBanner":
      return !draft.ctaBannerCopy.title.trim() && !draft.ctaBannerCopy.ctaLabel.trim() ? "ni titre ni bouton" : null;

    case "instagram":
      if (!draft.instagram.show) return "désactivé dans ses réglages";
      return ctx.instagramPostCount === 0 ? "aucune publication synchronisée" : null;

    default:
      return null;
  }
}
