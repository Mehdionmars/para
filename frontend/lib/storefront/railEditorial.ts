/**
 * The editorial band that can sit above a product rail.
 *
 * It used to be an image field plus one paragraph written into the
 * component, which meant two rails with an image printed the same sentence
 * twice on the home page and neither could be reworded without a deploy.
 * The copy now travels with the rail.
 *
 * Every field is optional and falls back to the string the component used to
 * hard-code, so a rail saved before these fields existed renders exactly what
 * it rendered before.
 */

export type RailEditorial = {
  image: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

/** What the block said when the words lived in RailSection.tsx. */
export const RAIL_EDITORIAL_DEFAULTS = {
  eyebrow: "Expertise pharmaceutique",
  title: "Des conseils pensés pour votre peau",
  description:
    "Nos pharmaciens vous accompagnent pour choisir les soins adaptés à vos besoins : type de peau, sensibilité, saison et budget.",
  ctaLabel: "Découvrir nos conseils",
  ctaUrl: "/catalogue",
} as const;

export type ResolvedRailEditorial = {
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
};

/**
 * Fills the blanks. Blank-but-present is treated as "use the default" rather
 * than "print nothing", because an empty title in a CMS field is almost
 * always an editor who has not got to it yet — with one exception: an editor
 * who deliberately clears the description wants the paragraph gone, and
 * `hideDescription` lets the caller say so.
 */
export function resolveRailEditorial(editorial: RailEditorial): ResolvedRailEditorial {
  return {
    image: editorial.image,
    eyebrow: editorial.eyebrow?.trim() || RAIL_EDITORIAL_DEFAULTS.eyebrow,
    title: editorial.title?.trim() || RAIL_EDITORIAL_DEFAULTS.title,
    description: editorial.description?.trim() || RAIL_EDITORIAL_DEFAULTS.description,
    ctaLabel: editorial.ctaLabel?.trim() || RAIL_EDITORIAL_DEFAULTS.ctaLabel,
    ctaUrl: editorial.ctaUrl?.trim() || RAIL_EDITORIAL_DEFAULTS.ctaUrl,
  };
}
