import { describe, expect, it } from "vitest";

import { dedupeBadges, resolveProductBadges, type RawBadge, type ResolvedBadge } from "@/lib/productBadges";

/**
 * Badge resolution, pinned around the defect it was written for.
 *
 * The seeded catalogue carries a hand-typed "−18%" row on every discounted
 * product, and the resolver adds a computed pill saying the same thing. Five
 * of twenty-four cards on /catalogue were showing the sticker twice.
 */

const texts = (b: ResolvedBadge[]) => b.map((x) => x.text);

const raw = (over: Partial<RawBadge> = {}): RawBadge => ({ enabled: true, type: "custom", ...over });

describe("resolveProductBadges", () => {
  it("computes the markdown pill from the prices", () => {
    expect(texts(resolveProductBadges([], 139, 169))).toEqual(["−18%"]);
  });

  it("shows the computed pill once when the editor typed the same number", () => {
    const out = resolveProductBadges([raw({ text: "−18%" })], 139, 169);
    expect(texts(out)).toEqual(["−18%"]);
  });

  it("drops a typed percentage that disagrees with the real one", () => {
    // Worse than a repeat: both look authoritative and only one is true.
    const out = resolveProductBadges([raw({ text: "-25%" })], 139, 169);
    expect(texts(out)).toEqual(["−18%"]);
  });

  it("matches a typed percentage whatever dash and spacing it uses", () => {
    for (const typed of ["-18%", "− 18 %", "18%", "—18%"]) {
      expect(texts(resolveProductBadges([raw({ text: typed })], 139, 169))).toEqual(["−18%"]);
    }
  });

  it("keeps a typed percentage when there is no real markdown to contradict it", () => {
    // Nothing computed means nothing to be inconsistent with, and an editor
    // who typed it meant it.
    expect(texts(resolveProductBadges([raw({ text: "−18%" })], 139, null))).toEqual(["−18%"]);
  });

  it("keeps editorial badges alongside the markdown", () => {
    const out = resolveProductBadges([raw({ type: "nouveau" }), raw({ text: "−18%" })], 139, 169);
    expect(texts(out)).toEqual(["−18%", "Nouveauté"]);
  });

  it("never emits a badge for a non-discount", () => {
    expect(texts(resolveProductBadges([], 169, 139))).toEqual([]);
    expect(texts(resolveProductBadges([], 139, 139))).toEqual([]);
    expect(texts(resolveProductBadges([], 139, null))).toEqual([]);
  });
});

describe("dedupeBadges", () => {
  const pill = (text: string, priority = 5): ResolvedBadge => ({ text, bgColor: "#000", textColor: "#fff", priority });

  it("drops a repeat before the cap, not after", () => {
    // The repeat must not eat the slot a real second badge would have used.
    const out = dedupeBadges([pill("−18%", 1), pill("-18 %", 1), pill("Nouveauté", 2)], 2);
    expect(texts(out)).toEqual(["−18%", "Nouveauté"]);
  });

  it("orders by priority and keeps arrival order within a tie", () => {
    expect(texts(dedupeBadges([pill("B", 3), pill("A", 1), pill("C", 3)]))).toEqual(["A", "B", "C"]);
  });

  it("drops empty labels", () => {
    expect(texts(dedupeBadges([pill(""), pill("   "), pill("Top")]))).toEqual(["Top"]);
  });
});
