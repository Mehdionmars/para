import { describe, expect, it } from "vitest";
import {
  RAIL_EDITORIAL_DEFAULTS,
  resolveRailEditorial,
} from "@/lib/storefront/railEditorial";

describe("resolveRailEditorial", () => {
  it("reproduces the previously hard-coded copy when nothing is set", () => {
    // This is the guarantee that made the change safe to ship: a rail saved
    // before these fields existed renders exactly what it rendered before.
    const resolved = resolveRailEditorial({ image: "img.jpg" });

    expect(resolved).toEqual({
      image: "img.jpg",
      eyebrow: RAIL_EDITORIAL_DEFAULTS.eyebrow,
      title: RAIL_EDITORIAL_DEFAULTS.title,
      description: RAIL_EDITORIAL_DEFAULTS.description,
      ctaLabel: RAIL_EDITORIAL_DEFAULTS.ctaLabel,
      ctaUrl: RAIL_EDITORIAL_DEFAULTS.ctaUrl,
    });
  });

  it("lets each rail say something different", () => {
    // The point of the change: two rails with an image no longer print the
    // same paragraph twice.
    const a = resolveRailEditorial({ image: "a.jpg", title: "Conseils cheveux" });
    const b = resolveRailEditorial({ image: "b.jpg", title: "Conseils bébé" });

    expect(a.title).toBe("Conseils cheveux");
    expect(b.title).toBe("Conseils bébé");
    expect(a.title).not.toBe(b.title);
  });

  it("overrides every field independently", () => {
    const resolved = resolveRailEditorial({
      image: "img.jpg",
      eyebrow: "Notre rituel",
      title: "Titre",
      description: "Description",
      ctaLabel: "Voir",
      ctaUrl: "/shop/visage",
    });

    expect(resolved).toEqual({
      image: "img.jpg",
      eyebrow: "Notre rituel",
      title: "Titre",
      description: "Description",
      ctaLabel: "Voir",
      ctaUrl: "/shop/visage",
    });
  });

  it("treats whitespace-only CMS values as unset", () => {
    // Payload returns "" for a cleared field and editors leave stray spaces;
    // neither should print a blank heading over the image.
    const resolved = resolveRailEditorial({ image: "img.jpg", title: "   ", ctaUrl: "" });

    expect(resolved.title).toBe(RAIL_EDITORIAL_DEFAULTS.title);
    expect(resolved.ctaUrl).toBe(RAIL_EDITORIAL_DEFAULTS.ctaUrl);
  });

  it("never returns an empty link target", () => {
    // An <a href=""> reloads the current page — worse than the default.
    for (const ctaUrl of [undefined, "", "   "]) {
      expect(resolveRailEditorial({ image: "i.jpg", ctaUrl }).ctaUrl).toBe("/catalogue");
    }
  });
});
