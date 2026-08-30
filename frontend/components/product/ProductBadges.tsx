import { MAX_BADGES, resolveProductBadges, type RawBadge, type ResolvedBadge } from "@/lib/productBadges";

/**
 * The stack of marketing pills over a product image.
 *
 * Accepts either the raw CMS rows (`badges` + pricing, so the automatic
 * discount pill is computed here) or an already-resolved list — the synced
 * data/products.ts snapshot stores resolved badges, and re-resolving those
 * would double-apply the presets.
 */
type Props = {
  badges: RawBadge[] | ResolvedBadge[] | null | undefined;
  price?: number;
  oldPrice?: number | null;
  /** Cards cap at 3; mobile hides the third via CSS (see globals.css). */
  limit?: number;
  /** Slightly tighter pills on the smaller card variants. */
  compact?: boolean;
};

function isResolved(b: RawBadge | ResolvedBadge): b is ResolvedBadge {
  return typeof (b as ResolvedBadge).text === "string" && "priority" in b;
}

export function ProductBadges({ badges, price, oldPrice, limit = MAX_BADGES, compact = false }: Props) {
  const list = (badges || []) as (RawBadge | ResolvedBadge)[];

  // An already-resolved list (the synced data/products.ts snapshot) has
  // been through resolveProductBadges upstream and ALREADY contains the
  // discount pill. Re-running the merge here would add a second one and
  // push a real badge out of the 3-slot cap — so it's only sorted and
  // trimmed. Raw CMS rows, by contrast, still need the full resolution.
  const alreadyResolved = list.length > 0 && list.every(isResolved);

  const resolved = alreadyResolved
    ? [...(list as ResolvedBadge[])]
        .map((b, i) => ({ b, i }))
        .sort((x, y) => x.b.priority - y.b.priority || x.i - y.i)
        .map(({ b }) => b)
        .slice(0, limit)
    : resolveProductBadges(list as RawBadge[], price ?? 0, oldPrice, limit);

  if (resolved.length === 0) return null;

  return (
    <div
      className="product-badges"
      style={{
        position: "absolute",
        top: compact ? 10 : 12,
        insetInlineStart: compact ? 10 : 12,
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--pdh-badge-gap)",
        // Never let a long label run under the favourite button.
        maxWidth: "calc(100% - 52px)",
      }}
    >
      {resolved.map((badge, i) => (
        <span
          key={`${badge.text}-${i}`}
          style={{
            background: badge.bgColor || "var(--pdh-badge-bg)",
            color: badge.textColor || "var(--pdh-badge-text)",
            // Full theme size on every card. The half-pixel shrink the compact
            // cards used to apply only made the promo pill quieter exactly where
            // it has the most work to do.
            fontSize: "var(--pdh-badge-font-size)",
            fontWeight: "var(--pdh-badge-weight)",
            letterSpacing: "var(--pdh-badge-tracking)",
            padding: "var(--pdh-badge-padding-y) var(--pdh-badge-padding-x)",
            // A real pill, per the design spec.
            borderRadius: 9999,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {badge.text}
        </span>
      ))}
    </div>
  );
}
