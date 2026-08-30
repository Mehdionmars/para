import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, type Product } from "@/data/products";

/** `products` comes from the live Payload fetch on the product page (same
 * category, in stock). Callers that omit it fall back to the static
 * snapshot. Renders nothing when there is genuinely nothing to suggest,
 * rather than an empty headed section. */
export function SimilarProducts({
  product,
  products,
}: {
  product: Product;
  products?: (Product & { image?: string })[];
}) {
  const similar = products ?? PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);
  if (similar.length === 0) return null;

  return (
    <>
      <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(24px,3vw,34px)", margin: "clamp(34px,5vw,60px) 0 22px" }}>
        Vous aimerez aussi
      </h2>
      {/* auto-FILL, not auto-fit: suggestions are filtered by category and
          can legitimately come back as 1-3 items. auto-fit collapses the
          empty tracks and stretches those few cards across the full width,
          which looks broken next to the rest of the grid. */}
      <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,208px),1fr))", columnGap: "clamp(16px,2vw,28px)", rowGap: "clamp(30px,3.4vw,46px)" }}>
        {similar.map((p) => (
          <div key={p.id} role="listitem">
            <ProductCard product={p} variant="similar" />
          </div>
        ))}
      </div>
    </>
  );
}
