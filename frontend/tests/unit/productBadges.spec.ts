import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  BADGE_TYPE_PRESETS,
  MAX_BADGES,
  computeAutoBadge,
  contrastRatio,
  discountBadge,
  discountPercentage,
  readableTextColor,
  resolveBadgesForDoc,
  resolveProductBadges,
  type BadgePreset,
} from "@/lib/productBadges";

/**
 * Badge resolution decides what price claim a shopper sees on a pharmacy
 * storefront, so the rules are pinned here rather than left to the three
 * call sites that used to each own a copy of them.
 */

const OLD = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
const RECENT = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();

describe("discountPercentage", () => {
  it("computes a genuine markdown", () => {
    expect(discountPercentage(80, 100)).toBe(20);
  });

  it("refuses to invent a discount", () => {
    // Each of these would put a false price claim on the page.
    expect(discountPercentage(100, 100)).toBeNull();
    expect(discountPercentage(100, 80)).toBeNull();
    expect(discountPercentage(100, null)).toBeNull();
    expect(discountPercentage(100, undefined)).toBeNull();
    expect(discountPercentage(100, 0)).toBeNull();
  });

  it("ignores a negative price rather than reporting a bogus percentage", () => {
    expect(discountPercentage(-5, 100)).toBeNull();
  });

  it("drops a markdown too small to round to a whole percent", () => {
    expect(discountPercentage(99.999, 100)).toBeNull();
  });
});

describe("resolveProductBadges", () => {
  it("falls back to the type's preset for text and colours", () => {
    const [badge] = resolveProductBadges([{ type: "bestseller" }], 10);
    expect(badge).toEqual({
      text: BADGE_TYPE_PRESETS.bestseller.label,
      bgColor: BADGE_TYPE_PRESETS.bestseller.bgColor,
      textColor: BADGE_TYPE_PRESETS.bestseller.textColor,
      priority: BADGE_TYPE_PRESETS.bestseller.priority,
    });
  });

  it("lets the editor's explicit values win over the preset", () => {
    const [badge] = resolveProductBadges(
      [{ type: "bestseller", text: "  Notre choix  ", bgColor: "#000000", textColor: "#FFFFFF", priority: 4 }],
      10,
    );
    expect(badge).toEqual({ text: "Notre choix", bgColor: "#000000", textColor: "#FFFFFF", priority: 4 });
  });

  it("drops disabled rows and rows that resolve to no text", () => {
    // `custom` has an empty preset label, so a custom row with no text of its
    // own is a coloured pill carrying no information.
    expect(resolveProductBadges([{ type: "bestseller", enabled: false }], 10)).toEqual([]);
    expect(resolveProductBadges([{ type: "custom" }], 10)).toEqual([]);
    expect(resolveProductBadges([{ type: "custom", text: "   " }], 10)).toEqual([]);
  });

  it("treats an unknown type as custom instead of throwing", () => {
    const [badge] = resolveProductBadges([{ type: "not-a-real-type", text: "Promo maison" }], 10);
    expect(badge.text).toBe("Promo maison");
    expect(badge.bgColor).toBe(BADGE_TYPE_PRESETS.custom.bgColor);
  });

  it("puts a real markdown first and keeps the configured badges", () => {
    const badges = resolveProductBadges([{ type: "bestseller" }], 80, 100);
    expect(badges.map((b) => b.text)).toEqual(["−20%", BADGE_TYPE_PRESETS.bestseller.label]);
    expect(badges[0].priority).toBe(1);
  });

  it("orders by priority and keeps the editor's row order on ties", () => {
    const badges = resolveProductBadges(
      [
        { type: "custom", text: "B", priority: 5 },
        { type: "custom", text: "A", priority: 5 },
        { type: "custom", text: "First", priority: 2 },
      ],
      10,
    );
    expect(badges.map((b) => b.text)).toEqual(["First", "B", "A"]);
  });

  it("caps at MAX_BADGES, dropping the lowest-priority pills", () => {
    const badges = resolveProductBadges(
      [
        { type: "custom", text: "p9", priority: 9 },
        { type: "custom", text: "p8", priority: 8 },
        { type: "custom", text: "p7", priority: 7 },
        { type: "custom", text: "p6", priority: 6 },
      ],
      10,
    );
    expect(badges).toHaveLength(MAX_BADGES);
    expect(badges.map((b) => b.text)).toEqual(["p6", "p7", "p8"]);
  });

  it("honours an explicit limit", () => {
    const badges = resolveProductBadges([{ type: "bestseller" }, { type: "nouveau" }], 80, 100, 1);
    expect(badges.map((b) => b.text)).toEqual(["−20%"]);
  });
});

