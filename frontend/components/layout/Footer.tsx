import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { PaymentBadges } from "@/components/layout/PaymentBadges";
import { INSTAGRAM_SECTION } from "@/data/home";
import { FOOTER_COLUMNS, type FooterColumn } from "@/data/siteChrome";
import { STORES } from "@/data/stores";

/**
 * Legal notices.
 *
 * These three were a single hard-coded string of plain text — legally
 * required documents that no one could open. They are a list now, and each
 * one becomes a real link the moment `href` is filled in.
 *
 * The hrefs are deliberately absent: /mentions-legales, /confidentialite and
 * /cgv do not exist yet, and pointing at them would trade dead text for a
 * 404. The documents themselves are legal copy for the pharmacy to supply —
 * not something to generate.
 */
const LEGAL: { label: string; href?: string }[] = [
  { label: "Mentions légales" },
  { label: "Politique de confidentialité" },
  { label: "CGV" },
];

/**
 * This lucide version ships no brand marks, and the one other place that
 * needed Instagram settled for a generic camera. Drawn here on lucide's own
 * 24x24 grid with the same stroke weight as the icons beside it, so the row
 * reads as one icon family rather than a camera standing in for a logo.
 */
function InstagramMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/** "06 19 96 90 07" -> "+212619969007" for the tel: href. */
function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`}`;
}

function ContactRow({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <Icon aria-hidden="true" size={15} strokeWidth={1.7} style={{ flex: "none", marginTop: 3, opacity: 0.65 }} />
      <span style={{ minWidth: 0 }}>{children}</span>
    </li>
  );
}

export function Footer({ columns = FOOTER_COLUMNS }: { columns?: FooterColumn[] } = {}) {
  const store = STORES[0];
  // "Horaires à compléter / —" is the unset state of the CMS field. An
  // opening time nobody has filled in is worse than no opening time, so the
  // block only appears once it says something.
  const hours = store?.hours?.filter((h) => h.hours && h.hours !== "—") ?? [];
  const instagramUrl = INSTAGRAM_SECTION.ctaUrl;

  return (
    // Every colour still falls back through --chrome-footer-*, so the
    // Storefront Builder's appearance panel keeps full control. The default
    // moved from --pdh-ink (a warm brown that belonged to no other surface)
    // to the brand's own darkest shade, which is what the hero overlays and
    // CTA scrims are already built from.
    <footer
      className="site-footer"
      style={{
        background: "var(--chrome-footer-bg, var(--pdh-plum-dark))",
        color: "var(--chrome-footer-text, var(--pdh-cream))",
        borderTop: "3px solid var(--pdh-teal)",
        padding: "clamp(44px,5vw,68px) 0 24px",
      }}
    >
      <div
        className="footer-grid"
        style={{
          maxWidth: "min(1280px,100%)",
          margin: "0 auto",
          padding: "0 clamp(14px,3.4vw,32px)",
          display: "grid",
          // Two tracks, not one flat auto-fit run: the brand and contact
          // block is a different kind of thing from a list of links, and
          // sharing one 168px column with them left it cramped at every
          // width. The link columns keep their own auto-fit grid inside.
          gridTemplateColumns: "minmax(250px,1.5fr) minmax(0,2.5fr)",
          gap: "clamp(32px,4vw,64px)",
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: 36, lineHeight: 0.9, letterSpacing: "-.05em" }}>
            PD
          </div>
          <div style={{ fontFamily: "var(--font-alta)", fontWeight: 300, fontSize: 10, letterSpacing: ".34em", marginTop: 4 }}>
            PARA D&apos;HIVER
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.8, opacity: 0.72, maxWidth: 300, margin: "16px 0 0" }}>
            Parapharmacie en ligne. Produits authentiques, conseils de pharmaciens, livraison partout au Maroc.
          </p>

          {store && (
            <address style={{ fontStyle: "normal", margin: "26px 0 0" }}>
              <h2
                style={{
                  color: "var(--chrome-footer-heading, inherit)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: ".18em",
                  margin: "0 0 12px",
                  opacity: 0.72,
                  textTransform: "uppercase",
                }}
              >
                Nous contacter
              </h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, lineHeight: 1.6, opacity: 0.85 }}>
                <ContactRow icon={MapPin}>
                  <a className="chrome-footer-link" href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                    {store.address}
                  </a>
                </ContactRow>
                <ContactRow icon={Phone}>
                  <a className="chrome-footer-link" href={telHref(store.phone)}>
                    {store.phone}
                  </a>
                </ContactRow>
                <ContactRow icon={Mail}>
                  <a className="chrome-footer-link" href={`mailto:${store.email}`} style={{ wordBreak: "break-word" }}>
                    {store.email}
                  </a>
                </ContactRow>
                {hours.map((h) => (
                  <ContactRow key={h.days} icon={Phone}>
                    {h.days} · {h.hours}
                  </ContactRow>
                ))}
              </ul>
            </address>
          )}

          {instagramUrl && (
            <a
              className="chrome-footer-link footer-social"
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Para d'Hiver sur Instagram (@${INSTAGRAM_SECTION.username})`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                marginTop: 22,
                padding: "9px 16px 9px 13px",
                borderRadius: 999,
                border: "1px solid rgba(247,238,229,.22)",
                fontSize: 12,
                letterSpacing: ".04em",
              }}
            >
              <InstagramMark />
              @{INSTAGRAM_SECTION.username}
            </a>
          )}

          <div style={{ marginTop: 26 }}>
            <PaymentBadges tone="footer" />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,140px),1fr))",
            gap: "clamp(20px,2.6vw,36px)",
          }}
        >
          {columns.map((col) => (
            <div key={col.title}>
              <h2
                style={{
                  color: "var(--chrome-footer-heading, inherit)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: ".18em",
                  margin: "0 0 14px",
                  opacity: 0.72,
                  textTransform: "uppercase",
                }}
              >
                {col.title}
              </h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link className="chrome-footer-link" href={link.href} style={{ fontSize: 12.5, opacity: 0.85 }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div
        className="footer-baseline"
        style={{
          maxWidth: "min(1280px,100%)",
          margin: "clamp(34px,4vw,48px) auto 0",
          padding: "18px clamp(14px,3.4vw,32px) 0",
          borderTop: "1px solid var(--chrome-footer-border, rgba(247,238,229,.15))",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px 20px",
          fontSize: 11.5,
          opacity: 0.7,
        }}
      >
        {/* Computed, not typed. The year was written into the markup, so on
            1 January it would have started showing the wrong one — silently,
            in the one line of the page nobody re-reads. */}
        <span>© {new Date().getFullYear()} Para d&apos;Hiver — Casablanca, Maroc</span>
        <ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "6px 18px", margin: 0, padding: 0 }}>
          {LEGAL.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link className="chrome-footer-link" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                item.label
              )}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
