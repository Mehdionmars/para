import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { InstitutionalDocument } from "@/components/institutional/InstitutionalDocument";
import { fetchInstitutionalPage } from "@/lib/storefront/institutional";
import { institutionalMetadata } from "@/lib/storefront/seo";
import { fetchShippingOptions, formatShippingPrice } from "@/lib/storefront/shipping";

const SLUG = "livraison" as const;
const TITLE = "Livraison";

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata(
    SLUG,
    TITLE,
    "/livraison",
    "Frais et zones de livraison Para d'Hiver, partout au Maroc.",
  );
}

/**
 * The tariff grid, read live from the same rows checkout bills against.
 *
 * Cards rather than a <table>: a five-column table of cities is the classic
 * source of horizontal overflow on a phone, and the auto-fit grid used
 * everywhere else on this site collapses to one column on its own with no
 * media query and no fixed width.
 */
function ShippingGrid({
  options,
}: {
  options: { city: string; price: number; freeFrom: number | null; isDefault: boolean }[];
}) {
  return (
    <section style={{ margin: "0 0 36px" }} aria-labelledby="tarifs">
      <h2
        id="tarifs"
        style={{
          fontFamily: "var(--font-alta)",
          fontWeight: 200,
          fontSize: "clamp(22px,2.6vw,30px)",
          color: "var(--pdh-ink)",
          margin: "0 0 6px",
        }}
      >
        Frais de livraison
      </h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.7, opacity: 0.7, margin: "0 0 20px", maxWidth: "62ch" }}>
        Ces tarifs sont ceux appliqués au moment de votre commande.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,232px),1fr))",
          gap: "clamp(12px,1.6vw,18px)",
        }}
      >
        {options.map((opt) => (
          <div
            key={opt.city}
            style={{
              border: "1px solid rgba(94,64,116,.14)",
              borderRadius: 20,
              padding: "clamp(18px,2.2vw,24px)",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Truck aria-hidden="true" size={17} strokeWidth={1.6} style={{ color: "var(--pdh-plum)", flex: "none" }} />
              <span style={{ fontFamily: "var(--font-alta)", fontSize: 17, color: "var(--pdh-ink)" }}>{opt.city}</span>
            </div>

            <div style={{ fontSize: 22, fontFamily: "var(--font-alta)", color: "var(--pdh-plum)" }}>
              {formatShippingPrice(opt.price)}
            </div>

            {opt.freeFrom !== null && (
              // One interpolation, not `{value} MAD`: JSX drops the space
              // between an expression and the text after it when the line is
              // wrapped, and the first render of this card read "399MAD".
              <div style={{ fontSize: 12.5, lineHeight: 1.6, opacity: 0.75 }}>
                {`Offerte à partir de ${opt.freeFrom} MAD d'achat`}
              </div>
            )}

            {opt.isDefault && (
              <div
                style={{
                  marginTop: 2,
                  alignSelf: "flex-start",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--pdh-plum-border)",
                  fontSize: 10.5,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--pdh-plum)",
                }}
              >
                Autres villes
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function LivraisonPage() {
  const [page, options] = await Promise.all([fetchInstitutionalPage(SLUG), fetchShippingOptions()]);

  return (
    <InstitutionalDocument
      page={page}
      fallbackTitle={TITLE}
      lede="Nous livrons partout au Maroc. Les frais dépendent de votre ville et de vos achats."
    >
      {options.length > 0 && <ShippingGrid options={options} />}
    </InstitutionalDocument>
  );
}
