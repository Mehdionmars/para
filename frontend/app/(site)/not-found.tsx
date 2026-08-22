import Link from "next/link";
import { routes } from "@/lib/routes";

/** Rendered by any `notFound()` inside the (site) route group — most often a
 * `/produit/<slug>` that doesn't match a real product. Lives here rather
 * than at the app root so it keeps the storefront chrome (header, nav,
 * footer) and stays in French, instead of falling back to Next's bare
 * default 404 page. */
export default function SiteNotFound() {
  return (
    <div
      style={{
        maxWidth: "min(720px,100%)",
        margin: "0 auto",
        padding: "clamp(56px,8vw,120px) clamp(14px,3.4vw,32px)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-poppins)",
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--pdh-teal)",
          margin: "0 0 14px",
        }}
      >
        Erreur 404
      </p>

      <h1
        style={{
          fontFamily: "var(--font-jost)",
          fontWeight: 300,
          fontSize: "clamp(28px,4.4vw,44px)",
          color: "var(--pdh-plum)",
          margin: "0 0 16px",
          lineHeight: 1.2,
        }}
      >
        Cette page est introuvable
      </h1>

      <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.7, margin: "0 0 32px" }}>
        Le produit ou la page que vous cherchez n&apos;existe pas, ou n&apos;est plus disponible.
        Parcourez notre catalogue pour trouver le soin qu&apos;il vous faut.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <Link
          href={routes.catalogue()}
          style={{
            display: "inline-block",
            padding: "13px 28px",
            borderRadius: "var(--pdh-btn-radius)",
            background: "var(--pdh-btn-bg)",
            color: "var(--pdh-btn-text)",
            fontFamily: "var(--font-poppins)",
            fontSize: 13,
            fontWeight: "var(--pdh-btn-weight)" as unknown as number,
            letterSpacing: "var(--pdh-btn-tracking)",
            textTransform: "uppercase",
          }}
        >
          Voir le catalogue
        </Link>

        <Link
          href={routes.home()}
          style={{
            display: "inline-block",
            padding: "13px 28px",
            borderRadius: "var(--pdh-btn-radius)",
            border: "1px solid rgba(94,64,116,.24)",
            color: "var(--pdh-plum)",
            fontFamily: "var(--font-poppins)",
            fontSize: 13,
            fontWeight: "var(--pdh-btn-weight)" as unknown as number,
            letterSpacing: "var(--pdh-btn-tracking)",
            textTransform: "uppercase",
          }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
