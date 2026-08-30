import type { Metadata } from "next";
import Link from "next/link";
import { OrderTracker } from "@/components/orders/OrderTracker";

export const metadata: Metadata = {
  description:
    "Suivez l'avancement de votre commande Para d'Hiver avec votre numéro de commande et votre email.",
  title: "Suivi de commande",
};

export default function OrderTrackingPage() {
  return (
    <div style={{ maxWidth: "min(1080px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, letterSpacing: ".02em", marginBottom: 16 }}>
        <Link href="/" className="link-hover" style={{ color: "inherit", opacity: 0.55 }}>
          Accueil
        </Link>{" "}
        <span style={{ opacity: 0.4 }}>/</span> <span style={{ fontWeight: 600 }}>Suivi de commande</span>
      </nav>

      <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(28px,3.8vw,44px)", margin: "0 0 12px" }}>
        Suivi de commande
      </h1>
      <p style={{ fontSize: 14.5, opacity: 0.7, maxWidth: 560, margin: "0 0 clamp(24px,3vw,36px)", lineHeight: 1.6 }}>
        Entrez votre numéro de commande et l&apos;email utilisé lors de l&apos;achat pour voir où en est
        votre colis.
      </p>

      <OrderTracker />
    </div>
  );
}
