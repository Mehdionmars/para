import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/CloudinaryImage", () => ({
  CloudinaryImage: (props: { src?: string }) => createElement("img", { src: props.src, alt: "" }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children?: unknown }) =>
    createElement("a", { href, ...rest }, children as never),
}));

const { CtaPair } = await import("@/components/home/CtaPair");
type Tile = Parameters<typeof CtaPair>[0]["tiles"][number];

/**
 * The offers block: a titled shelf of square picture links.
 *
 * It used to be two wide rectangles with href="/catalogue" hardcoded on both
 * and no heading — a visitor met two large pictures that could only ever lead
 * to the whole catalogue, whatever they showed.
 *
 * The href test is the one that matters most: `ctaUrl` is read from a CMS
 * field that is not migrated yet, so the fallback has to keep working for
 * tiles that do not carry one, and the real destination has to be used the
 * moment they do.
 */

const TILE: Tile = { eyebrow: "Été", title: "Protection solaire", bg: "#EFE6F3", img: "/api/cms-media/solaire.png" };

function render(tiles: Tile[], title?: string): string {
  return renderToStaticMarkup(createElement(CtaPair, title ? { tiles, title } : { tiles }));
}

describe("CtaPair", () => {
  it("is square, never a fixed height", () => {
    const html = render([TILE]);
    expect(html).toContain("aspect-ratio:1 / 1");
    expect(html).not.toContain("min-height");
  });

  it("carries the section heading", () => {
    expect(render([TILE])).toContain("Offres spéciales");
    expect(render([TILE], "Nos sélections")).toContain("Nos sélections");
  });

  it("uses the tile's own destination when the CMS supplies one", () => {
    const html = render([{ ...TILE, ctaUrl: "/produit/anthelios-uvmune" }]);
    expect(html).toContain('href="/produit/anthelios-uvmune"');
    expect(html).not.toContain('href="/catalogue"');
  });

  it("falls back to the catalogue for a tile with no destination yet", () => {
    expect(render([TILE])).toContain('href="/catalogue"');
  });

  it("ignores a destination that is only whitespace", () => {
    expect(render([{ ...TILE, ctaUrl: "   " }])).toContain('href="/catalogue"');
  });

  it("gives every tile the same treatment, however many there are", () => {
    const tiles = [TILE, { ...TILE, title: "Cheveux" }, { ...TILE, title: "Corps" }, { ...TILE, title: "Bébé" }];
    const html = render(tiles);

    // No mosaic: the old layout made every third tile span both columns, and
    // a wide tile is a rectangle by definition.
    expect(html).not.toContain("data-wide");
    expect(html).not.toContain("cta-mosaic");
    expect([...html.matchAll(/aspect-ratio:1 \/ 1/g)]).toHaveLength(4);
  });

  it("renders nothing rather than an empty titled section", () => {
    expect(render([])).toBe("");
  });
});
