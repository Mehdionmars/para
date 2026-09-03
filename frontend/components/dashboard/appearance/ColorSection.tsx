"use client";

import { RotateCcw } from "lucide-react";
import { ColorField } from "@/components/dashboard/appearance/ColorField";
import {
  CHROME_FIELD_LABELS,
  type ChromeColorsDraft,
  emptyChromeColors,
} from "@/lib/dashboard/storefront-mapping";

/**
 * The "Apparence" block of a chrome editor: the colours for one surface, the
 * top bar's opacity when it has one, and a reset for the whole surface.
 *
 * One component for all three surfaces, driven by the field list each one
 * declares in `CHROME_SURFACE_FIELDS`. The alternative — a hand-written panel
 * per surface — is how the top bar ends up with a palette the footer doesn't
 * have, and how "Réinitialiser" comes to mean two different things.
 */

/** What the storefront renders when a field is left blank, so the control can
 * show the operator the colour they are actually overriding rather than an
 * empty box. These mirror the fallbacks in the components themselves. */
export type InheritedColors = Partial<Record<keyof ChromeColorsDraft, string>>;

export function ColorSection({
  title,
  description,
  fields,
  value,
  onChange,
  inherited = {},
  showOpacity = false,
}: {
  title: string;
  description?: string;
  fields: readonly (keyof ChromeColorsDraft)[];
  value: ChromeColorsDraft;
  onChange: (v: ChromeColorsDraft) => void;
  inherited?: InheritedColors;
  showOpacity?: boolean;
}) {
  const update = (patch: Partial<ChromeColorsDraft>) => onChange({ ...value, ...patch });

  // The background is what every other colour on this surface sits on, so it
  // is the one the contrast advisory measures against.
  const background = value.backgroundColor.trim() || inherited.backgroundColor || "";

  const configured =
    fields.some((f) => typeof value[f] === "string" && (value[f] as string).trim() !== "") ||
    value.opacity !== null;

  return (
    <div className="@container">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {configured && (
          <button
            className="flex flex-none items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            onClick={() => onChange(emptyChromeColors())}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-3 w-3" />
            Tout réinitialiser
          </button>
        )}
      </div>

      {/* One column on a phone, two from the small breakpoint up — the fields
          are short and pairing them halves the scroll on a laptop. */}
      {/* Container query, not `sm:`. A colour field needs a swatch, a hex
          input and a "Palette" button on one line; pairing them up is only
          possible when this section is wide enough, which has nothing to do
          with the window. Under `sm:` the pair fired at 640px of *window* and
          split a 288px panel into two 134px columns, wrapping every label to
          three lines. */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 @md:grid-cols-2">
        {fields.map((field) => (
          <ColorField
            // The background has nothing behind it to be measured against.
            contrastAgainst={field === "backgroundColor" ? undefined : background || undefined}
            inheritedHint={inherited[field]}
            key={field}
            label={CHROME_FIELD_LABELS[field]}
            onChange={(v) => update({ [field]: v } as Partial<ChromeColorsDraft>)}
            value={(value[field] as string) ?? ""}
          />
        ))}
      </div>

      {showOpacity && (
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-gray-600" htmlFor="chrome-opacity">
              Opacité
            </label>
            <span className="text-[11px] text-gray-500">
              {value.opacity === null ? "100 % (par défaut)" : `${value.opacity} %`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="h-2 w-full cursor-pointer accent-violet-600"
              id="chrome-opacity"
              max={100}
              min={0}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              step={1}
              type="range"
              value={value.opacity ?? 100}
            />
            {value.opacity !== null && (
              <button
                className="flex flex-none items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={() => update({ opacity: null })}
                title="Revenir à l'opacité par défaut"
                type="button"
              >
                <RotateCcw aria-hidden="true" className="h-3 w-3" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
