import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// next/image needs the Next runtime; this component's subject is the layout
// decision, not the image pipeline. The stub keeps the src, the alt and the
// object-fit visible in the markup so the assertions below can read them.
vi.mock("@/components/CloudinaryImage", () => ({
  CloudinaryImage: (props: { src?: string; alt?: string; className?: string; width?: number; height?: number; style?: { objectFit?: string } }) =>
    createElement("img", {
      src: props.src,
      alt: props.alt,
      className: props.className,
      width: props.width,
      height: props.height,
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
 * shape, for the same reason the campaign carousel has an `imageOnly` mode.
 *
 * October 2026: the full width became the page's, not a 1280px card's. The
 * cream band around it and the "Nous contacter" button under it went too, by
 * request: the artwork draws its own button, and the picture is the link.
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
  it("spans the page as a banner, with no band behind it", () => {
    const html = render({});
    expect(html).toContain('class="mkt-carousel"');
    // No cream band, and no 1280px card inside one.
    expect(html).not.toContain("F7EEE5");
    expect(html).not.toContain("min(1280px,100%)");
    // Never the half-width two-column grid.
    expect(html).not.toContain("cta-band-grid");
    expect(html).not.toContain("cta-band-media");
  });

  it("makes the picture itself the link, with no button under it", () => {
    const html = render({});
    expect(html).toMatch(/<a href="\/contact" aria-label="Nous contacter" class="mkt-slide-frame"><img/);
    // The label names the link for a screen reader; it is not drawn.
    expect(html).not.toContain(">Nous contacter<");
  });

  it("shows the picture at its own shape, uncropped", () => {
    const html = render({});
    expect(html).toContain('width="1448" height="810"');
    expect(html).toContain('class="mkt-slide-img"');
    expect(html).not.toContain("data-fit");
  });

  it("reserves a plausible box when dimensions are missing", () => {
    expect(render({ bgImageWidth: undefined, bgImageHeight: undefined })).toContain('width="1920" height="800"');
  });

  it("needs no button label: the picture alone is the block", () => {
    expect(render({ ctaLabel: "" })).toContain('class="mkt-slide-frame"');
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

  it("still renders nothing when there is neither a headline, a button nor a picture", () => {
    expect(render({ ctaLabel: "", bgImage: "" })).toBe("");
  });
});
