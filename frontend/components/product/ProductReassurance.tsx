import Image from "next/image";

/**
 * Compact reassurance strip shown under the buy button on a product page —
 * the point where a shopper hesitates and wants to know about authenticity,
 * delivery and payment before committing.
 *
 * Separate from the homepage TrustBar on purpose: that one is CMS-driven
 * (an editor picks its lucide icons in the Storefront Builder), while this
 * states fixed commercial facts that apply to every product and shouldn't
 * drift per campaign.
 */

const ITEMS = [
  { icon: "/assets/trust-authentic.svg", title: "Produits authentiques", sub: "Circuit pharmaceutique officiel" },
  { icon: "/assets/trust-delivery.svg", title: "Livraison partout au Maroc", sub: "24h à Casablanca, 48h ailleurs" },
  { icon: "/assets/trust-secure.svg", title: "Paiement sécurisé", sub: "CMI ou à la livraison" },
  { icon: "/assets/trust-advice.svg", title: "Conseil pharmacien", sub: "Une question ? On vous répond" },
] as const;

export function ProductReassurance() {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "26px 0 0",
        padding: "18px 20px",
        border: "1px solid rgba(94,64,116,.14)",
        borderRadius: 16,
        background: "var(--pdh-cream)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))",
        gap: 16,
      }}
    >
      {ITEMS.map((item) => (
        <li key={item.title} style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--pdh-plum)",
              flex: "none",
            }}
          >
            <Image src={item.icon} alt="" width={17} height={17} />
          </span>
          <span>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 500 }}>{item.title}</span>
            <span style={{ display: "block", fontSize: 10.5, opacity: 0.6, marginTop: 1 }}>{item.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
