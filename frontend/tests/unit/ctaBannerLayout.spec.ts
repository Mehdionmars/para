import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// next/image needs the Next runtime; this component's subject is the layout
// decision, not the image pipeline. The stub keeps the src, the alt and the
// object-fit visible in the markup so the assertions below can read them.
vi.mock("@/components/CloudinaryImage", () => ({
  CloudinaryImage: (props: { src?: string; alt?: string; style?: { objectFit?: string } }) =>
    createElement("img", {
      src: props.src,
      alt: props.alt,
      "data-fit": props.style?.objectFit,
    }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children?: unknown }) =>
    createElement("a", { href, ...rest }, children as never),
}));

const { CtaBanner } = await import("@/components/home/CtaBanner");
type Copy = Parameters<typeof CtaBanner>[0]["copy"];

/**
 * The CTA band has two shapes, and which one it takes is decided by whether
 * an editor wrote anything beside the picture.
 *
 * September 2026, preprod: a composed "Saison été" banner — its own eyebrow,
 * headline, product shots and drawn button all inside the file — was uploaded
 * with the title and description left empty. The two-column grid gave it half
 * the band and left the other half an empty cream void with one button in it.
 * Artwork that carries its own copy has to take the full width, at its own
 * shape, for the same reason MarketingBanner has an `imageOnly` mode.
 */

const BASE: Copy = {
  eyebrow: "Saison été",
  title: "",
  description: "",
  ctaLabel: "Nous contacter",
  ctaUrl: "/contact",
  bg: "#F7EEE5",
  bgImage: "/api/cms-media/saison-ete.png",
  bgImageWidth: 1448,
  bgImageHeight: 810,
  textColor: "#373020",
  ctaColor: "#5E4074",
};

function render(copy: Partial<Copy>): string {
  return renderToStaticMarkup(createElement(CtaBanner, { copy: { ...BASE, ...copy } }));
}

describe("CtaBanner — artwork with no copy", () => {
  it("gives the picture the full width at its own ratio", () => {
    const html = render({});
    expect(html).toContain("aspect-ratio:1448 / 810");
    expect(html).toContain("min(1280px,100%)");
    // Never the half-width two-column grid.
    expect(html).not.toContain("cta-band-grid");
    expect(html).not.toContain("cta-band-media");
  });

  it("never crops artwork that carries its own headline", () => {
    expect(render({})).toContain('data-fit="contain"');
  });

  it("keeps the real button, which the drawn one cannot replace", () => {
    const html = render({});
    expect(html).toContain("Nous contacter");
    expect(html).toContain('href="/contact"');
  });

  it("falls back to a ratio rather than guessing when dimensions are missing", () => {
    const html = render({ bgImageWidth: undefined, bgImageHeight: undefined });
    expect(html).toContain("aspect-ratio:4 / 3");
    // contain, so an unresolved media document letterboxes instead of losing
    // the edges of a banner whose shape we do not know.
    expect(html).toContain('data-fit="contain"');
  });
});

describe("CtaBanner — copy beside the picture", () => {
  it("keeps the two-column grid when a headline was written", () => {
    const html = render({ title: "Un conseil de pharmacien, en deux minutes" });
    expect(html).toContain("cta-band-grid");
    expect(html).toContain("cta-band-media");
  });

  it("keeps it for a description alone, with no headline", () => {
    expect(render({ description: "Décrivez votre besoin." })).toContain("cta-band-grid");
  });

  it("still renders nothing when there is neither a headline nor a button", () => {
    expect(render({ ctaLabel: "" })).toBe("");
  });
});
