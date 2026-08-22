"use client";

import {
  CheckboxField,
  ColorField,
  EditorHeading,
  FieldGroup,
  NumberField,
  SelectField,
} from "@/components/dashboard/storefront/FieldKit";
import type { NavLinkStylePassthrough } from "@/lib/dashboard/storefront-mapping";

/**
 * Per-link appearance and animation controls.
 *
 * The Payload admin has had these fields for a while, but the Storefront
 * Builder — the tool the team actually uses — exposed none of them, so
 * colouring or blinking a link was impossible from here. This renders the
 * same vocabulary for both a top-level nav item and a mega-menu column link,
 * writing into the `style` passthrough object so nothing is duplicated.
 *
 * Every control is optional: leaving a colour empty means "inherit the
 * theme", which is what keeps untouched links rendering exactly as before.
 */

const FONT_WEIGHTS = [
  { label: "Par défaut", value: "" },
  { label: "Léger (300)", value: "300" },
  { label: "Normal (400)", value: "400" },
  { label: "Moyen (500)", value: "500" },
  { label: "Semi-gras (600)", value: "600" },
  { label: "Gras (700)", value: "700" },
];

const ANIMATION_TYPES = [
  { label: "Clignotement discret", value: "blink" },
  { label: "Pulsation", value: "pulse" },
  { label: "Reflet (shimmer)", value: "shimmer" },
  { label: "Halo lumineux", value: "glow" },
];

/** The brief's three reference speeds, plus the free value the field already
 * supported. Seconds per cycle: lower is faster. */
const SPEEDS = [
  { label: "Lent (2,5 s)", value: "2.5" },
  { label: "Normal (1,5 s)", value: "1.5" },
  { label: "Rapide (0,8 s)", value: "0.8" },
];

type Appearance = Record<string, unknown>;
type Animation = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, fallback: number) => (typeof v === "number" ? v : fallback);

export function NavLinkStyleFields({
  value,
  onChange,
  compact = false,
}: {
  value: NavLinkStylePassthrough | undefined;
  onChange: (style: NavLinkStylePassthrough) => void;
  /** Mega-menu links sit inside an already-nested card; drop the heading. */
  compact?: boolean;
}) {
  const style = value ?? {};
  const appearance = (style.appearance ?? {}) as Appearance;
  const animation = (style.animation ?? {}) as Animation;

  const patchAppearance = (patch: Appearance) =>
    onChange({ ...style, appearance: { ...appearance, ...patch } });
  const patchAnimation = (patch: Animation) =>
    onChange({ ...style, animation: { ...animation, ...patch } });

  const animEnabled = animation.enabled === true;
  const currentSpeed = String(num(animation.duration, 1.5));

  return (
    <>
      {!compact && <EditorHeading title="Style" description="Laisser vide pour hériter des couleurs du thème." />}

      <FieldGroup>
        <ColorField
          label="Couleur du texte"
          value={str(appearance.color)}
          onChange={(color) => patchAppearance({ color })}
        />
        <ColorField
          label="Couleur au survol"
          value={str(appearance.hoverColor)}
          onChange={(hoverColor) => patchAppearance({ hoverColor })}
        />
      </FieldGroup>

      <FieldGroup>
        <SelectField
          label="Poids de police"
          value={str(appearance.fontWeight)}
          onChange={(fontWeight) => patchAppearance({ fontWeight })}
          options={FONT_WEIGHTS}
        />
        <NumberField
          label="Opacité (0 à 1)"
          value={num(appearance.opacity, 1)}
          onChange={(opacity) => patchAppearance({ opacity })}
          min={0}
          max={1}
        />
      </FieldGroup>

      <CheckboxField
        label="Animer ce lien"
        checked={animEnabled}
        onChange={(enabled) =>
          patchAnimation({
            enabled,
            // Seed a usable animation on first enable so the checkbox alone
            // produces a visible result instead of silently doing nothing.
            ...(enabled && !animation.type ? { duration: 1.5, iterationCount: "infinite", type: "blink" } : {}),
          })
        }
      />

      {animEnabled && (
        <FieldGroup>
          <SelectField
            label="Type d'animation"
            value={str(animation.type) || "blink"}
            onChange={(type) => patchAnimation({ type })}
            options={ANIMATION_TYPES}
          />
          <SelectField
            label="Vitesse"
            value={SPEEDS.some((s) => s.value === currentSpeed) ? currentSpeed : "1.5"}
            onChange={(duration) => patchAnimation({ duration: Number(duration) })}
            options={SPEEDS}
          />
        </FieldGroup>
      )}

      {animEnabled && (
        <p className="text-xs text-gray-500">
          L&apos;animation est automatiquement désactivée pour les visiteurs ayant demandé de réduire les
          animations.
        </p>
      )}
    </>
  );
}
