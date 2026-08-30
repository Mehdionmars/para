"use client";

import { Check, RotateCcw, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { judgeContrast } from "@/components/dashboard/appearance/contrast";

/**
 * One colour control: swatch, hex field, quick palette, reset, and — when the
 * caller says what this colour sits on — a contrast advisory.
 *
 * There is exactly one of these in the codebase. The top bar, the header, the
 * footer, the theme editor and the per-nav-item styling all render this
 * component, because three panels with three near-identical colour inputs is
 * how they drift: one grows a palette, another grows validation, and an
 * operator learns two different sets of manners for the same job.
 *
 * **Empty is a value here.** A blank field means "not configured", and that
 * is what keeps the storefront on its own colour — so the control has to make
 * blank reachable (the reset) and legible (the placeholder), not treat it as
 * an error state.
 */

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Enough to cover the house palette and the neutrals an operator reaches for
 * first. The picker stays, so this is a shortcut, never a restriction. */
export const QUICK_PALETTE: { label: string; value: string }[] = [
  { label: "Brun Para d'Hiver", value: "#373020" },
  { label: "Prune", value: "var(--pdh-plum)" },
  { label: "Violet", value: "#6D28D9" },
  { label: "Violet doux", value: "#8B5CF6" },
  { label: "Teal", value: "#008AA5" },
  { label: "Beige", value: "#F7EEE5" },
  { label: "Blanc", value: "#FFFFFF" },
  { label: "Noir", value: "#111111" },
  { label: "Gris", value: "#6B7280" },
];

export function ColorField({
  label,
  value,
  onChange,
  /** What this colour is painted on (or, for a background, painted with), as
   * a hex. Supplying it turns on the contrast advisory. */
  contrastAgainst,
  /** Shown greyed in the field when nothing is configured — the colour the
   * storefront will actually use. */
  inheritedHint,
  /** Hidden when the field cannot be cleared (the theme editor's colours are
   * always set). */
  allowReset = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  contrastAgainst?: string;
  inheritedHint?: string;
  allowReset?: boolean;
}) {
  const id = useId();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isEmpty = value.trim() === "";
  const valid = isEmpty || HEX_COLOR_RE.test(value);
  const effective = isEmpty ? inheritedHint || "" : value;
  const verdict = contrastAgainst && effective ? judgeContrast(effective, contrastAgainst) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-gray-600" htmlFor={id}>
          {label}
        </label>
        {allowReset && !isEmpty && (
          <button
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            onClick={() => onChange("")}
            title="Revenir à la couleur par défaut du storefront"
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-3 w-3" />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          aria-label={`${label} — sélecteur`}
          // The native picker cannot represent "unset", so when the field is
          // empty it shows what the storefront will actually render.
          className="h-8 w-10 flex-none cursor-pointer rounded border border-gray-200 bg-white p-0.5"
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          type="color"
          value={HEX_COLOR_RE.test(effective) ? effective : "#000000"}
        />
        <input
          className={`w-full rounded-lg border px-3 py-1.5 font-mono text-sm uppercase outline-none focus:border-violet-400 ${
            valid ? "border-gray-200" : "border-red-300"
          }`}
          id={id}
          onChange={(e) => onChange(e.target.value)}
          placeholder={inheritedHint ? `${inheritedHint} (par défaut)` : "var(--pdh-plum)"}
          value={value}
        />
        <button
          aria-expanded={paletteOpen}
          className="flex-none rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          onClick={() => setPaletteOpen((v) => !v)}
          type="button"
        >
          Palette
        </button>
      </div>

      {paletteOpen && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
          {QUICK_PALETTE.map((swatch) => (
            <button
              className="h-6 w-6 rounded border border-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              key={swatch.value}
              onClick={() => {
                onChange(swatch.value);
                setPaletteOpen(false);
              }}
              style={{ background: swatch.value }}
              title={`${swatch.label} — ${swatch.value}`}
              type="button"
            />
          ))}
        </div>
      )}

      {!valid && <span className="text-[11px] text-red-600">Couleur hexadécimale invalide, ex. #5E4074.</span>}

      {/* Advisory, never a block: an operator running a deliberately quiet
          band is making a choice, and a builder that refuses it is one they
          will work around. */}
      {valid && verdict && (
        <span
          className={`flex items-center gap-1 text-[11px] ${verdict.passesText ? "text-emerald-700" : verdict.passesLarge ? "text-amber-700" : "text-red-600"}`}
        >
          {verdict.passesText ? (
            <Check aria-hidden="true" className="h-3 w-3" />
          ) : (
            <TriangleAlert aria-hidden="true" className="h-3 w-3" />
          )}
          {verdict.label}
        </span>
      )}
    </div>
  );
}
