"use client";

import { useState } from "react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductReassurance } from "@/components/product/ProductReassurance";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import type { LiveProductDetail } from "@/lib/storefront/products";

/**
 * Owns the one piece of state the two halves of a product page share: which
 * option is selected.
 *
 * The gallery and the buy panel used to be siblings under a server component,
 * so a variant with its own photograph could never move the hero — the panel
 * knew which option was chosen and the gallery had no way to hear about it.
 * This is the single source of truth both read from; everything else about
 * the page stays server-rendered.
 */
export function ProductDetail({ product }: { product: LiveProductDetail }) {
  // The first option that can actually be bought, so a shopper doesn't land
  // pre-set to a sold-out size.
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (product.variants.length === 0) return null;
    const firstAvailable = product.variants.find((v) => v.stockState !== "out");
    return (firstAvailable ?? product.variants[0]).id;
  });

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))",
        gap: "clamp(24px,3.4vw,56px)",
        alignItems: "flex-start",
      }}
    >
      <ProductGallery images={product.gallery} product={product} variantImage={selectedVariant?.image || ""} />
      <div>
        <PurchasePanel
          onSelectVariant={setSelectedVariantId}
          product={product}
          sameVariantPrice={product.sameVariantPrice}
          selectedVariantId={selectedVariantId}
          stock={product.stock}
          stockState={product.stockState}
          variantOptionLabel={product.variantOptionLabel}
          variants={product.variants}
        />
        <ProductReassurance />
      </div>
    </div>
  );
}
