import { describe, expect, it } from "vitest";

import { chromeAppearanceCss, isSafeHex, toChromeAppearance } from "@/lib/chromeAppearance";
import { contrastRatio, judgeContrast, parseHex } from "@/components/dashboard/appearance/contrast";

/**
 * The chrome appearance contract.
 *
 * The rule that matters more than any individual colour: **an unconfigured
 * shop must render exactly what it rendered before this feature existed.**
 * Every one of these tests exists to make that regression loud, because the
 * failure mode is silent — a stray default writes one variable, the header
 * turns a slightly different white, and nobody notices until a customer does.
 */

describe("unconfigured chrome", () => {
  it("emits no CSS at all when nothing is set", () => {
    expect(chromeAppearanceCss(undefined)).toBe("");
    expect(chromeAppearanceCss(null)).toBe("");
    expect(chromeAppearanceCss({})).toBe("");
    expect(chromeAppearanceCss({ topBar: null, header: null, footer: null })).toBe("");
  });

  it("emits nothing for a surface whose fields are all empty strings", () => {
    // An empty string is what a cleared dashboard field round-trips as. It
    // must read as "not configured", never as a configured empty colour.
    expect(
      chromeAppearanceCss({
        header: { backgroundColor: "", textColor: "", linkColor: "", hoverColor: "", iconColor: "", borderColor: "" },
      }),
    ).toBe("");
  });

  it("emits nothing for nulls, which is what the database holds", () => {
    expect(chromeAppearanceCss({ footer: { backgroundColor: null, textColor: null, opacity: null } })).toBe("");
  });

  it("reads an untouched Payload document as fully unconfigured", () => {
    // Exactly the shape the CMS returns before an operator opens the panel.
    expect(toChromeAppearance({})).toEqual({ topBar: undefined, header: undefined, footer: undefined });
    expect(
      toChromeAppearance({
        topBarAppearance: { backgroundColor: null, textColor: null, linkColor: null, hoverColor: null, opacity: null },
        headerAppearance: {},
        footerAppearance: null,
      }),
    ).toEqual({ topBar: undefined, header: undefined, footer: undefined });
  });
});

describe("configured chrome", () => {
  it("emits only the variables that were actually set", () => {
    const css = chromeAppearanceCss({ header: { backgroundColor: "#101010", linkColor: "#ABCDEF" } });
    expect(css).toBe("--chrome-header-bg:#101010;--chrome-header-link:#ABCDEF");
    // Nothing invented for the fields left alone.
    expect(css).not.toContain("--chrome-header-text");
    expect(css).not.toContain("--chrome-header-border");
  });

  it("covers every field of every surface", () => {
    const css = chromeAppearanceCss({
      topBar: { backgroundColor: "#111111", textColor: "#222222", linkColor: "#333333", hoverColor: "#444444" },
      header: {
        backgroundColor: "#555555",
        textColor: "#666666",
        linkColor: "#777777",
        hoverColor: "#888888",
        iconColor: "#999999",
        borderColor: "#AAAAAA",
      },
      footer: {
        backgroundColor: "#BBBBBB",
        textColor: "#CCCCCC",
        headingColor: "#DDDDDD",
        linkColor: "#EEEEEE",
        hoverColor: "#FFFFFF",
        iconColor: "#010101",
        borderColor: "#020202",
      },
    });

    for (const v of [
      "--chrome-topbar-bg",
      "--chrome-topbar-text",
      "--chrome-topbar-link",
      "--chrome-topbar-hover",
      "--chrome-header-bg",
      "--chrome-header-text",
      "--chrome-header-link",
      "--chrome-header-hover",
      "--chrome-header-icon",
      "--chrome-header-border",
      "--chrome-footer-bg",
      "--chrome-footer-text",
      "--chrome-footer-heading",
      "--chrome-footer-link",
      "--chrome-footer-hover",
      "--chrome-footer-icon",
      "--chrome-footer-border",
    ]) {
      expect(css).toContain(`${v}:`);
    }
  });

  it("converts the top bar's percentage opacity to a CSS number", () => {
    expect(chromeAppearanceCss({ topBar: { opacity: 60 } })).toBe("--chrome-topbar-opacity:0.6");
    // 0 is a real choice, not "unset" — `|| null` here would swallow it.
    expect(chromeAppearanceCss({ topBar: { opacity: 0 } })).toBe("--chrome-topbar-opacity:0");
    expect(chromeAppearanceCss({ topBar: { opacity: 100 } })).toBe("--chrome-topbar-opacity:1");
  });

  it("clamps an out-of-range opacity rather than emitting it", () => {
    expect(chromeAppearanceCss({ topBar: { opacity: 400 } })).toBe("--chrome-topbar-opacity:1");
    expect(chromeAppearanceCss({ topBar: { opacity: -20 } })).toBe("--chrome-topbar-opacity:0");
    expect(chromeAppearanceCss({ topBar: { opacity: Number.NaN } })).toBe("");
  });

  it("reads a configured document back into the same shape", () => {
    const appearance = toChromeAppearance({
      topBarAppearance: { backgroundColor: "#373020", textColor: "#FFFFFF", opacity: 80 },
      headerAppearance: { borderColor: "#E5E0E8" },
    });
    expect(appearance.topBar?.backgroundColor).toBe("#373020");
    expect(appearance.topBar?.opacity).toBe(80);
    expect(appearance.header?.borderColor).toBe("#E5E0E8");
    expect(appearance.footer).toBeUndefined();
  });
});

