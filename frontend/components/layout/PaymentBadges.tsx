import Image from "next/image";

/**
 * The payment methods Para d'Hiver actually accepts, shown in the footer and
 * at checkout. Two only: CMI (the Moroccan interbank gateway handling
 * card payments) and cash on delivery, which is still how most Moroccan
 * e-commerce orders are paid.
 *
 * Deliberately not a generic "we take every card" strip — listing a method
 * the store can't actually process is a broken promise at checkout.
 */

type Props = {
  /** "footer" inverts the colors for the dark footer background. */
  tone?: "footer" | "light";
  /** Hidden when the surrounding block already has a heading. */
  showLabel?: boolean;
};

export function PaymentBadges({ tone = "light", showLabel = true }: Props) {
  const isFooter = tone === "footer";
  const labelColor = isFooter ? "rgba(247,238,229,.55)" : "var(--pdh-muted)";
  // No chip background: the CMI logo is already a self-contained lockup on
  // white, and boxing it (plus the cash-on-delivery pill) added two floating
  // rectangles that read as clutter against the footer. Only the logo keeps
  // a light plate, because its artwork needs one to stay legible on dark.
  const codColor = isFooter ? "rgba(247,238,229,.82)" : "var(--pdh-plum)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {showLabel && (
        <div style={{ fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", color: labelColor }}>
          Paiement sécurisé
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        {/* Source is 150x118 (ratio ~1.27) — the intrinsic size must match or
            the logo distorts. */}
        <Image
          src="/assets/payment-cmi.png"
          alt="CMI — paiement par carte bancaire sécurisé"
          width={41}
          height={32}
          style={{ objectFit: "contain" }}
        />

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: codColor,
            fontSize: 11.5,
            fontWeight: 500,
            letterSpacing: ".02em",
            whiteSpace: "nowrap",
          }}
        >
          <Image
            src="/assets/trust-delivery.svg"
            alt=""
            width={17}
            height={17}
            aria-hidden="true"
            // The icon is a currentColor outline drawn dark; on the footer's
            // dark ground it needs inverting to stay visible.
            style={isFooter ? { filter: "invert(1) opacity(.82)" } : undefined}
          />
          Paiement à la livraison
        </span>
      </div>
    </div>
  );
}
