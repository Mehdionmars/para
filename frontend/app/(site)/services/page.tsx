import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { Snowflakes } from "@/components/Snowflakes";
import { servicePriceLabel } from "@/data/services";
import { fetchServices } from "@/lib/storefront/services";
import { fetchStores } from "@/lib/storefront/stores";

export const metadata: Metadata = {
  title: "Services — Para d'Hiver",
};

export default async function ServicesPage() {
  const [SERVICES, STORES] = await Promise.all([fetchServices(), fetchStores()]);
  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 11.5, letterSpacing: ".1em", opacity: 0.55, marginBottom: 18 }}>
        <Link href="/" className="link-hover" style={{ color: "inherit" }}>
          Accueil
        </Link>{" "}
        / Services
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
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.8 }}>
            Institut Para d&apos;Hiver
          </div>
          <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(30px,4.6vw,52px)", lineHeight: 1.02, margin: "14px 0 12px" }}>
            Nos services en institut
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.75, opacity: 0.8, margin: 0 }}>
            Diagnostic de peau, soins visage, conseils personnalisés : réservez un créneau avec nos expertes en moins d&apos;une minute.
          </p>
        </div>
      </div>

      <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,264px),1fr))", gap: "clamp(14px,1.8vw,22px)" }}>
        {SERVICES.map((service, i) => (
          <Link
            key={service.id}
            href={`/services/${service.id}`}
            role="listitem"
            className="card-hover"
            style={{
              borderRadius: 20,
              border: "1px solid rgba(94,64,116,.12)",
              overflow: "hidden",
              background: "#fff",
              display: "block",
              animation: "rise .5s both",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div style={{ position: "relative", aspectRatio: "16/10", background: service.bg, overflow: "hidden" }}>
              <CloudinaryImage preset="category" src={service.img} alt={service.title} fill sizes="360px" style={{ objectFit: "cover" }} />
              <span style={{ position: "absolute", top: 14, left: 14, background: "#fff", color: "var(--pdh-plum)", fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", padding: "5px 11px", borderRadius: 999 }}>
                {service.duration}
              </span>
            </div>
            <div style={{ padding: "20px 22px 22px" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--pdh-ink)" }}>{service.title}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.65, opacity: 0.65, marginTop: 8, minHeight: 62, color: "var(--pdh-ink)" }}>{service.sub}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ fontFamily: "var(--font-alta)", fontSize: 24, color: "var(--pdh-plum)", whiteSpace: "nowrap" }}>{servicePriceLabel(service)}</span>
                <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>Découvrir →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section style={{ marginTop: "clamp(40px,5vw,64px)" }}>
        <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(24px,3vw,34px)", margin: "0 0 18px" }}>
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
              <div style={{ fontFamily: "var(--font-alta)", fontSize: 20, fontWeight: 400, color: "var(--pdh-ink)" }}>
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
