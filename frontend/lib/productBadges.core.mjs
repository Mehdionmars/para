/**
 * Product badge presets and resolution — the single source of truth.
 *
 * Plain ESM on purpose. `scripts/sync-cms.mjs` runs under bare Node, outside
 * the Next build, so it cannot import a `.ts` module; before this file existed
 * it carried its own copy of the presets table and the resolution rules, and
 * `lib/storefront/products.ts` carried a third copy of the auto-badge rule.
 * Keeping the logic here lets all three read the same code:
 *
 *   lib/productBadges.ts       -> typed re-export for app/component code
 *   lib/storefront/products.ts -> live Payload path
 *   scripts/sync-cms.mjs       -> snapshot generator
 *
 * The backend's own table (backend/src/collections/Products.ts) is a separate
 * deploy target and still has to be edited by hand — tests/unit/productBadges.spec.ts
 * fails if the two tables drift, so that copy is at least enforced, not silent.
 */

/** @typedef {{ label: string, bgColor: string, textColor: string, priority: number }} BadgePreset */
/** @typedef {{ text: string, bgColor: string, textColor: string, priority: number }} ResolvedBadge */
/** @typedef {{ enabled?: boolean|null, type?: string|null, text?: string|null, bgColor?: string|null, textColor?: string|null, priority?: number|null }} RawBadge */

/**
 * Priority 1 belongs to the automatic discount badge — a real markdown
 * always outranks a manually configured pill.
 * @type {Record<string, BadgePreset>}
 */
export const BADGE_TYPE_PRESETS = {
  nouveau: { label: "Nouveauté", bgColor: "#6D28D9", textColor: "#FFFFFF", priority: 2 },
  bestseller: { label: "Best-seller", bgColor: "#111827", textColor: "#FFFFFF", priority: 3 },
  // #00758A, not the brand teal #008AA5: white on the brighter teal measures
  // 4.06:1 at the 10.5px these pills are set in, under the 4.5 AA floor.
  // This is the same hue carried down, and the value behind --pdh-teal-text.
  exclusivite: { label: "Exclu web", bgColor: "#00758A", textColor: "#FFFFFF", priority: 4 },
  routine: { label: "Routine", bgColor: "#F7EEE5", textColor: "#373020", priority: 5 },
  coupdecoeur: { label: "Coup de cœur", bgColor: "#F7EEE5", textColor: "#6D28D9", priority: 6 },
  offrespeciale: { label: "Offre spéciale", bgColor: "#6D28D9", textColor: "#FFFFFF", priority: 7 },
  solde: { label: "Solde", bgColor: "#DC2626", textColor: "#FFFFFF", priority: 7 },
  promo: { label: "Promo", bgColor: "#DC2626", textColor: "#FFFFFF", priority: 7 },
  top: { label: "Top", bgColor: "#111827", textColor: "#FFFFFF", priority: 8 },
  editionlimitee: { label: "Édition limitée", bgColor: "#373020", textColor: "#FFFFFF", priority: 8 },
  custom: { label: "", bgColor: "#5E4074", textColor: "#FFFFFF", priority: 8 },
};

/** Cards cap at 3 pills; mobile hides the third via CSS (see globals.css). */
export const MAX_BADGES = 3;

/** How long after `createdAt` a product still counts as "Nouveau". */
export const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Percentage off, or null when there is no genuine markdown.
 *
 * Guards `oldPrice <= price` as well as null: a "discount" that isn't one
 * would be a false claim on a pharmacy storefront, not just a cosmetic bug.
 * @param {number} price
 * @param {number|null} [oldPrice]
 * @returns {number|null}
 */
export function discountPercentage(price, oldPrice) {
  if (!oldPrice || oldPrice <= price || price < 0) return null;
  const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
  return pct > 0 ? pct : null;
}

/**
 * The automatic markdown pill, or null. Always priority 1.
 * @param {number} price
 * @param {number|null} [oldPrice]
 * @returns {ResolvedBadge|null}
 */
export function discountBadge(price, oldPrice) {
  const pct = discountPercentage(price, oldPrice);
  if (pct === null) return null;
  // --pdh-sale-strong, not --pdh-sale: white on the brand red #FF514D is
  // 3.21:1, and this pill is the one number a shopper actually reads.
  return { text: `−${pct}%`, bgColor: "var(--pdh-sale-strong)", textColor: "#FFFFFF", priority: 1 };
}

/**
 * Relative luminance per WCAG 2.x, or null for anything that is not a plain
 * hex colour — `var(--pdh-sale-strong)` and friends cannot be resolved here,
 * and must not be guessed at.
 * @param {string} color
 * @returns {number|null}
 */
