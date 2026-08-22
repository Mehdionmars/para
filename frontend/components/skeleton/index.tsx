import { Skeleton, SkeletonRegion } from "./Skeleton";

export { Skeleton, SkeletonRegion };

/**
 * Skeletons for each real surface of the storefront and dashboard.
 *
 * Each one mirrors the box of the component it stands in for — same aspect
 * ratios, same paddings, same number of lines — so the swap to real content
 * doesn't move anything. Where the real component's dimensions come from a
 * clamp(), the skeleton uses the same clamp().
 */

/** Mirrors the frameless ProductCard: bare 1:1 shot, brand line, two title
 * lines, price, and the hairline the call to action sits under. */
export function ProductCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <article style={{ display: "flex", flexDirection: "column" }}>
      {/* No panel and no inset: the real card has neither, and a skeleton
          whose proportions differ from the real card produces a visible jump
          at the moment the data arrives — the one thing it exists to prevent. */}
      <Skeleton height={0} radius={6} style={{ aspectRatio: "1/1", height: "auto", marginBottom: 14, minHeight: 0 }} />
      <Skeleton height={9} radius={4} width="38%" />
      <Skeleton height={14} radius={4} style={{ marginTop: 6 }} width="92%" />
      <Skeleton height={14} radius={4} style={{ marginTop: 5 }} width="64%" />
      <Skeleton height={10} radius={4} style={{ marginTop: 7 }} width="30%" />
      <Skeleton height={large ? 26 : 22} radius={5} style={{ marginTop: 8 }} width={94} />
      <div style={{ borderTop: "1px solid rgba(94,64,116,.16)", marginTop: 12, paddingTop: 12 }}>
        <Skeleton height={11} radius={4} width="52%" />
      </div>
    </article>
  );
}

/** A grid of cards, matching the catalogue's own auto-fill track sizing. */
export function ProductGridSkeleton({ count = 12, large = true }: { count?: number; large?: boolean }) {
  return (
    <SkeletonRegion label="Chargement des produits">
      <div
        role="presentation"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,208px),1fr))",
          columnGap: "clamp(16px,2vw,28px)",
          rowGap: "clamp(30px,3.4vw,46px)",
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} large={large} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Mirrors the PDP two-column layout: gallery + purchase panel. */
export function ProductDetailSkeleton() {
  return (
    <SkeletonRegion label="Chargement du produit">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
          gap: "clamp(24px,3.4vw,56px)",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton radius="clamp(16px,2vw,24px)" style={{ aspectRatio: "1/1", height: "auto" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} radius={12} style={{ aspectRatio: "1/1", height: "auto" }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Skeleton width="30%" height={11} radius={4} />
          <Skeleton width="88%" height={34} radius={6} />
          <Skeleton width="24%" height={12} radius={4} />
          <Skeleton width="100%" height={13} radius={4} />
          <Skeleton width="94%" height={13} radius={4} />
          <Skeleton width="60%" height={13} radius={4} />
          <Skeleton width={140} height={34} radius={6} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={54} radius={999} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={50} radius={999} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Full-bleed hero block, same rounded box as HeroCarousel. */
export function HeroSkeleton() {
  return (
    <SkeletonRegion label="Chargement de la bannière">
      <Skeleton
        radius="clamp(16px,2vw,24px)"
        style={{ width: "100%", height: "clamp(320px,42vw,560px)" }}
      />
    </SkeletonRegion>
  );
}

/** Category / collection tiles. */
export function CategorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonRegion label="Chargement des catégories">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,220px),1fr))", gap: 16 }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton radius={16} style={{ aspectRatio: "4/3", height: "auto" }} />
            <Skeleton width="58%" height={13} radius={4} />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Autocomplete panel rows: thumbnail + two lines. */
export function SearchSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonRegion label="Recherche en cours">
      <ul style={{ listStyle: "none", margin: 0, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px" }}>
            <Skeleton width={44} height={44} radius={10} />
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skeleton width="70%" height={12} radius={4} />
              <Skeleton width="34%" height={11} radius={4} />
            </span>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

/** Cart lines: image, title, quantity stepper, amount. */
export function CartSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonRegion label="Chargement du panier">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, border: "1px solid rgba(94,64,116,.12)", borderRadius: 18, overflow: "hidden" }}>
        {Array.from({ length: count }, (_, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 18,
              padding: "20px 22px",
              borderBottom: i === count - 1 ? "none" : "1px solid rgba(94,64,116,.1)",
            }}
          >
            <Skeleton width={92} height={100} radius={14} />
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width="62%" height={14} radius={4} />
              <Skeleton width="28%" height={11} radius={4} />
              <Skeleton width={104} height={34} radius={999} style={{ marginTop: "auto" }} />
            </span>
            <Skeleton width={78} height={18} radius={5} />
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

/** Dashboard order rows. */
export function OrderSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonRegion label="Chargement des commandes">
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "rgba(94,64,116,.08)", borderRadius: 12, overflow: "hidden" }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", padding: "16px 18px" }}>
            <Skeleton width={96} height={13} radius={4} />
            <Skeleton width="26%" height={13} radius={4} />
            <Skeleton width={70} height={13} radius={4} style={{ marginLeft: "auto" }} />
            <Skeleton width={84} height={22} radius={999} />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Notification centre rows: icon, title, message, timestamp. */
export function NotificationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonRegion label="Chargement des notifications">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(94,64,116,.08)" }}>
            <Skeleton width={30} height={30} radius={999} />
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              <Skeleton width="46%" height={12} radius={4} />
              <Skeleton width="80%" height={11} radius={4} />
              <Skeleton width={78} height={10} radius={4} />
            </span>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}
