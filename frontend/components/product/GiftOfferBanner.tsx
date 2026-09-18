import { Gift } from "lucide-react";
import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import type { GiftOffer } from "@/lib/cart/gift";
import { routes } from "@/lib/routes";

/**
 * "3 produits Filorga achetés = Summer Trousse offerte", on the brand's
 * product pages and on its brand page.
 *
 * Only a promise the checkout keeps: the offer is read from the CMS and the
 * gift is decided on the order by backend/src/lib/giftOffer.ts. The caller
 * decides where it applies (isGiftBrand); this only draws it.
 */
export function GiftOfferBanner({ offer, linkToBrand = true }: { offer: GiftOffer; linkToBrand?: boolean }) {
  if (!offer.enabled) return null;
  const units = offer.minItems > 1 ? `${offer.minItems} produits` : "1 produit";

  return (
    <aside aria-label={`Offre ${offer.brandName}`} className="gift-offer">
      {offer.image ? (
        <div className="gift-offer-media">
          <CloudinaryImage alt={`${offer.giftName} — offre ${offer.brandName}`} crop="limit" fill sizes="120px" src={offer.image} style={{ objectFit: "cover" }} />
        </div>
      ) : (
        <div aria-hidden="true" className="gift-offer-icon">
          <Gift size={22} strokeWidth={1.6} />
        </div>
      )}
      <div className="gift-offer-body">
        <p className="gift-offer-eyebrow">Offre {offer.brandName}</p>
        <p className="gift-offer-title">
          {units} {offer.brandName} achetés = <strong>{offer.giftName}</strong>
        </p>
        <p className="gift-offer-note">Le cadeau est ajouté automatiquement à votre commande.</p>
        {linkToBrand && offer.brandSlug && (
          <Link className="gift-offer-link" href={routes.brand(offer.brandSlug)}>
            Voir les produits {offer.brandName}
          </Link>
        )}
      </div>
    </aside>
  );
}