describe("the escaping gate", () => {
  // These values are concatenated into a raw <style> tag. The CMS validates
  // them on write; this is the second gate, on read, for a row edited around
  // the admin — a direct SQL update, a restored dump.
  it("refuses anything that is not a plain hex colour", () => {
    for (const bad of [
      "#fff}</style><script>alert(1)</script>",
      "red",
      "rgb(0,0,0)",
      "var(--pdh-plum)",
      "#12345",
      "#GGGGGG",
      "",
      "  ",
      null,
      undefined,
      42,
      {},
    ]) {
      expect(isSafeHex(bad)).toBe(false);
    }
  });

  it("accepts the hex forms the picker produces", () => {
    for (const good of ["#fff", "#FFF", "#5E4074", "#5e4074", "#5E407480"]) {
      expect(isSafeHex(good)).toBe(true);
    }
  });

  it("drops a malformed colour instead of correcting it", () => {
    // Substituting a colour would make a typo look like a deliberate choice.
    // Skipping it lets the component's own fallback stand, which is right.
    const css = chromeAppearanceCss({
      header: { backgroundColor: "#fff}</style><script>x</script>", textColor: "#123456" },
    });
    expect(css).toBe("--chrome-header-text:#123456");
    expect(css).not.toContain("script");
    expect(css).not.toContain("</style>");
  });
});

describe("contrast advisory", () => {
  it("parses the hex forms the picker produces", () => {
    expect(parseHex("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHex("nope")).toBeNull();
  });

  it("computes the known extremes", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    // Order must not matter: this measures a pair, not a direction.
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
  });

  it("passes the storefront's own footer pairing", () => {
    // Cream on the brand brown — what the footer ships today.
    const verdict = judgeContrast("#F7EEE5", "#373020");
    expect(verdict?.passesText).toBe(true);
  });

  it("warns on the mistake this exists to catch", () => {
    // White on beige: the accidental pairing an operator reaches by picking
    // two swatches that look fine side by side in the palette.
    const verdict = judgeContrast("#FFFFFF", "#F7EEE5");
    expect(verdict?.passesText).toBe(false);
    expect(verdict?.passesLarge).toBe(false);
    expect(verdict?.label).toMatch(/insuffisant/i);
  });

  it("separates the large-text band from the body-text one", () => {
    const verdict = judgeContrast("#767676", "#FFFFFF");
    expect(verdict).not.toBeNull();
    expect(verdict!.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("returns null rather than a verdict on an unparseable colour", () => {
    expect(judgeContrast("nope", "#FFFFFF")).toBeNull();
    expect(contrastRatio("#FFFFFF", "not-a-colour")).toBeNull();
  });
});
