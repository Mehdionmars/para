/**
 * WCAG contrast, for the advisory shown next to a colour pair.
 *
 * Advisory is the operative word: this warns, it never refuses. An operator
 * running a deliberately low-contrast decorative band is making a choice, and
 * a builder that blocks it is a builder they will work around. What it must
 * not do is let someone set white-on-cream by accident and find out from a
 * customer.
 */

/** #abc, #aabbcc and #aabbccdd all parse; anything else returns null. */
export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.trim();
  if (!/^#[0-9a-fA-F]{3,8}$/.test(value)) return null;
  let body = value.slice(1);
  if (body.length === 3) body = body.split("").map((c) => c + c).join("");
  if (body.length === 4) body = body.slice(0, 3).split("").map((c) => c + c).join("");
  if (body.length === 8) body = body.slice(0, 6);
  if (body.length !== 6) return null;
  return {
    b: parseInt(body.slice(4, 6), 16),
    g: parseInt(body.slice(2, 4), 16),
    r: parseInt(body.slice(0, 2), 16),
  };
}

/** Relative luminance, per WCAG 2.1. */
export function luminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** Contrast ratio between two hex colours, or null if either is unparseable. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastVerdict = {
  ratio: number;
  /** 4.5:1, the floor for body text. */
  passesText: boolean;
  /** 3:1, the floor for large text and UI components. */
  passesLarge: boolean;
  label: string;
};

export function judgeContrast(foreground: string, background: string): ContrastVerdict | null {
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return null;
  const rounded = Math.round(ratio * 100) / 100;
  const passesText = ratio >= 4.5;
  const passesLarge = ratio >= 3;
  return {
    label: passesText
      ? `Bon contraste (${rounded}:1)`
      : passesLarge
        ? `Contraste limite (${rounded}:1) — lisible en grand seulement`
        : `Contraste insuffisant (${rounded}:1)`,
    passesLarge,
    passesText,
    ratio: rounded,
  };
}