function luminance(color) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((color || "").trim());
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const channel = (i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/**
 * WCAG contrast ratio, or null when either colour is unresolvable.
 * @param {string} a
 * @param {string} b
 * @returns {number|null}
 */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Badge text is set at 10.5px, so the 4.5:1 floor for normal text applies. */
const AA_NORMAL = 4.5;

/**
 * The fallback ladder, in preference order.
 *
 * White and the soft near-black come first because they are what the rest of
 * the storefront uses. Pure black is last and is the actual guarantee: the
 * white and black contrast curves cross at a background luminance of ~0.179,
 * where both measure 4.58:1, so one of the two always clears AA whatever an
 * editor types. #111827 does *not* carry that promise — it is light enough
 * that on the brand teal it reaches only 4.37:1, which is precisely how this
 * ladder came to have three rungs instead of two.
 */
const SAFE_TEXT = ["#FFFFFF", "#111827", "#000000"];

/**
 * Guarantees a badge's text is legible on its own background.
 *
 * Badge colours are editor-supplied — the CMS offers free hex fields with no
 * validation behind them — so a well-meant pastel pill can reach a shopper
 * with text nobody can read. This is the last gate before render, and it is
 * deliberately conservative: an editor's colour that already passes is kept
 * exactly as chosen, and only a genuine failure is overridden.
 *
 * Colours it cannot measure (CSS custom properties, gradients) pass through
 * untouched. Those are ours, not an editor's, and are checked at the token.
 *
 * @param {string} bgColor
 * @param {string} textColor
 * @returns {string} the colour to actually render the text in
 */
export function readableTextColor(bgColor, textColor) {
  const asked = contrastRatio(textColor, bgColor);
  if (asked === null || asked >= AA_NORMAL) return textColor;
  let best = textColor;
  let bestRatio = asked;
  for (const candidate of SAFE_TEXT) {
    const r = contrastRatio(candidate, bgColor);
    if (r === null) continue;
    // First rung that clears the floor wins, so a pale badge keeps the soft
    // near-black rather than being forced to pure black for no benefit.
    if (r >= AA_NORMAL) return candidate;
    if (r > bestRatio) {
      best = candidate;
      bestRatio = r;
    }
  }
  return best;
}

/**
 * Turns a product's configured badges plus its pricing into the final,
 * ordered list to render.
 *
 * Resolution order per field: the editor's explicit value, then the type's
 * preset, then nothing (a badge that resolves to empty text is dropped —
 * a coloured pill with no words carries no information, which is also the
 * accessibility rule here).
 * @param {RawBadge[]|null} [badges]
 * @param {number} price
 * @param {number|null} [oldPrice]
 * @param {number} [limit]
 * @returns {ResolvedBadge[]}
 */
export function resolveProductBadges(badges, price, oldPrice, limit = MAX_BADGES) {
  /** @type {ResolvedBadge[]} */
  const configured = (badges || [])
    .filter((b) => b.enabled !== false)
    .map((b) => {
      const preset = BADGE_TYPE_PRESETS[b.type || "custom"] ?? BADGE_TYPE_PRESETS.custom;
      const bgColor = b.bgColor || preset.bgColor;
      return {
        text: (b.text?.trim() || preset.label || "").trim(),
        bgColor,
        // Applied after the editor's value has won, not before: the guard
        // corrects a failing pair, it does not pre-empt a working choice.
        textColor: readableTextColor(bgColor, b.textColor || preset.textColor),
        priority: b.priority ?? preset.priority,
      };
    })
    .filter((b) => b.text);

  const auto = discountBadge(price, oldPrice);
  const all = auto ? [auto, ...configured] : configured;

  // Stable sort: equal priorities keep the editor's own row order.
  return all
    .map((b, i) => ({ b, i }))
    .sort((x, y) => x.b.priority - y.b.priority || x.i - y.i)
    .map(({ b }) => b)
    .slice(0, limit);
}

/**
 * The one badge derived from signals rather than from the editor's rows.
 *
 * Empty bgColor/textColor mean "use the theme default" — ProductBadges falls
 * back to `--pdh-badge-bg`/`--pdh-badge-text` for those.
 * @param {{ featured?: boolean|null, createdAt?: string|null }} doc
 * @returns {ResolvedBadge|null}
 */
export function computeAutoBadge(doc) {
  if (doc.featured) return { text: "Top", bgColor: "", textColor: "", priority: BADGE_TYPE_PRESETS.top.priority };
  const created = doc.createdAt ? new Date(doc.createdAt).getTime() : NaN;
  if (!Number.isNaN(created) && Date.now() - created < NEW_WINDOW_MS)
    return { text: "Nouveau", bgColor: "", textColor: "", priority: BADGE_TYPE_PRESETS.nouveau.priority };
  return null;
}

/**
 * Full resolution for a CMS document: the editor's badges plus any genuine
 * markdown, and only when those produce nothing, a single signal-derived
 * badge. Shared by the live storefront path and the snapshot generator so a
 * product cannot show one badge set on the server and another in the snapshot.
 * @param {{ badges?: RawBadge[]|null, price: number, oldPrice?: number|null, featured?: boolean|null, createdAt?: string|null }} doc
 * @param {number} [limit]
 * @returns {ResolvedBadge[]}
 */
export function resolveBadgesForDoc(doc, limit = MAX_BADGES) {
  const oldPrice = typeof doc.oldPrice === "number" ? doc.oldPrice : null;
  const resolved = resolveProductBadges(doc.badges || [], doc.price, oldPrice, limit);
  if (resolved.length) return resolved;

  const auto = computeAutoBadge(doc);
  return auto ? [auto] : [];
}
