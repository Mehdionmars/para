import type { LucideIcon } from "lucide-react";
import { TRUST_BADGES } from "@/data/home";

type TrustBadge = { title: string; sub: string; icon: LucideIcon };

export function TrustBar({ badges }: { badges?: TrustBadge[] } = {}) {
  const items = badges ?? TRUST_BADGES;
  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,0px) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
      <div
        className="trust-bar"
        role="list"
        style={{
          border: "1px solid rgba(94,64,116,.1)",
          borderRadius: 18,
          padding: "16px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,208px),1fr))",
          gap: 16,
          background: "#fff",
        }}
      >
        {items.map((badge) => (
          <div className="trust-badge" key={badge.title} role="listitem" style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(94,64,116,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pdh-plum)", flex: "none" }}>
              <badge.icon aria-hidden="true" size={16} strokeWidth={1.6} />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{badge.title}</div>
              <div style={{ fontSize: 10.5, opacity: 0.55 }}>{badge.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
