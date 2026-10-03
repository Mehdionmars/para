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
          padding: "8px 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,208px),1fr))",
          gap: 24,
        }}
      >
        {items.map((badge) => (
          <div className="trust-badge" key={badge.title} role="listitem" style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pdh-plum)", flex: "none" }}>
              <badge.icon aria-hidden="true" size={26} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 500 }}>{badge.title}</div>
              {/* Was 10.5px at opacity .55 — measured 3.30:1 on this bar's own
                  white ground, the worst text on the home page. The claims
                  underneath these four icons (livraison, paiement, circuit
                  pharmaceutique, pharmaciens 7j/7) are the page's proof that
                  the shop is real; they were the least legible thing on it. */}
              <div style={{ fontSize: 13.5, color: "var(--pdh-ink-soft)", marginTop: 5 }}>{badge.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
