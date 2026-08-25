import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Snowflakes } from "@/components/Snowflakes";
import { STORES } from "@/data/stores";

export const metadata: Metadata = {
  title: "Contact — Para d'Hiver",
};

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
const primaryStore = STORES[0];

export default function ContactPage() {
  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 11.5, letterSpacing: ".1em", opacity: 0.55, marginBottom: 18 }}>
        <Link href="/" className="link-hover" style={{ color: "inherit" }}>
          Accueil
        </Link>{" "}
        / Contact
      </nav>

      <div
        style={{
          borderRadius: "clamp(16px,2vw,24px)",
          background: "linear-gradient(120deg,#2f1f3d,var(--pdh-plum) 65%,#4b3563)",
          color: "var(--pdh-cream)",
          padding: "48px clamp(20px,4vw,56px)",
          position: "relative",
          overflow: "hidden",
          marginBottom: 36,
        }}
      >
        <Snowflakes opacity={0.3} />
        <div style={{ position: "relative", maxWidth: "min(100%,860px)" }}>
          <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.8 }}>
            Para d&apos;Hiver
          </div>
          <h1 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(30px,4.6vw,52px)", lineHeight: 1.02, margin: "14px 0 12px" }}>
            Nous contacter
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.75, opacity: 0.8, margin: 0 }}>
            Une question sur un produit, une commande ou nos soins en institut ? Notre équipe vous répond avec plaisir.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,264px),1fr))", gap: "clamp(14px,1.8vw,22px)", marginBottom: "clamp(40px,5vw,64px)" }}>
        {primaryStore?.phone && (
          <a
            href={`tel:${primaryStore.phone.replace(/\s+/g, "")}`}
            className="card-hover"
            style={{ display: "flex", flexDirection: "column", gap: 12, borderRadius: 20, border: "1px solid rgba(94,64,116,.12)", padding: "clamp(20px,2.4vw,28px)", background: "#fff" }}
          >
            <Phone aria-hidden="true" size={22} strokeWidth={1.6} style={{ color: "var(--pdh-plum)" }} />
            <div style={{ fontFamily: "var(--font-jost)", fontSize: 17, color: "var(--pdh-ink)" }}>Téléphone</div>
            <div style={{ fontSize: 13.5, opacity: 0.75 }}>{primaryStore.phone}</div>
          </a>
        )}

        {primaryStore?.email && (
          <a
            href={`mailto:${primaryStore.email}`}
            className="card-hover"
            style={{ display: "flex", flexDirection: "column", gap: 12, borderRadius: 20, border: "1px solid rgba(94,64,116,.12)", padding: "clamp(20px,2.4vw,28px)", background: "#fff" }}
          >
            <Mail aria-hidden="true" size={22} strokeWidth={1.6} style={{ color: "var(--pdh-plum)" }} />
            <div style={{ fontFamily: "var(--font-jost)", fontSize: 17, color: "var(--pdh-ink)" }}>Email</div>
            <div style={{ fontSize: 13.5, opacity: 0.75 }}>{primaryStore.email}</div>
          </a>
        )}

        {WHATSAPP_PHONE && (
          <a
            href={`https://wa.me/${WHATSAPP_PHONE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover"
            style={{ display: "flex", flexDirection: "column", gap: 12, borderRadius: 20, border: "1px solid rgba(94,64,116,.12)", padding: "clamp(20px,2.4vw,28px)", background: "#fff" }}
          >
            <MessageCircle aria-hidden="true" size={22} strokeWidth={1.6} style={{ color: "var(--pdh-plum)" }} />
            <div style={{ fontFamily: "var(--font-jost)", fontSize: 17, color: "var(--pdh-ink)" }}>WhatsApp</div>
            <div style={{ fontSize: 13.5, opacity: 0.75 }}>Réponse rapide, du lundi au samedi</div>
          </a>
        )}
      </div>

      <section>
        <h2 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(24px,3vw,34px)", margin: "0 0 18px" }}>
          Nos magasins
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(14px,1.8vw,22px)" }}>
          {STORES.map((store) => (
            <div
              key={store.name}
              style={{
                border: "1px solid rgba(94,64,116,.14)",
                borderRadius: 20,
                padding: "clamp(20px,2.4vw,28px)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ fontFamily: "var(--font-jost)", fontSize: 20, fontWeight: 400, color: "var(--pdh-ink)" }}>
                {store.name}
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <MapPin aria-hidden="true" size={17} strokeWidth={1.6} style={{ color: "var(--pdh-plum)", flex: "none", marginTop: 2 }} />
                <span style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.8 }}>{store.address}</span>
              </div>

              {store.hours.map((h) => (
                <div key={h.days} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Clock aria-hidden="true" size={17} strokeWidth={1.6} style={{ color: "var(--pdh-plum)", flex: "none", marginTop: 2 }} />
                  <span style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.8 }}>
                    {h.days} · {h.hours}
                  </span>
                </div>
              ))}

              {store.phone && (
                <a
                  href={`tel:${store.phone.replace(/\s+/g, "")}`}
                  className="link-hover"
                  style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--pdh-ink)", alignSelf: "flex-start", maxWidth: "100%" }}
                >
                  <Phone aria-hidden="true" size={17} strokeWidth={1.6} style={{ color: "var(--pdh-plum)", flex: "none" }} />
                  {store.phone}
                </a>
              )}

              {store.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="link-hover"
                  style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--pdh-ink)", alignSelf: "flex-start", maxWidth: "100%" }}
                >
                  <Mail aria-hidden="true" size={17} strokeWidth={1.6} style={{ color: "var(--pdh-plum)", flex: "none" }} />
                  {store.email}
                </a>
              )}

              <a
                href={store.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-plum"
                style={{
                  marginTop: 6,
                  alignSelf: "flex-start",
                  padding: "12px 24px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                }}
              >
                Itinéraire
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
