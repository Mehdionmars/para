import { Star } from "lucide-react";
import { stars, type Product } from "@/data/products";

export function ProductReviews({ product }: { product: Product }) {
  const hasReviews = product.reviews > 0;

  return (
    <div
      style={{
        marginTop: "clamp(34px,5vw,60px)",
        background: "var(--pdh-cream)",
        borderRadius: "clamp(16px,2vw,24px)",
        padding: "clamp(22px,3vw,36px)",
      }}
    >
      {hasReviews ? (
        <div>
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
            Avis vérifiés
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 10 }}>
            <span style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(34px,4vw,46px)", color: "var(--pdh-plum)" }}>
              {product.rating.toFixed(1).replace(".", ",")}
            </span>
            <span style={{ fontSize: 13, opacity: 0.6 }}>/ 5 · {product.reviews} avis</span>
          </div>
          <div style={{ color: "var(--pdh-teal-text)", letterSpacing: ".14em", marginTop: 6 }}>{stars(product.rating)}</div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "clamp(20px,3vw,32px) 10px" }}>
          <div
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(94,64,116,.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--pdh-plum)",
              margin: "0 auto 16px",
            }}
          >
            <Star aria-hidden="true" size={20} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(18px,2.2vw,22px)", fontWeight: 300, marginBottom: 6 }}>
            Aucun avis pour le moment
          </div>
          <p style={{ fontSize: 13, opacity: 0.6, maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
            Soyez la première ou le premier à partager votre avis sur ce produit.
          </p>
        </div>
      )}
    </div>
  );
}
