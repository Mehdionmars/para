import type { HomeDraft, ProductRef, SectionEntryKey } from "@/lib/dashboard/storefront-mapping";
import { isCampaignLive } from "@/lib/storefront/marketingBanners";

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

    // Every live campaign with a picture is a slide of the carousel, so the
    // section disappears only when there is not a single one.
    case "marketingBanner": {
      const live = draft.marketingBanners.filter((b) => isCampaignLive(b, now));
      if (live.length === 0) return "aucune campagne active à cette date";
      if (live.some((b) => b.image.url || b.image.id)) return null;
      return live.length === 1 ? "la campagne active n'a pas d'image" : "aucune campagne active n'a d'image";
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

    // A picture alone is enough: with no title it is a full-width banner and
    // the picture itself is the link.
    case "ctaBanner": {
      const c = draft.ctaBannerCopy;
      const hasImage = Boolean(c.bgImage?.url || c.bgImage?.id);
      return !c.title.trim() && !c.ctaLabel.trim() && !hasImage ? "ni titre, ni bouton, ni image" : null;
    }

    case "instagram":
      if (!draft.instagram.show) return "désactivé dans ses réglages";
      return ctx.instagramPostCount === 0 ? "aucune publication synchronisée" : null;

    default:
      return null;
  }
}
