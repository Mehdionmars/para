import { describe, expect, it } from "vitest";

import { megaMenuFromCategoryTree, type CategoryNode, type CategoryTree } from "@/lib/storefront/categoryTree";

/**
 * Hovering a category has to open its sub-categories.
 *
 * September 2026: hovering Visage, Cheveux or Corps opened nothing. The
 * trigger was wired — Header sets activeNav on mouseenter for every item —
 * but MegaMenu returns null when its key has no columns, and
 * `navigation.items[].megaMenu.columns` had never been filled in. The tree
 * the panel needed was already in the Categories collection, which describes
 * itself as exactly that: level 1 = columns, level 2 = items in a column.
 *
 * The slugs these links produce are known to resolve: /shop/nettoyants,
 * /shop/serums, /shop/cremes, /shop/eaux-micellaires, /shop/anti-taches and
 * /shop/contour-des-yeux all answered 200 on preprod before this shipped.
 */

let nextId = 1;
function node(name: string, children: CategoryNode[] = [], order = 0): CategoryNode {
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
    order,
    children,
  };
}

function tree(...roots: CategoryNode[]): CategoryTree {
  return { roots: new Map(roots.map((r) => [r.slug, r])) };
}

describe("megaMenuFromCategoryTree — three-level taxonomy", () => {
  const visage = node("Visage", [
    node("Nettoyants", [node("Eaux micellaires"), node("Gels moussants")]),
    node("Serums", [node("Anti-taches"), node("Vitamine C")]),
  ]);

  it("turns level 1 into columns and level 2 into their links", () => {
    const menu = megaMenuFromCategoryTree(tree(visage), "visage");

    expect(menu?.columns.map((c) => c.title)).toEqual(["Nettoyants", "Serums"]);
    expect(menu?.columns[0].links).toEqual([
      { href: "/shop/eaux-micellaires", label: "Eaux micellaires" },
      { href: "/shop/gels-moussants", label: "Gels moussants" },
    ]);
  });

  it("links through /shop/<slug>, the route that resolves sub-categories", () => {
    const menu = megaMenuFromCategoryTree(tree(visage), "visage");
    const hrefs = menu?.columns.flatMap((c) => c.links.map((l) => l.href)) ?? [];

    expect(hrefs.every((h) => h.startsWith("/shop/"))).toBe(true);
    expect(hrefs).not.toContain("#");
  });
});

describe("megaMenuFromCategoryTree — two-level taxonomy", () => {
  // What a shop whose taxonomy stops at two levels actually has, and what the
  // screenshots in the brief show: Cheveux with three flat entries under it.
  const cheveux = node("Cheveux", [node("Soin des cheveux"), node("Coiffage"), node("Accessoires")]);

  it("gathers flat children into a single column named after the category", () => {
    const menu = megaMenuFromCategoryTree(tree(cheveux), "cheveux");

    expect(menu?.columns).toHaveLength(1);
    expect(menu?.columns[0].title).toBe("Cheveux");
    expect(menu?.columns[0].links.map((l) => l.label)).toEqual([
      "Soin des cheveux",
      "Coiffage",
      "Accessoires",
    ]);
  });
});

describe("megaMenuFromCategoryTree — mixed and empty trees", () => {
  it("keeps leaves that sit beside branches instead of dropping them", () => {
    const corps = node("Corps", [node("Hydratation", [node("Laits corps")]), node("Gommages")]);
    const menu = megaMenuFromCategoryTree(tree(corps), "corps");

    expect(menu?.columns.map((c) => c.title)).toEqual(["Hydratation", "Autres corps"]);
    expect(menu?.columns[1].links.map((l) => l.label)).toEqual(["Gommages"]);
  });

  it("returns null for a category with no children, so no empty panel opens", () => {
    expect(megaMenuFromCategoryTree(tree(node("Soldes")), "soldes")).toBeNull();
  });

  it("returns null for a slug that is not a top-level category", () => {
    expect(megaMenuFromCategoryTree(tree(node("Visage", [node("Nettoyants")])), "marques")).toBeNull();
  });

  it("respects the CMS order field over alphabetical order", () => {
    const corps = node("Corps", [node("Zeta", [], 1), node("Alpha", [], 2)]);
    const menu = megaMenuFromCategoryTree(tree(corps), "corps");

    expect(menu?.columns[0].links.map((l) => l.label)).toEqual(["Zeta", "Alpha"]);
  });
});
