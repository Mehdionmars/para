import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { SERVICES_TEASER } from "@/data/home";

type ServiceCard = { title: string; sub: string; cta: string; href: string; icon: LucideIcon };

export function ServicesTeaser({ cards: cardsProp }: { cards?: ServiceCard[] } = {}) {
  const cards = cardsProp ?? SERVICES_TEASER;
  if (cards.length === 0) return null;

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <div style={{ background: "var(--pdh-sand)", borderRadius: "clamp(16px,2vw,24px)", padding: "clamp(24px,3.2vw,40px)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
              Accompagnement
            </div>
            <h2 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(25px,3.2vw,38px)", margin: "8px 0 0" }}>Nos services</h2>
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>Nos pharmaciens vous accompagnent, en ligne comme en institut.</div>
          </div>
          <Link
            href="/services"
            className="link-hover"
            style={{ flex: "none", whiteSpace: "nowrap", fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pdh-plum)", borderBottom: "1px solid rgba(94,64,116,.35)", paddingBottom: 3 }}
          >
            Tous nos services
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,208px),1fr))", gap: "clamp(12px,1.6vw,18px)" }}>
          {cards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="card-hover"
              style={{
                background: "#fff",
                border: "1px solid rgba(94,64,116,.1)",
                borderRadius: 18,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                color: "inherit",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(94,64,116,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pdh-plum)" }}>
                <c.icon aria-hidden="true" size={20} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.65, opacity: 0.65 }}>{c.sub}</div>
              <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pdh-teal)", marginTop: "auto" }}>{c.cta} →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
