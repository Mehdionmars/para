/**
 * The two layout choices an overlay card exposes.
 *
 * Both exist for the same reason: a campaign photograph is not a neutral
 * backdrop. It has a face, a product or a logo somewhere in it, and where
 * that subject sits changes which corner the button may occupy and which
 * part of the frame must survive the crop. Baking one answer into the CSS
 * meant every campaign after the first one fought it.
 *
 * Both are optional everywhere and both default to what the storefront
 * already rendered, so content authored before they existed is unaffected.
 */

export const CARD_CTA_ALIGNS = ["left", "center", "right"] as const;
export type CardCtaAlign = (typeof CARD_CTA_ALIGNS)[number];

export const CARD_CTA_ALIGN_LABELS: Record<CardCtaAlign, string> = {
  left: "À gauche",
  center: "Au centre",
  right: "À droite",
};

/**
 * Which part of the photograph is kept when the card's box is a different
 * shape than the file — i.e. `object-position` for an `object-fit: cover`
 * image. "center" is the browser default and the previous behaviour.
 */
export const CARD_IMAGE_FRAMINGS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export type CardImageFraming = (typeof CARD_IMAGE_FRAMINGS)[number];

export const CARD_IMAGE_FRAMING_LABELS: Record<CardImageFraming, string> = {
  center: "Centré",
  top: "Haut",
  bottom: "Bas",
  left: "Gauche",
  right: "Droite",
  "top-left": "Haut gauche",
  "top-right": "Haut droite",
  "bottom-left": "Bas gauche",
  "bottom-right": "Bas droite",
};

const OBJECT_POSITIONS: Record<CardImageFraming, string> = {
  center: "center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
  "top-left": "left top",
  "top-right": "right top",
  "bottom-left": "left bottom",
  "bottom-right": "right bottom",
};

/** `object-position` for a framing choice; "center" for anything unset or
 *  unrecognised, which is what the browser would have done anyway. */
export function framingToObjectPosition(framing?: string | null): string {
  if (!framing) return "center";
  return OBJECT_POSITIONS[framing as CardImageFraming] ?? "center";
}

/** Narrows a stored string to a valid alignment, defaulting to the
 *  left-aligned layout every one of these cards shipped with. */
export function toCtaAlign(value?: string | null): CardCtaAlign {
  return (CARD_CTA_ALIGNS as readonly string[]).includes(value ?? "") ? (value as CardCtaAlign) : "left";
}

export function toImageFraming(value?: string | null): CardImageFraming {
  return (CARD_IMAGE_FRAMINGS as readonly string[]).includes(value ?? "") ? (value as CardImageFraming) : "center";
}

/** The optional layout fields every overlay card accepts. */
export type CardLayoutOptions = {
  ctaAlign?: CardCtaAlign | string;
  imageFraming?: CardImageFraming | string;
};

/** Ready-made option lists for the Storefront Builder's SelectField. */
export const CARD_CTA_ALIGN_OPTIONS = CARD_CTA_ALIGNS.map((value) => ({
  label: CARD_CTA_ALIGN_LABELS[value],
  value,
}));

export const CARD_IMAGE_FRAMING_OPTIONS = CARD_IMAGE_FRAMINGS.map((value) => ({
  label: CARD_IMAGE_FRAMING_LABELS[value],
  value,
}));
