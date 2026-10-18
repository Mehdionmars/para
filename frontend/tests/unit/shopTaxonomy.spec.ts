import { describe, expect, it } from "vitest";
import { categoryFromName } from "@/lib/storefront/shopTaxonomy";

describe("categoryFromName", () => {
  it("finds the broad category whatever the case, accents or punctuation", () => {
    expect(categoryFromName("Bucco-dentaire")).toBe("Bucco-Dentaire");
    expect(categoryFromName("Hygiene")).toBe("Hygiène");
    expect(categoryFromName("  VISAGE ")).toBe("Visage");
    expect(categoryFromName("Complements alimentaires")).toBe("Compléments alimentaires");
  });

  it("reads a renamed menu entry through the category's slug", () => {
    expect(categoryFromName("Bébé & Maman")).toBe("Baby & Mom");
    expect(categoryFromName("Baby & Mom")).toBe("Baby & Mom");
  });

  it("returns null for menu groupings no product is filed under", () => {
    expect(categoryFromName("Soldes")).toBeNull();
    expect(categoryFromName("K Beauty")).toBeNull();
    expect(categoryFromName("")).toBeNull();
  });
});
