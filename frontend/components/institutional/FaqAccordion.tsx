"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The accordion the FAQ needs, built like the one already on the product page.
 *
 * components/product/PurchasePanel.tsx renders "Description complète" and
 * "Livraison & retours" as a single-open accordion: a full-width button
 * carrying aria-expanded, hairline dividers in --pdh-plum-tint, one open
 * panel at a time. That is the shop's existing pattern, so it is the pattern
 * here — not the dashboard's Collapsible, which belongs to the admin's design
 * world, and not a new component with its own look.
 *
 * Answers arrive as rendered nodes rather than as raw Lexical: the rich text
 * is converted in the Server Component that owns the data, which keeps the
 * converter (and next/link) out of this client bundle.
 */
export function FaqAccordion({ items }: { items: { question: string; answer: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div style={{ borderTop: "1px solid var(--pdh-plum-tint)" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;

        return (
          <div key={item.question} style={{ borderBottom: "1px solid var(--pdh-plum-tint)" }}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                id={buttonId}
                aria-controls={panelId}
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  // 18px vertical keeps the tap target above 44px at this
                  // font size, which is what makes the list usable on a phone.
                  padding: "18px 2px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "start",
                  font: "inherit",
                  fontSize: 14.5,
                  lineHeight: 1.5,
                  color: "var(--pdh-ink)",
                }}
              >
                {item.question}
                <Plus
                  aria-hidden="true"
                  size={17}
                  strokeWidth={1.7}
                  style={{
                    flex: "none",
                    color: "var(--pdh-plum)",
                    transition: "transform .2s ease",
                    transform: isOpen ? "rotate(45deg)" : "none",
                  }}
                />
              </button>
            </h3>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                style={{ padding: "0 2px 20px", opacity: 0.82 }}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
