"use client";

import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { ProductBadges } from "@/components/product/ProductBadges";
import { money } from "@/data/products";
import type { RawBadge } from "@/lib/productBadges";

/**
 * Live preview of the storefront card, inside the admin form.
 *
 * ## Why this is not the storefront `ProductCard`
 *
 * That component calls `useCart`, `useFavorites` and `useToast` — contexts
 * that only exist under the storefront layout. Rendering it here throws
 * ("useCart must be used within a CartProvider"), and the fix is not to mount
 * those providers in the dashboard: a preview that joins the operator's own
 * cart or favourites, and writes to the storefront's localStorage, would be a
 * genuine bug rather than a preview.
 *
 * What must not be duplicated is the *logic*, and it isn't: badge resolution
 * (presets, priority order, the 3-badge cap and the automatic discount pill)
 * comes from `ProductBadges`/`lib/productBadges`, and price formatting from
 * `money`. Only the markup is local, and it has to be — the real card carries
 * a favourite button and an add-to-cart control that have no business in an
 * admin form.
 */
export function ProductPreview({
  name,
  brand,
  size,
  price,
  oldPrice,
  badges,
  imageUrl,
}: {
  name: string;
  brand: string;
  size: string;
  price: number;
  oldPrice?: number;
  /** Raw form rows; the shared resolver turns them into the real stack. */
  badges: RawBadge[];
  imageUrl?: string;
}) {
  const safePrice = Number.isFinite(price) ? price : 0;
  // An oldPrice below the price is a data-entry slip, not a saving — the
  // shared resolver already refuses to draw a pill for it, and the struck
  // price is hidden here for the same reason.
  const showOld = !!oldPrice && oldPrice > safePrice;

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Aperçu</p>

      <div className="mx-auto w-full max-w-[230px]">
        <article className="overflow-hidden rounded-[18px] border border-[rgba(94,64,116,.1)] bg-white">
          <div className="relative aspect-[3/4] overflow-hidden bg-[#F4F1EC]">
            <CloudinaryImage
              src={imageUrl || null}
              alt=""
              preset="productCard"
              fill
              sizes="240px"
              className="object-cover"
              fallbackSrc={PRODUCT_PLACEHOLDER}
            />
            <ProductBadges badges={badges} price={safePrice} oldPrice={oldPrice ?? null} compact />
          </div>

          <div className="flex flex-col gap-1 p-3">
            <p className="truncate text-[10.5px] uppercase tracking-wider text-gray-500">{brand || "Marque"}</p>
            <p className="line-clamp-2 text-[13px] leading-snug text-gray-900">{name || "Nom du produit"}</p>
            {size && <p className="text-[10.5px] text-gray-400">{size}</p>}
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[15px] font-semibold text-[#5e4074]">{money(safePrice)}</span>
              {showOld && <span className="text-[11px] text-gray-400 line-through">{money(oldPrice!)}</span>}
            </p>
          </div>
        </article>
      </div>

      <p className="mt-2 text-center text-[11px] text-gray-400">
        Badges, réduction et prix rendus par la même logique que la boutique.
      </p>
    </div>
  );
}
