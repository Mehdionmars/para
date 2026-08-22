"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/dashboard/cn";

/**
 * Click-triggered popover, used for the filters panel, the columns menu and
 * the per-row action menu.
 *
 * Anchored with plain CSS positioning rather than a floating-ui dependency —
 * every use here is a short menu hanging off a toolbar button, which
 * `absolute right-0` handles correctly at every breakpoint. On narrow
 * screens the panel is capped to the viewport so it can never push the page
 * into horizontal scroll.
 */
export function Popover({
  trigger,
  children,
  align = "end",
  className,
  panelClassName,
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" }) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        // Return focus to the trigger so keyboard users aren't dropped at the
        // top of the document.
        rootRef.current?.querySelector("button")?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger({
        "aria-expanded": open,
        "aria-haspopup": "menu",
        open,
        toggle: () => setOpen((v) => !v),
      })}

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute z-50 mt-2 max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

/** A row inside a Popover acting as a menu. */
export function MenuItem({
  children,
  onClick,
  destructive = false,
  disabled = false,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:pointer-events-none disabled:opacity-40",
        destructive ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-100",
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-gray-100" />;
}
