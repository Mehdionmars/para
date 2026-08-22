import Link from "next/link";
import { PaymentBadges } from "@/components/layout/PaymentBadges";
import { FOOTER_COLUMNS, type FooterColumn } from "@/data/siteChrome";

export function Footer({ columns = FOOTER_COLUMNS }: { columns?: FooterColumn[] } = {}) {
  return (
    // Every colour falls back to what the footer rendered before the
    // appearance panel existed, so an unconfigured shop is unchanged.
    <footer
      style={{
        background: "var(--chrome-footer-bg, var(--pdh-ink))",
        color: "var(--chrome-footer-text, var(--pdh-cream))",
        padding: "60px 0 24px",
      }}
    >
      <div
        style={{
          maxWidth: "min(1280px,100%)",
          margin: "0 auto",
          padding: "0 clamp(14px,3.4vw,32px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,168px),1fr))",
          gap: "clamp(20px,2.8vw,40px)",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: 36, lineHeight: 0.9, letterSpacing: "-.05em" }}>
            PD
          </div>
          <div style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: 10, letterSpacing: ".34em", marginTop: 4 }}>
            PARA D&apos;HIVER
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.8, opacity: 0.6, maxWidth: 270, margin: "16px 0 0" }}>
            Parapharmacie en ligne. Produits authentiques, conseils de pharmaciens, livraison partout au Maroc.
          </p>
          <div style={{ marginTop: 22 }}>
            <PaymentBadges tone="footer" />
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <div
              style={{
                color: "var(--chrome-footer-heading, inherit)",
                fontSize: 10.5,
                letterSpacing: ".18em",
                marginBottom: 14,
                opacity: 0.55,
                textTransform: "uppercase",
              }}
            >
              {col.title}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link className="chrome-footer-link" href={link.href} style={{ fontSize: 12.5, opacity: 0.8 }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: "min(1280px,100%)",
          margin: "34px auto 0",
          padding: "18px clamp(14px,3.4vw,32px) 0",
          borderTop: "1px solid var(--chrome-footer-border, rgba(247,238,229,.15))",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 11.5,
          opacity: 0.55,
        }}
      >
        <span>© 2026 Para d&apos;Hiver — Casablanca, Maroc</span>
        <span>Mentions légales · Politique de confidentialité · CGV</span>
      </div>
    </footer>
  );
}
