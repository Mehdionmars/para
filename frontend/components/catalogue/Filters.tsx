"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/data/products";
import type { CatalogueFacets } from "@/lib/storefront/catalogue";

type Props = {
  facets: CatalogueFacets;
  activeCategories: Set<Category>;
  onToggleCategory: (category: Category) => void;
  activeBrand: string;
  onSelectBrand: (brand: string) => void;
  maxPrice: number;
  onMaxPriceChange: (value: number) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: () => void;
  needs: string[];
  activeTag: string;
  onSelectNeed: (label: string) => void;
};

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--pdh-plum-tint)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 2px",
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--pdh-ink)",
          cursor: "pointer",
        }}
      >
        {title}
        <ChevronDown aria-hidden="true" size={15} style={{ color: "var(--pdh-plum)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && <div style={{ padding: "0 2px 18px" }}>{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onClick, label, count }: { checked: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 12.5, color: checked ? "var(--pdh-plum)" : "var(--pdh-ink)" }}>
      <input type="checkbox" checked={checked} onChange={onClick} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1.5px solid ${checked ? "var(--pdh-plum)" : "var(--pdh-plum-divider)"}`,
          background: checked ? "var(--pdh-plum)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6.5L4.7 9L10 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && <span style={{ opacity: 0.45, fontSize: 11.5 }}>{count}</span>}
    </label>
  );
}

export function Filters({
  facets,
  activeCategories,
  onToggleCategory,
  activeBrand,
  onSelectBrand,
  maxPrice,
  onMaxPriceChange,
  inStockOnly,
  onToggleInStockOnly,
  needs,
  activeTag,
  onSelectNeed,
}: Props) {
  return (
    <aside style={{ flex: "0 1 240px", minWidth: 210, position: "sticky", top: 150 }}>
      <div style={{ fontSize: 13, fontWeight: 600, padding: "0 2px 14px", borderBottom: "1px solid var(--pdh-plum-tint)" }}>Filtrer</div>

      <AccordionSection title="Catégories" defaultOpen>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            // Hold the space this list is about to need, and only while it is
            // empty.
            //
            // Facets arrive from a client fetch. This section is the first one
            // and open by default, so for the ~360ms before they land it was a
            // header with nothing under it, and when the rows appeared they
            // pushed the four sections below — Marques, Prix, Disponibilité,
            // Besoins, 50px of header each — down the column. That single
            // reflow measured CLS 0.053 on every /shop/* and /marques/* page,
            // the worst on the site, and a MutationObserver put it at 367ms:
            // "Catégories" going from empty to filled.
            //
            // 241px, and this one is measured rather than derived: the loaded
            // body settles at 240.75px on /shop/visage, /shop/cheveux and
            // /marques/dcp alike — nine rows of 18.75px with eight 9px gaps.
            // The list is always the nine broad categories, including the ones
            // at count 0, so one number serves every page that shifts.
            //
            // Two earlier guesses bracketed it and both moved the column: 215
            // (seven rows, from a screen probe that had only seen part of the
            // sidebar) left 0.0052, and 279 (nine rows at an assumed 23px, a
            // figure taken from a collapsing section *header*, not a row)
            // overshot and pushed CLS up to 0.0076. Over-reserving shifts
            // exactly as much as under-reserving, in the other direction.
            //
            // /catalogue does not shift at all and is not the case being sized
            // for. The reservation is conditional on the list being empty, so
            // nothing holds blank space once the facets land.
            minHeight: facets.categories.length === 0 ? 241 : undefined,
          }}
        >
          {facets.categories.map(({ value, count }) => (
            <CheckRow key={value} checked={activeCategories.has(value)} onClick={() => onToggleCategory(value)} label={value} count={count} />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Marques">
        <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 220, overflowY: "auto" }}>
          {facets.brands.map(({ name, count }) => (
            <CheckRow key={name} checked={activeBrand === name} onClick={() => onSelectBrand(name)} label={name} count={count} />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Prix">
        <label htmlFor="price-range" style={{ display: "block", fontSize: 12.5, marginBottom: 10 }}>
          Prix max · <strong>{maxPrice} MAD</strong>
        </label>
        <input
          id="price-range"
          type="range"
          min={49}
          max={399}
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--pdh-plum)" }}
        />
      </AccordionSection>

      <AccordionSection title="Disponibilité">
        <CheckRow checked={inStockOnly} onClick={onToggleInStockOnly} label="En stock uniquement" count={facets.inStockCount} />
      </AccordionSection>

      {needs.length > 0 && (
        <AccordionSection title="Besoins">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {needs.map((label) => {
              const active = activeTag === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectNeed(label)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: active ? "var(--pdh-plum)" : "transparent",
                    color: active ? "var(--pdh-cream)" : "var(--pdh-ink)",
                    border: `1px solid ${active ? "var(--pdh-plum)" : "var(--pdh-plum-border)"}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </AccordionSection>
      )}
    </aside>
  );
}
