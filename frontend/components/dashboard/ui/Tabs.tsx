"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/dashboard/cn";

export type TabItem = {
  id: string;
  label: string;
  /** Shown as a pill after the label. Omit rather than passing 0 when the
   * count is not meaningful — an empty tab says that on its own panel. */
  count?: number;
  content: React.ReactNode;
};

/**
 * A tablist following the WAI-ARIA pattern, which is the whole reason this is
 * a component and not three buttons and a ternary.
 *
 * Two details carry that: the tabs share a single tab stop (only the selected
 * one is reachable by Tab, the arrows move between them), and each panel is
 * tied to its tab through aria-controls/aria-labelledby so a screen reader
 * announces "onglet 2 sur 3" rather than reading an unlabelled region.
 *
 * Panels are mounted only while selected. The lists this holds are already
 * rendered on the server and handed over as props, so nothing is refetched by
 * switching — but keeping three DOM trees alive to show one is still waste.
 */
export function Tabs({ tabs, className }: { tabs: TabItem[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const baseId = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    const index = tabs.findIndex((t) => t.id === active);

    let next: number | null = null;
    if (e.key in keys) next = (index + keys[e.key] + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    const id = tabs[next].id;
    setActive(id);
    // Selection follows focus, so the panel the arrow key lands on is the one
    // announced — the alternative needs a second key press to activate and is
    // routinely mistaken for a broken tablist.
    refs.current[id]?.focus();
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label="Vues" className="flex flex-wrap gap-1 border-b border-gray-100 px-2">
        {tabs.map((t) => {
          const selected = t.id === current.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={tabId(t.id)}
              aria-controls={panelId(t.id)}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={onKeyDown}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                selected
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-900",
              )}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    selected ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div id={panelId(current.id)} role="tabpanel" aria-labelledby={tabId(current.id)} tabIndex={0} className="focus-visible:outline-none">
        {current.content}
      </div>
    </div>
  );
}
