import { describe, expect, it } from "vitest";

import { reflowDescription } from "@/lib/storefront/descriptionText";

describe("reflowDescription", () => {
  it("rejoins a sentence hard-wrapped by a PDF paste", () => {
    // Shape of the D-BIOTIC gel surgras description on the live catalogue.
    const raw =
      "D-Biotic gel nettoyant surgras est un gel à base d’un \ncomplexe spécifique de sept (07) Céramides, des \nactifs probiotiques.";
    expect(reflowDescription(raw)).toBe(
      "D-Biotic gel nettoyant surgras est un gel à base d’un complexe spécifique de sept (07) Céramides, des actifs probiotiques.",
    );
  });

  it("keeps section headings and the lines under them apart", () => {
    const raw = "INDICATIONS\nCheveux secs, cassants.\n\nConseils d'utilisation :\nappliquer sur cheveux essorés.";
    expect(reflowDescription(raw)).toBe(raw);
  });

  it("keeps one benefit per line when each is a sentence", () => {
    const raw = "Les plus :\n3 actions en 1 : nettoie, démaquille et exfolie.\nPeau lissée, sans tiraillement.";
    expect(reflowDescription(raw)).toBe(raw);
  });

  it("does not join into a line that ends a sentence, even if the next starts in lower case", () => {
    expect(reflowDescription("Ne pas rincer.\névite le contact avec les yeux")).toBe(
      "Ne pas rincer.\névite le contact avec les yeux",
    );
  });

  it("keeps blank lines between paragraphs and trims the ends", () => {
    expect(reflowDescription("  Premier paragraphe.\n\n\nDeuxième.  \n")).toBe("Premier paragraphe.\n\n\nDeuxième.");
  });

  it("normalises Windows line endings and tolerates empty input", () => {
    expect(reflowDescription("un gel à base\r\nde céramides.")).toBe("un gel à base de céramides.");
    expect(reflowDescription("")).toBe("");
    expect(reflowDescription(null)).toBe("");
  });
});
