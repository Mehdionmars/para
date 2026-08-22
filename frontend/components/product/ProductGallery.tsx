"use client";

import { useEffect, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { ProductBadges } from "@/components/product/ProductBadges";
import { type Product, productGalleryImages } from "@/data/products";

/**
 * The product's photographs.
 *
 * Two things it must not do, both of which it used to. It framed the hero as
 * a full-width 1:1 square, so on a laptop the image alone stood ~600px tall
 * and pushed the price, the option selector and the buy button below the
 * fold — the shopper met the product and had to scroll to find out what it
 * cost. And it drew that image with `object-fit: cover`, which crops a
 * packshot to fill the square: the very margins a product photo is composed
 * with, and sometimes the cap or the base.
 *
 * The frame is now bounded by the viewport (never taller than it, and always
 * shorter than the buy panel beside it), and the photo is contained inside
 * it at its own proportions.
 */
export function ProductGallery({
  product,
  images,
  /** Overrides the hero when the selected option has a photo of its own. */
  variantImage = "",
}: {
  product: Product;
  /** From the live Payload fetch. Callers on the static snapshot omit it. */
  images?: string[];
  variantImage?: string;
}) {
  const gallery = images?.length ? images : productGalleryImages(product.id);
  const [active, setActive] = useState(0);

  // Selecting an option that ships its own photo moves the hero to it. If the
  // shopper then picks a thumbnail, that wins until the option changes again.
  useEffect(() => {
    if (!variantImage) return;
    const at = gallery.indexOf(variantImage);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(at === -1 ? 0 : at);
  }, [variantImage, gallery]);

  const hero = variantImage && gallery.indexOf(variantImage) === -1 ? variantImage : gallery[active];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="pdp-media">
        {/* The PDP hero is the LCP element: `priority` preloads it, and
            c_limit means a smaller original is never upscaled. */}
        <CloudinaryImage
          alt={product.name}
          crop="limit"
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 620px"
          src={hero}
          style={{ objectFit: "contain" }}
        />
        <ProductBadges badges={product.badges} oldPrice={product.old || null} price={product.price} />
      </div>

      {gallery.length > 1 && (
        <div className="pdp-thumbs">
          {gallery.map((src, i) => (
            <button
              aria-label={`Voir l'image ${i + 1}`}
              aria-pressed={active === i && !(variantImage && gallery.indexOf(variantImage) === -1)}
              className="pdp-thumb"
              key={src + i}
              onClick={() => setActive(i)}
              style={{
                borderColor: active === i ? "var(--pdh-plum)" : "rgba(94,64,116,.12)",
              }}
              type="button"
            >
              {/* Thumbnails are tiny — 160px is plenty, and lazy by default.
                  contain here too: a cropped thumbnail of a contained hero
                  shows a different shape than the image it selects. */}
              <CloudinaryImage alt="" crop="limit" fill sizes="160px" src={src} style={{ objectFit: "contain" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
