import Link from "next/link";
import type { CSSProperties } from "react";
import { PaymentBadges } from "@/components/layout/PaymentBadges";
import { INSTAGRAM_SECTION } from "@/data/home";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { FOOTER_COLUMNS, LOGO, type FooterColumn, type Logo } from "@/data/siteChrome";
import { STORES } from "@/data/stores";

/**
 * Legal notices.
 *
 * Each route answers 200 whether or not the pharmacy has published the
 * document yet: an unwritten page renders "en cours de publication" with a way
 * to reach a human, and marks itself noindex until it has content. So a link
 * is always better than dead text.
 */
const LEGAL: { label: string; href: string }[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-confidentialite", label: "Politique de confidentialité" },
  { href: "/cgv", label: "CGV" },
];

/** "06 19 96 90 07" -> "+212619969007" for the tel: href. */
function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`}`;
}

/**
 * A light, editorial footer: a line about the shop and the counter's address
 * on top, the link columns in the middle, the legal line at the bottom with
 * the badge drawn large in the corner.
 *
 * The top-right slot is the counter, not an email sign-up: there is no
 * newsletter endpoint, and a field that stores nothing would be a promise the
 * shop cannot keep. The address in a hairline field with "Itinéraire" beside
 * it takes the same shape and leads somewhere real.
 *
 * Every colour still falls back through --chrome-footer-*, so the Storefront
 * Builder's appearance panel keeps full control.
 */
export function Footer({ columns = FOOTER_COLUMNS, logo = LOGO }: { columns?: FooterColumn[]; logo?: Logo } = {}) {
  const store = STORES[0];
  // "Horaires à compléter / —" is the unset state of the CMS field. An
  // opening time nobody has filled in is worse than no opening time.
  const hours = store?.hours?.filter((h) => h.hours && h.hours !== "—") ?? [];
  const instagramUrl = INSTAGRAM_SECTION.ctaUrl;
  const colCount = columns.length + (instagramUrl ? 1 : 0);

  return (
    <footer className="site-footer pdh-footer">
      <div className="pdh-footer-inner">
        <div className="pdh-footer-top">
          <p className="pdh-footer-intro">
            Para d&apos;Hiver est une parapharmacie à Aïn Sebaâ, Casablanca. Des produits authentiques, venus du circuit
            pharmaceutique, des pharmaciens joignables 7j/7, et une livraison partout au Maroc.
          </p>

          {store && (
            <div className="pdh-footer-reach">
              <div className="pdh-footer-field">
                <address className="pdh-footer-address">{store.address}</address>
                <a className="pdh-footer-btn" href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                  Itinéraire
                </a>
              </div>
              <p className="pdh-footer-fine">
                Appelez le{" "}
                <a className="pdh-footer-inline" href={telHref(store.phone)}>
                  {store.phone}
                </a>{" "}
                ou écrivez à{" "}
                <a className="pdh-footer-inline" href={`mailto:${store.email}`}>
                  {store.email}
                </a>
                .
                {hours.map((h) => (
                  <span key={h.days}>
                    {" "}
                    {h.days} · {h.hours}.
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        <nav
          aria-label="Pied de page"
          className="footer-cols pdh-footer-cols"
          // Only the column count is passed inline, because CSS cannot count
          // children; the grid itself lives in globals.css.
          style={{ "--footer-col-count": colCount } as CSSProperties}
        >
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="pdh-footer-heading">{col.title}</h2>
              <ul className="pdh-footer-list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link className="chrome-footer-link" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {instagramUrl && (
            <div>
              <h2 className="pdh-footer-heading">Suivez-nous</h2>
              <ul className="pdh-footer-list">
                <li>
                  <a className="chrome-footer-link" href={instagramUrl} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <div className="pdh-footer-bottom">
          <div className="pdh-footer-legal">
            <div className="pdh-footer-pay">
              <span className="pdh-footer-heading">Paiement sécurisé</span>
              <PaymentBadges showLabel={false} />
            </div>
            <div className="pdh-footer-baseline">
              {/* Computed, not typed, so 1 January never shows last year. */}
              <span>© {new Date().getFullYear()} Para d&apos;Hiver. Casablanca, Maroc.</span>
              <ul>
                {LEGAL.map((item) => (
                  <li key={item.label}>
                    <Link className="chrome-footer-link" href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link href={logo.href} aria-label="Para d'Hiver — Accueil" className="pdh-footer-mark">
            <span className="pdh-footer-badge">
              {/* The header mark: it is drawn for a light ground, which this
                  footer now is. */}
              <CloudinaryImage preset="brand" src={logo.img} alt="" fill sizes="(max-width: 899px) 120px, 200px" style={{ objectFit: "contain" }} />
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
