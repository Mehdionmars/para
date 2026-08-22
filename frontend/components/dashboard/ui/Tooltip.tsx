"use client";

import { useId, useState } from "react";

/**
 * Hover/focus label for icon-only controls.
 *
 * The tooltip is supplementary, never the only label: every trigger it wraps
 * still carries its own aria-label, so screen readers and touch users — who
 * get no hover — lose nothing. Shown on focus as well as hover, so it is
 * reachable by keyboard.
 */
export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined} className="inline-flex">
        {children}
      </span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-[120] -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-md ${
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
