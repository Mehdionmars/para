import { describe, expect, it } from "vitest";

import { findCategoryHrefInText, type CategoryNode, type CategoryTree } from "@/lib/storefront/categoryTree";

/**
 * Where a square offer tile leads, when the CMS has no destination for it.
 *
 * Every tile pointed at /catalogue because the href was hardcoded: two large
 * pictures that could only ever lead to the whole shop, whatever they showed.
 * `ctaUrl` fixes that properly but its column is not migrated yet, so the
 * destination is read out of the tile's own copy against the real Categories
 * tree in the meantime.
 *
 * The cases that matter most are the ones where it must NOT guess. A tile
 * sent to a plausible-but-wrong category is worse than one sent to the
 * catalogue: the visitor cannot tell they were misrouted.
 */

let nextId = 1;
function node(name: string, children: CategoryNode[] = []): CategoryNode {
  return {
    id: nextId++,
    name,
    slug: name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    parent: null,
    order: 0,
    children,
  };
}

const TREE: CategoryTree = {
  roots: new Map(
    [
      node("Cheveux", [node("Shampoings traitants"), node("Masques capillaires")]),
      node("Visage", [node("Nettoyants", [node("Eaux micellaires")])]),
      node("Corps"),
      node("Solaire"),
      node("Maquillage"),
    ].map((n) => [n.slug, n]),
  ),
};

describe("findCategoryHrefInText — the tiles in the brief", () => {
  it("sends the hair tile to the hair category", () => {
    expect(findCategoryHrefInText(TREE, "Révélez la beauté de vos cheveux")).toBe("/shop/cheveux");
  });

  it("matches whatever the accents and case", () => {
    expect(findCategoryHrefInText(TREE, "SOINS SOLAIRES")).toBe("/shop/solaire");
    expect(findCategoryHrefInText(TREE, "notre maquillage")).toBe("/shop/maquillage");
  });

  it("reads the eyebrow too, not just the title", () => {
    expect(findCategoryHrefInText(TREE, "Nouveautés", "Rayon visage")).toBe("/shop/visage");
  });
});

describe("findCategoryHrefInText — refusing to guess", () => {
  it("leaves a tile that names no category alone", () => {
    // "Prenez soin de votre peau" — the other tile in the brief. "Peau" is
    // not a category and could as honestly mean Visage or Corps.
    expect(findCategoryHrefInText(TREE, "Prenez soin de votre peau")).toBeNull();
    expect(findCategoryHrefInText(TREE, "Nos meilleures ventes")).toBeNull();
  });

  it("does not match a category name hidden inside a longer word", () => {
    // The trap: "corps" inside "corpsculaire", and "or" inside "corps".
    expect(findCategoryHrefInText(TREE, "Anticorpsculaire")).toBeNull();
    expect(findCategoryHrefInText({ roots: new Map([["or", node("Or")]]) }, "Nos soins corps")).toBeNull();
  });

  it("handles empty and missing copy", () => {
    expect(findCategoryHrefInText(TREE, "")).toBeNull();
    expect(findCategoryHrefInText(TREE, undefined, undefined)).toBeNull();
    expect(findCategoryHrefInText({ roots: new Map() }, "Cheveux")).toBeNull();
  });
});

describe("findCategoryHrefInText — choosing between matches", () => {
  it("prefers the top-level category over one of its children", () => {
    // Names both "Cheveux" (level 0) and "Masques capillaires" (level 1).
    expect(findCategoryHrefInText(TREE, "Masques capillaires pour cheveux secs")).toBe("/shop/cheveux");
  });

  it("falls to a sub-category when no top-level name appears", () => {
    expect(findCategoryHrefInText(TREE, "Nos eaux micellaires")).toBe("/shop/eaux-micellaires");
  });
});

/**
 * The four tiles that are actually in the database, against the categories
 * that are actually in the navbar — both read off the running site before
 * this was written.
 *
 * This is the honest scorecard: one tile out of four names a category, so
 * one resolves. The other three say "peau", "routine" and "moment", none of
 * which is a category and none of which this should invent a destination for.
 * They keep the catalogue link until an editor fills in `ctaUrl`, which is
 * what the migration alongside this change is for.
 */
describe("findCategoryHrefInText — the tiles as they exist today", () => {
  const REAL: CategoryTree = {
    roots: new Map(
      [
        node("Visage"),
        node("Cheveux"),
        node("Corps"),
        node("K Beauty"),
        node("Maquillage"),
        node("Bébé & Maman"),
        node("Bucco-dentaire"),
        node("Compléments alimentaires"),
      ].map((n) => [n.slug, n]),
    ),
  };

  it("resolves the one tile that names a category", () => {
    expect(findCategoryHrefInText(REAL, "Révélez la beauté de vos cheveux")).toBe("/shop/cheveux");
  });

  it("leaves the three that do not", () => {
    expect(findCategoryHrefInText(REAL, "Prenez soin de votre peau")).toBeNull();
    expect(findCategoryHrefInText(REAL, "Une routine adaptée à votre peau")).toBeNull();
    expect(findCategoryHrefInText(REAL, "Des soins pour chaque moment")).toBeNull();
  });

  it("resolves a multi-word category name as one unit", () => {
    expect(findCategoryHrefInText(REAL, "Nos compléments alimentaires")).toBe("/shop/complements-alimentaires");
    expect(findCategoryHrefInText(REAL, "Rituel K Beauty")).toBe("/shop/k-beauty");
  });
});