describe("computeAutoBadge", () => {
  it("prefers featured over recency", () => {
    expect(computeAutoBadge({ featured: true, createdAt: RECENT })?.text).toBe("Top");
  });

  it("marks a recently created product as new", () => {
    expect(computeAutoBadge({ createdAt: RECENT })?.text).toBe("Nouveau");
  });

  it("returns nothing for an old, unremarkable product", () => {
    expect(computeAutoBadge({ createdAt: OLD })).toBeNull();
  });

  it("survives a missing or unparseable createdAt", () => {
    expect(computeAutoBadge({})).toBeNull();
    expect(computeAutoBadge({ createdAt: "not a date" })).toBeNull();
  });

  it("leaves colours empty so the theme's badge vars apply", () => {
    const badge = computeAutoBadge({ featured: true });
    expect(badge?.bgColor).toBe("");
    expect(badge?.textColor).toBe("");
  });
});

describe("resolveBadgesForDoc", () => {
  it("uses the signal-derived badge only when nothing else resolves", () => {
    expect(resolveBadgesForDoc({ badges: [], price: 10, createdAt: OLD, featured: true })).toEqual([
      { text: "Top", bgColor: "", textColor: "", priority: BADGE_TYPE_PRESETS.top.priority },
    ]);
  });

  it("does not add 'Nouveau' on top of badges the editor actually chose", () => {
    const badges = resolveBadgesForDoc({ badges: [{ type: "bestseller" }], price: 10, createdAt: RECENT });
    expect(badges.map((b) => b.text)).toEqual([BADGE_TYPE_PRESETS.bestseller.label]);
  });

  it("suppresses the fallback when a real markdown is present", () => {
    const badges = resolveBadgesForDoc({ badges: [], price: 80, oldPrice: 100, createdAt: RECENT });
    expect(badges.map((b) => b.text)).toEqual(["−20%"]);
  });

  it("ignores an oldPrice that is not a real markdown", () => {
    expect(resolveBadgesForDoc({ badges: [], price: 100, oldPrice: 100, createdAt: OLD })).toEqual([]);
  });
});

/**
 * The backend is a separate deploy target (Payload/Docker) and the storefront
 * bundle must not import from it, so its copy of the presets table cannot be
 * removed the way the sync-cms and storefront copies were. This test makes the
 * remaining duplication enforced instead of silent: adding or re-tuning a badge
 * type on one side and not the other fails here rather than shipping a product
 * whose pill is one colour in the admin preview and another on the storefront.
 */
describe("backend preset table stays in sync", () => {
  const backendFile = fileURLToPath(new URL("../../../backend/src/collections/Products.ts", import.meta.url));

  /** Colours the two tables intentionally disagree on, with the reason. */
  const COLOUR_EXCEPTIONS: Record<string, string> = {
    // The backend leaves `custom` colourless because its table only feeds the
    // admin's type dropdown; the storefront needs a real default to render a
    // custom pill that the editor gave no colour to.
    custom: "backend table is admin-only for this type",
  };

  function parseBackendPresets(source: string): Record<string, BadgePreset> {
    const block = source.match(/export const BADGE_TYPE_PRESETS = \{([\s\S]*?)\n\}/);
    if (!block) throw new Error("BADGE_TYPE_PRESETS not found in backend/src/collections/Products.ts");

    const entry =
      /(\w+):\s*\{\s*label:\s*'([^']*)',\s*bgColor:\s*'([^']*)',\s*textColor:\s*'([^']*)',\s*priority:\s*(\d+)\s*\}/g;
    const out: Record<string, BadgePreset> = {};
    for (const [, key, label, bgColor, textColor, priority] of block[1].matchAll(entry)) {
      out[key] = { label, bgColor, textColor, priority: Number(priority) };
    }
    if (Object.keys(out).length === 0) throw new Error("parsed no badge presets from the backend table");
    return out;
  }

  it.skipIf(!existsSync(backendFile))("defines exactly the same badge types", () => {
    const backend = parseBackendPresets(readFileSync(backendFile, "utf8"));
    expect(Object.keys(backend).sort()).toEqual(Object.keys(BADGE_TYPE_PRESETS).sort());
  });

  it.skipIf(!existsSync(backendFile))("agrees on every label, priority and colour", () => {
    const backend = parseBackendPresets(readFileSync(backendFile, "utf8"));

    for (const [type, preset] of Object.entries(backend)) {
      const mine = BADGE_TYPE_PRESETS[type as keyof typeof BADGE_TYPE_PRESETS];
      expect(mine, `frontend is missing badge type "${type}"`).toBeDefined();
      expect({ type, label: mine.label }).toEqual({ type, label: preset.label });
      expect({ type, priority: mine.priority }).toEqual({ type, priority: preset.priority });

      if (COLOUR_EXCEPTIONS[type]) continue;
      expect({ type, bgColor: mine.bgColor }).toEqual({ type, bgColor: preset.bgColor });
      expect({ type, textColor: mine.textColor }).toEqual({ type, textColor: preset.textColor });
    }
  });
});

