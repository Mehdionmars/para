import { ProductGridSkeleton } from "@/components/skeleton";

/**
 * Replaces the generic pulsing-logo fallback for the catalogue route.
 *
 * The logo skeleton says "something is happening"; this one says "a grid of
 * products is arriving, here is where they will be" — and holds the layout
 * so nothing jumps when they do.
 */
export default function CatalogueLoading() {
  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <ProductGridSkeleton count={12} />
    </div>
  );
}
