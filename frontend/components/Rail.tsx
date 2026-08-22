"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export type RailHandle = {
  scrollPrev: () => void;
  scrollNext: () => void;
  /** Scroll to a 0..1 position along the scrollable width. Used for dot pagination. */
  scrollToRatio: (ratio: number) => void;
};

/**
 * How many cards fill the row, per breakpoint.
 *
 * Rails that sit beside an editorial image are physically narrower than a
 * full-width one, so they need a lower count to keep cards legible. Passed
 * as CSS custom properties rather than pixel widths — the actual card width
 * is still derived from the rail's measured width in globals.css.
 */
export type RailCols = { sm?: number; md?: number; lg?: number; xl?: number };

/** Horizontally scrollable row of cards. Pair with a ref + RailHandle to drive prev/next buttons. */
export const Rail = forwardRef<
  RailHandle,
  {
    children: React.ReactNode;
    ariaLabel: string;
    onScroll?: (el: HTMLDivElement) => void;
    className?: string;
    cols?: RailCols;
  }
>(function Rail({ children, ariaLabel, onScroll, className, cols }, ref) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    // Scrolls by whatever is actually on screen rather than a fixed 508px,
    // which overshot on a phone and undershot on a wide desktop. One "page"
    // minus a card keeps the last card visible as an anchor.
    scrollPrev: () => scrollerRef.current?.scrollBy({ left: -pageSize(scrollerRef.current), behavior: "smooth" }),
    scrollNext: () => scrollerRef.current?.scrollBy({ left: pageSize(scrollerRef.current), behavior: "smooth" }),
    scrollToRatio: (ratio: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: (el.scrollWidth - el.clientWidth) * ratio, behavior: "smooth" });
    },
  }));

  return (
    <div
      ref={scrollerRef}
      className={className ? `rail ${className}` : "rail"}
      role="list"
      aria-label={ariaLabel}
      onScroll={onScroll ? (e) => onScroll(e.currentTarget) : undefined}
      style={
        {
          display: "flex",
          // gap, card width and snapping all come from the .rail rules in
          // globals.css so every rail on the site stays in step.
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          paddingBottom: 4,
          ...(cols?.sm !== undefined ? { "--rail-cols-sm": cols.sm } : {}),
          ...(cols?.md !== undefined ? { "--rail-cols-md": cols.md } : {}),
          ...(cols?.lg !== undefined ? { "--rail-cols-lg": cols.lg } : {}),
          ...(cols?.xl !== undefined ? { "--rail-cols-xl": cols.xl } : {}),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
});

/** One screenful of cards, minus a card's worth of overlap so the visitor
 * keeps a visual anchor between pages. */
function pageSize(el: HTMLDivElement | null): number {
  if (!el) return 0;
  const firstCard = el.firstElementChild?.getBoundingClientRect().width ?? 0;
  return Math.max(el.clientWidth - firstCard, el.clientWidth * 0.6);
}
