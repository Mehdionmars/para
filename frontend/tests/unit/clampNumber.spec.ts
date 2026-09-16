import { describe, expect, it } from "vitest";

import { clampNumber } from "@/lib/dashboard/clampNumber";
import { mapHomeDocToDraft } from "@/lib/dashboard/storefront-mapping";

describe("clampNumber", () => {
  it("keeps a value inside its bounds", () => {
    expect(clampNumber(8, 1, 6)).toBe(6);
    expect(clampNumber(0, 1, 3)).toBe(1);
    expect(clampNumber(4, 1, 6)).toBe(4);
    expect(clampNumber(Number.NaN, 1, 6)).toBe(1);
  });
});

describe("coffrets visible counts in the builder draft", () => {
  it("brings a draft saved out of range back inside the CMS bounds, so it can be published", () => {
    // The preprod draft that failed: 8 and 8, against max 6 and max 3.
    const draft = mapHomeDocToDraft({ coffretsCopy: { visibleDesktop: 8, visibleMobile: 8 } });
    expect(draft.coffretsCopy.visibleDesktop).toBe(6);
    expect(draft.coffretsCopy.visibleMobile).toBe(3);
  });

  it("keeps valid values and defaults as they were", () => {
    expect(mapHomeDocToDraft({ coffretsCopy: { visibleDesktop: 4, visibleMobile: 2 } }).coffretsCopy).toMatchObject({ visibleDesktop: 4, visibleMobile: 2 });
    expect(mapHomeDocToDraft({}).coffretsCopy).toMatchObject({ visibleDesktop: 3, visibleMobile: 1 });
  });
});
