"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A horizontal, swipeable row with previous/next buttons. Touch and trackpad
 * users scroll it directly; the buttons are for a mouse, which has no
 * sideways scroll, and they disable themselves at either end.
 */
export function ServiceRail({
  children,
  className,
  controlsClassName,
  buttonClassName,
}: {
  children: ReactNode;
  className?: string;
  controlsClassName?: string;
  buttonClassName?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      <ul ref={ref} className={className} onScroll={measure}>
        {children}
      </ul>
      {/* Nothing to page through when every card already fits. */}
      {!(edges.start && edges.end) && (
        <div className={controlsClassName}>
          <button type="button" className={buttonClassName} onClick={() => page(-1)} disabled={edges.start} aria-label="Services précédents">
            <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.6} />
          </button>
          <button type="button" className={buttonClassName} onClick={() => page(1)} disabled={edges.end} aria-label="Services suivants">
            <ChevronRight aria-hidden="true" size={20} strokeWidth={1.6} />
          </button>
        </div>
      )}
    </>
  );
}
