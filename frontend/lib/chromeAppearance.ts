/**
 * Operator-chosen colours for the three surfaces that appear on every page:
 * the top bar, the header and the footer.
 *
 * The contract, and the reason every field is optional all the way down:
 *
 *   **An unset colour must produce no CSS at all.** The storefront's existing
 *   palette stays where it is — in the components, as the fallback half of
 *   `var(--chrome-header-bg, rgba(255,255,255,.93))`. A shop that never opens
 *   the appearance panel renders byte-for-byte what it rendered before this
 *   existed, and there is no migration, no backfill and no default row that
 *   could pin the design to whatever it happened to be on release day.
 *
 * The variables are emitted into the same inline `<style>` block that already
 * carries the theme (see app/(site)/layout.tsx) rather than a second one:
 * that block is the single place a value is concatenated into raw CSS, which
 * is exactly why it is also the single place the escaping is enforced.
 */

export type ChromeSurfaceColors = {
  backgroundColor?: string | null;
  textColor?: string | null;
  headingColor?: string | null;
  linkColor?: string | null;
  hoverColor?: string | null;
  iconColor?: string | null;
  borderColor?: string | null;
  /** Top bar only. Percent, 0–100. */
  opacity?: number | null;
};

export type ChromeAppearance = {
  topBar?: ChromeSurfaceColors | null;
  header?: ChromeSurfaceColors | null;
  footer?: ChromeSurfaceColors | null;
};

/** Every variable this system can emit, with the surface and field it comes
 * from. One table, so the CSS name, the CMS field and the dashboard control
 * can never drift apart. */
export const CHROME_VARS = {
  topBar: {
    backgroundColor: "--chrome-topbar-bg",
    textColor: "--chrome-topbar-text",
    linkColor: "--chrome-topbar-link",
    hoverColor: "--chrome-topbar-hover",
  },
  header: {
    backgroundColor: "--chrome-header-bg",
    textColor: "--chrome-header-text",
    linkColor: "--chrome-header-link",
    hoverColor: "--chrome-header-hover",
    iconColor: "--chrome-header-icon",
    borderColor: "--chrome-header-border",
  },
  footer: {
    backgroundColor: "--chrome-footer-bg",
    textColor: "--chrome-footer-text",
    headingColor: "--chrome-footer-heading",
    linkColor: "--chrome-footer-link",
    hoverColor: "--chrome-footer-hover",
    iconColor: "--chrome-footer-icon",
    borderColor: "--chrome-footer-border",
  },
} as const satisfies Record<keyof ChromeAppearance, Partial<Record<keyof ChromeSurfaceColors, string>>>;

// The four lengths CSS actually accepts. `{3,8}` would let "#12345" through:
// a browser drops it, but it would still have been concatenated into the
// style tag, and a value this gate lets past is a value nobody re-checks.
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** True only for a value safe to concatenate into a `<style>` tag. The CMS
 * validates the same shape on write; this is the second gate, on read, so a
 * row edited around the admin (a direct SQL update, a restored dump) still
 * cannot break out of the tag. */
export function isSafeHex(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_RE.test(value);
}

/**
 * The CSS declarations for one configuration — `""` when nothing is set.
 *
 * Returns declarations, not a rule, so the caller decides the selector. An
 * unset or malformed value is skipped entirely rather than emitted as an
 * empty or corrected one: the component's own fallback is the correct
 * behaviour for "not configured", and silently substituting a colour would
 * make a typo look like a choice.
 */
export function chromeAppearanceCss(appearance: ChromeAppearance | null | undefined): string {
  if (!appearance) return "";
  const out: string[] = [];

  for (const surface of Object.keys(CHROME_VARS) as (keyof typeof CHROME_VARS)[]) {
    const colors = appearance[surface];
    if (!colors) continue;
    const vars = CHROME_VARS[surface] as Partial<Record<keyof ChromeSurfaceColors, string>>;

    for (const field of Object.keys(vars) as (keyof ChromeSurfaceColors)[]) {
      const value = colors[field];
      const cssVar = vars[field];
      if (cssVar && isSafeHex(value)) out.push(`${cssVar}:${value}`);
    }
  }

  // Opacity is the top bar's alone, and a number rather than a colour, so it
  // gets its own clamp instead of the hex gate.
  const topBarOpacity = appearance.topBar?.opacity;
  if (typeof topBarOpacity === "number" && Number.isFinite(topBarOpacity)) {
    const clamped = Math.min(100, Math.max(0, topBarOpacity));
    out.push(`--chrome-topbar-opacity:${clamped / 100}`);
  }

  return out.join(";");
}

/** Reads the raw Payload groups into the shape above. Absent groups and
 * empty strings both mean "not configured" and become undefined, so a field
 * cleared in the dashboard stops emitting rather than emitting "". */
export function toChromeAppearance(raw: {
  topBarAppearance?: unknown;
  headerAppearance?: unknown;
  footerAppearance?: unknown;
}): ChromeAppearance {
  const surface = (value: unknown): ChromeSurfaceColors | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const row = value as Record<string, unknown>;
    const pick = (key: string) => (typeof row[key] === "string" && row[key] ? (row[key] as string) : undefined);
    const opacityRaw = row.opacity;
    const opacity =
      opacityRaw === null || opacityRaw === undefined || opacityRaw === "" ? undefined : Number(opacityRaw);

    const result: ChromeSurfaceColors = {
      backgroundColor: pick("backgroundColor"),
      borderColor: pick("borderColor"),
      headingColor: pick("headingColor"),
      hoverColor: pick("hoverColor"),
      iconColor: pick("iconColor"),
      linkColor: pick("linkColor"),
      opacity: Number.isFinite(opacity) ? opacity : undefined,
      textColor: pick("textColor"),
    };
    return Object.values(result).some((v) => v !== undefined) ? result : undefined;
  };

  return {
    footer: surface(raw.footerAppearance),
    header: surface(raw.headerAppearance),
    topBar: surface(raw.topBarAppearance),
  };
}
