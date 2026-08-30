/**
 * How a brand is signed on this storefront.
 *
 * Three sources, in order of truth:
 *
 *   1. `logo` on the CMS Brand — the real, uploaded mark. Always wins.
 *   2. `public/assets/brands/<slug>.svg` — a real mark committed to the repo
 *      for brands that are not managed in the CMS yet. Registered below.
 *   3. The wordmark specs in this file — the brand's name typeset with its
 *      own character (case, weight, tracking, face) rather than reduced to
 *      two letters in a circle.
 *
 * The two-letter monogram that used to be the only fallback is now the last
 * resort, reached only when a brand name has no usable letters at all. A grid
 * of "AR / AV / BI / CE" told a visitor nothing: it named no brand, carried no
 * recognition, and made twenty-seven different laboratories look like the same
 * placeholder. A wordmark at least says the name in the brand's own voice.
 */

export type WordmarkSpec = {
  /** Which of the three loaded faces carries this brand's character. */
  /** Alta carries the geometric wordmarks; Poppins the rest, including
   *  the four that were set in Raleway before it left the system. */
  family: "alta" | "poppins";
  weight: 200 | 300 | 400 | 500 | 600 | 700;
  /** Letter-spacing in em. Couture brands run wide, retail brands run tight. */
  tracking: number;
  /** How the name is cased on the brand's own packaging. */
  transform: "uppercase" | "lowercase" | "none";
  /** Overrides the auto-fitted size when a name needs a specific optical size. */
  size?: number;
};

const DEFAULT_SPEC: WordmarkSpec = { family: "alta", weight: 300, tracking: 0.18, transform: "uppercase" };

/**
 * Keyed by brand slug. Each entry is a reading of how that laboratory
 * actually signs itself — dermatological brands set tight and confident,
 * spa and phyto brands set light and wide, oral-care brands set lowercase.
 * None of these reproduce a trademarked letterform; they position the name
 * in the right typographic register until the real mark is uploaded.
 */
export const BRAND_WORDMARKS: Record<string, WordmarkSpec> = {
  arkopharma: { family: "poppins", weight: 600, tracking: 0.02, transform: "uppercase" },
  avene: { family: "alta", weight: 300, tracking: 0.22, transform: "uppercase" },
  bioderma: { family: "poppins", weight: 700, tracking: -0.01, transform: "uppercase" },
  cerave: { family: "poppins", weight: 600, tracking: -0.015, transform: "none" },
  "d-biotic": { family: "alta", weight: 400, tracking: 0.12, transform: "uppercase" },
  dcp: { family: "poppins", weight: 700, tracking: 0.06, transform: "uppercase" },
  ducray: { family: "alta", weight: 300, tracking: 0.26, transform: "uppercase" },
  ecrinal: { family: "poppins", weight: 500, tracking: 0.2, transform: "uppercase" },
  elmex: { family: "poppins", weight: 700, tracking: -0.02, transform: "lowercase" },
  heliabrine: { family: "poppins", weight: 300, tracking: 0.24, transform: "uppercase" },
  htceutic: { family: "alta", weight: 400, tracking: 0.1, transform: "uppercase" },
  inava: { family: "poppins", weight: 600, tracking: 0.02, transform: "lowercase" },
  isdin: { family: "poppins", weight: 700, tracking: 0.01, transform: "uppercase" },
  klorane: { family: "alta", weight: 300, tracking: 0.3, transform: "uppercase" },
  "la-roche-posay": { family: "poppins", weight: 500, tracking: 0.02, transform: "uppercase" },
  lcp: { family: "poppins", weight: 700, tracking: 0.06, transform: "uppercase" },
  lierac: { family: "alta", weight: 200, tracking: 0.34, transform: "uppercase" },
  mustela: { family: "poppins", weight: 600, tracking: 0.01, transform: "lowercase" },
  nuxe: { family: "alta", weight: 300, tracking: 0.3, transform: "uppercase" },
  parodontax: { family: "poppins", weight: 600, tracking: -0.01, transform: "lowercase" },
  phyto: { family: "alta", weight: 400, tracking: 0.28, transform: "uppercase" },
  saforelle: { family: "poppins", weight: 500, tracking: 0.04, transform: "none" },
  solgar: { family: "poppins", weight: 600, tracking: 0.1, transform: "uppercase" },
  svr: { family: "poppins", weight: 700, tracking: 0.04, transform: "uppercase" },
  uriage: { family: "alta", weight: 300, tracking: 0.26, transform: "uppercase" },
  "vita-citral": { family: "poppins", weight: 400, tracking: 0.16, transform: "uppercase" },
  vichy: { family: "poppins", weight: 600, tracking: 0.14, transform: "uppercase" },
};

/**
 * Real marks committed to the repo, for brands whose CMS record has no upload
 * yet. Drop the file in `public/assets/brands/` and add one line here — the
 * storefront picks it up everywhere a brand is signed, with no other change.
 * See public/assets/brands/README.md.
 */
export const BRAND_LOGO_FILES: Record<string, string> = {};

export function wordmarkSpec(slug: string | null | undefined): WordmarkSpec {
  return (slug && BRAND_WORDMARKS[slug]) || DEFAULT_SPEC;
}

/**
 * How wide this name runs, in em, at a font-size of 1.
 *
 * A fixed font-size cannot serve both "SVR" and "LA ROCHE-POSAY": one floats
 * in the plate, the other runs off it. The measure is handed to CSS, which
 * divides the tile's own width by it — so every mark in the grid lands at the
 * same optical width instead of the same nominal point size, and follows the
 * tile as it narrows on a phone. That is what makes a row of them read as
 * one set.
 */
export function wordmarkMeasure(name: string, spec: WordmarkSpec): number {
  // Mean advance width per glyph, in em: capitals are appreciably wider than
  // lower case in all three faces. Tracking adds one full unit per glyph.
  const advance = spec.transform === "uppercase" ? 0.72 : 0.56;
  return Math.max(1, Math.round(Math.max(1, name.length) * (advance + spec.tracking) * 100) / 100);
}
