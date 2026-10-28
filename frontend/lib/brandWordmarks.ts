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
export const BRAND_LOGO_FILES: Record<string, string> = {
  "a-derma": "/assets/brands/a-derma.png",
  "accu-chek": "/assets/brands/accu-chek.svg",
  algologie: "/assets/brands/algologie.png",
  arkopharma: "/assets/brands/arkopharma.svg",
  aveda: "/assets/brands/aveda.svg",
  avene: "/assets/brands/avene.png",
  "axis-y": "/assets/brands/axis-y.png",
  "beauty-of-joseon": "/assets/brands/beauty-of-joseon.png",
  "bio-oil": "/assets/brands/bio-oil.svg",
  bioderma: "/assets/brands/bioderma.svg",
  biolane: "/assets/brands/biolane.png",
  bionike: "/assets/brands/bionike.svg",
  carmex: "/assets/brands/carmex.png",
  cattier: "/assets/brands/cattier.png",
  centifolia: "/assets/brands/centifolia.png",
  cerave: "/assets/brands/cerave.svg",
  cetaphil: "/assets/brands/cetaphil.svg",
  cicabiafine: "/assets/brands/cicabiafine.png",
  curaprox: "/assets/brands/curaprox.svg",
  curasept: "/assets/brands/curasept.webp",
  "d-biotic": "/assets/brands/d-biotic.svg",
  dermedic: "/assets/brands/dermedic.png",
  ducray: "/assets/brands/ducray.png",
  elancyl: "/assets/brands/elancyl.png",
  elmex: "/assets/brands/elmex.svg",
  embryolisse: "/assets/brands/embryolisse.png",
  erayba: "/assets/brands/erayba.jpg",
  erborian: "/assets/brands/erborian.svg",
  "eric-favre": "/assets/brands/eric-favre.svg",
  etiaxil: "/assets/brands/etiaxil.webp",
  eucerin: "/assets/brands/eucerin.svg",
  filorga: "/assets/brands/filorga.svg",
  "forte-pharma": "/assets/brands/forte-pharma.png",
  galderma: "/assets/brands/galderma.svg",
  gum: "/assets/brands/gum.svg",
  hairburst: "/assets/brands/hairburst.svg",
  hartmann: "/assets/brands/hartmann.svg",
  heliabrine: "/assets/brands/heliabrine.png",
  heliocare: "/assets/brands/heliocare.svg",
  herbatint: "/assets/brands/herbatint.svg",
  innoxa: "/assets/brands/innoxa.jpg",
  isdin: "/assets/brands/isdin.png",
  "isis-pharma": "/assets/brands/isis-pharma.svg",
  juvamine: "/assets/brands/juvamine.png",
  klorane: "/assets/brands/klorane.png",
  "la-roche-posay": "/assets/brands/la-roche-posay.svg",
  lansinoh: "/assets/brands/lansinoh.png",
  "lea-nature": "/assets/brands/lea-nature.svg",
  lierac: "/assets/brands/lierac.svg",
  listerine: "/assets/brands/listerine.svg",
  luxeol: "/assets/brands/luxeol.svg",
  martiderm: "/assets/brands/martiderm.png",
  mavala: "/assets/brands/mavala.svg",
  medela: "/assets/brands/medela.svg",
  mesoestetic: "/assets/brands/mesoestetic.svg",
  mustela: "/assets/brands/mustela.png",
  neostrata: "/assets/brands/neostrata.svg",
  neutrogena: "/assets/brands/neutrogena.svg",
  noreva: "/assets/brands/noreva.svg",
  nuhanciam: "/assets/brands/nuhanciam.svg",
  nuxe: "/assets/brands/nuxe.svg",
  omron: "/assets/brands/omron.svg",
  "oral-b": "/assets/brands/oral-b.svg",
  "palmer-s": "/assets/brands/palmer-s.svg",
  parodontax: "/assets/brands/parodontax.svg",
  patyka: "/assets/brands/patyka.svg",
  philips: "/assets/brands/philips.svg",
  "phyt-s": "/assets/brands/phyt-s.svg",
  phyto: "/assets/brands/phyto.svg",
  placentor: "/assets/brands/placentor.png",
  polaar: "/assets/brands/polaar.png",
  puressentiel: "/assets/brands/puressentiel.svg",
  quies: "/assets/brands/quies.svg",
  rilastil: "/assets/brands/rilastil.svg",
  saforelle: "/assets/brands/saforelle.svg",
  sanogyl: "/assets/brands/sanogyl.png",
  santarome: "/assets/brands/santarome.svg",
  sensilis: "/assets/brands/sensilis.png",
  sesderma: "/assets/brands/sesderma.svg",
  "skin-chemists": "/assets/brands/skin-chemists.png",
  "some-by-mi": "/assets/brands/some-by-mi.png",
  sterimar: "/assets/brands/sterimar.png",
  superdiet: "/assets/brands/superdiet.png",
  svr: "/assets/brands/svr.png",
  "tommee-tippee": "/assets/brands/tommee-tippee.svg",
  urgo: "/assets/brands/urgo.svg",
  uriage: "/assets/brands/uriage.svg",
  vichy: "/assets/brands/vichy.svg",
  vitabiotics: "/assets/brands/vitabiotics.png",
  waterwipes: "/assets/brands/waterwipes.png",
  weleda: "/assets/brands/weleda.svg",
  "yogi-tea": "/assets/brands/yogi-tea.svg",
};

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