/**
 * Badge colours are the one part of this system an editor types by hand, and
 * the pills render at 10.5px — squarely under the 4.5:1 floor for normal
 * text. Two shipped presets had drifted below it before these tests existed.
 */
describe("badge contrast", () => {
  const AA = 4.5;

  it("measures known pairs against the WCAG formula", () => {
    // Verified against the published algorithm, not against our own output.
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#6D28D9")).toBeCloseTo(7.1, 1);
    expect(contrastRatio("#FFFFFF", "#008AA5")).toBeCloseTo(4.06, 1);
    expect(contrastRatio("#FFFFFF", "#00758A")).toBeCloseTo(5.37, 1);
  });

  it("returns null for a colour it cannot resolve rather than guessing", () => {
    expect(contrastRatio("#FFFFFF", "var(--pdh-sale-strong)")).toBeNull();
    expect(contrastRatio("", "#FFFFFF")).toBeNull();
    expect(contrastRatio("rgb(0,0,0)", "#FFFFFF")).toBeNull();
  });

  it("accepts shorthand hex", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 1);
  });

  it("every shipped preset is legible", () => {
    for (const [type, preset] of Object.entries(BADGE_TYPE_PRESETS)) {
      const ratio = contrastRatio(preset.textColor, preset.bgColor);
      expect(ratio, `preset "${type}" has an unmeasurable colour`).not.toBeNull();
      expect({ type, ratio: Number(ratio!.toFixed(2)) }).toEqual({
        type,
        ratio: expect.any(Number),
      });
      expect(ratio!, `preset "${type}" measures ${ratio!.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA);
    }
  });

  it("keeps the discount pill on the contrast-safe red token", () => {
    // The brand red --pdh-sale is 3.21:1 under white; --pdh-sale-strong is the
    // surface white may sit on. This pill carries the only number that changes
    // a purchase decision.
    expect(discountBadge(70, 100)?.bgColor).toBe("var(--pdh-sale-strong)");
  });
});

describe("readableTextColor", () => {
  it("leaves a passing pair exactly as the editor chose it", () => {
    expect(readableTextColor("#6D28D9", "#FFFFFF")).toBe("#FFFFFF");
    expect(readableTextColor("#F7EEE5", "#373020")).toBe("#373020");
  });

  it("replaces a pair nobody could read", () => {
    // Pale lilac with white text: 1.35:1.
    const fixed = readableTextColor("#E9D5FF", "#FFFFFF");
    expect(fixed).not.toBe("#FFFFFF");
    expect(contrastRatio(fixed, "#E9D5FF")!).toBeGreaterThanOrEqual(4.5);
  });

  it("clears AA on any background, including the worst case", () => {
    // ~0.179 relative luminance is where white and near-black cross; every
    // other background is easier than this one.
    for (const bg of ["#767676", "#008AA5", "#FF514D", "#E9D5FF", "#111827", "#FFFFFF"]) {
      const chosen = readableTextColor(bg, "#FFFFFF");
      expect(contrastRatio(chosen, bg)!, `background ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("passes through colours it cannot measure instead of overriding them", () => {
    expect(readableTextColor("var(--pdh-sale-strong)", "#FFFFFF")).toBe("#FFFFFF");
  });

  it("guards editor-supplied colours at resolution time", () => {
    const [badge] = resolveProductBadges(
      [{ enabled: true, type: "custom", text: "Offre", bgColor: "#FFF9C4", textColor: "#FFFFFF" }],
      100,
      null,
    );
    expect(badge.bgColor).toBe("#FFF9C4");
    expect(badge.textColor).not.toBe("#FFFFFF");
    expect(contrastRatio(badge.textColor, badge.bgColor)!).toBeGreaterThanOrEqual(4.5);
  });
});
