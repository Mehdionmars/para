import type { CSSProperties } from "react";

/**
 * The one primitive every skeleton is built from.
 *
 * A skeleton's job is to hold the exact space the real content will occupy,
 * so nothing shifts when data lands — a shimmering block of the wrong height
 * trades a blank screen for a layout jump, which is worse. Every composite
 * skeleton below therefore mirrors the real component's box, not a generic
 * grey card.
 *
 * The shimmer is a CSS background animation (see globals.css) — no JS, and
 * it stops entirely under prefers-reduced-motion.
 */
export function Skeleton({
  width,
  height,
  radius = 8,
  className = "",
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pdh-skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/**
 * Wraps a skeleton screen so assistive tech announces "loading" once,
 * instead of reading dozens of empty decorative blocks.
 */
export function SkeletonRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
    </div>
  );
}
