import { TOPBAR_CONFIG, type TopBarConfig } from "@/data/siteChrome";

/** Scrolling ticker shown above the header on desktop/tablet. Purely
 * decorative, so it's hidden from assistive tech. On mobile the scroll is
 * replaced with a single static, centered message — a moving ticker in a
 * ~36px strip is hard to read on a phone, and the full message list doesn't
 * fit without scrolling anyway. Content is global chrome, edited from the
 * Storefront Builder's "Global" tab — same on every route. */
export function TopBar({ config = TOPBAR_CONFIG }: { config?: TopBarConfig } = {}) {
  if (!config.enabled || config.messages.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        // Each falls back to exactly what this bar rendered before the
        // appearance panel existed, so an unconfigured shop is unchanged.
        background: "var(--chrome-topbar-bg, var(--pdh-ink))",
        color: "var(--chrome-topbar-text, var(--pdh-cream))",
        opacity: "var(--chrome-topbar-opacity, 1)" as unknown as number,
        height: 36,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        fontSize: 11,
        letterSpacing: ".14em",
        textTransform: "uppercase",
      }}
    >
      <div
        className="topbar-marquee"
        style={{
          display: "flex",
          gap: 64,
          whiteSpace: "nowrap",
          animation: `marquee ${config.marqueeSpeedSec}s linear infinite`,
          paddingLeft: 64,
        }}
      >
        {[...config.messages, ...config.messages].map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
      <div className="topbar-mobile-message" style={{ width: "100%", textAlign: "center" }}>
        {config.mobileMessage}
      </div>
    </div>
  );
}
