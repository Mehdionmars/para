"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * One row of cards that scrolls sideways. A finger swipes it on a phone; on a
 * wider screen the two arrows page it by a screenful. An arrow disappears at
 * its end of the row rather than staying greyed out.
 */
export function ShelfScroller({ children, label }: { children: ReactNode; label: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setEdges({
      start: row.scrollLeft <= 4,
      end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    measure();
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: dir * row.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="shelf-scroller">
      <div className="shelf-grid" onScroll={measure} ref={rowRef} role="list">
        {children}
      </div>
      {edges.start ? null : (
        <button aria-label={`${label} : précédent`} className="shelf-arrow shelf-arrow--prev" onClick={() => page(-1)} type="button">
          <span aria-hidden="true">←</span>
        </button>
      )}
      {edges.end ? null : (
        <button aria-label={`${label} : suivant`} className="shelf-arrow shelf-arrow--next" onClick={() => page(1)} type="button">
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
