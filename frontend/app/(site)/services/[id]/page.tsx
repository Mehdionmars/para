import { Check } from "lucide-react";
import type { Metadata } from "next";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES, servicePriceLabel } from "@/data/services";
import { fetchServiceById } from "@/lib/storefront/services";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: String(s.id) }));
}

/** Live. SERVICES above is still used by generateStaticParams: which paths
 * are pre-rendered is a build-time question, and a service added in the CMS
 * afterwards still renders on demand. */
async function findService(id: string) {
  return fetchServiceById(Number(id));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const service = await findService(id);
  if (!service) return {};
  return { title: `${service.title} — Para d'Hiver` };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await findService(id);
  if (!service) notFound();

  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 11.5, letterSpacing: ".1em", opacity: 0.55, marginBottom: 20 }}>
        <Link href="/" className="link-hover" style={{ color: "inherit" }}>
          Accueil
        </Link>{" "}
        /{" "}
        <Link href="/services" className="link-hover" style={{ color: "inherit" }}>
          Services
        </Link>{" "}
        / {service.title}
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(20px,3vw,44px)", alignItems: "flex-start" }}>
        <div
          style={{
            position: "relative",
            aspectRatio: "4/3",
            borderRadius: "clamp(16px,2vw,24px)",
            background: service.bg,
            overflow: "hidden",
            animation: "pop .4s both",
          }}
        >
          <CloudinaryImage preset="editorial" src={service.img} alt={service.title} fill sizes="600px" style={{ objectFit: "cover" }} />
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal)" }}>
            Service en institut
          </div>
          <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(28px,4vw,46px)", lineHeight: 1.04, margin: "12px 0 14px" }}>
            {service.title}
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.8, opacity: 0.75, margin: "0 0 22px", maxWidth: 860 }}>{service.desc}</p>

          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ border: "1px solid rgba(94,64,116,.18)", borderRadius: 14, padding: "14px 20px" }}>
              <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.5 }}>Durée</div>
              <div style={{ fontFamily: "var(--font-alta)", fontSize: 22, color: "var(--pdh-plum)" }}>{service.duration}</div>
            </div>
            <div style={{ border: "1px solid rgba(94,64,116,.18)", borderRadius: 14, padding: "14px 20px" }}>
              <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.5 }}>Tarif</div>
              <div style={{ fontFamily: "var(--font-alta)", fontSize: 22, color: "var(--pdh-plum)", whiteSpace: "nowrap" }}>{servicePriceLabel(service)}</div>
            </div>
            <div style={{ border: "1px solid rgba(94,64,116,.18)", borderRadius: 14, padding: "14px 20px" }}>
              <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: 0.5 }}>Avec</div>
              <div style={{ fontFamily: "var(--font-alta)", fontSize: 22, color: "var(--pdh-plum)" }}>{service.expert}</div>
            </div>
          </div>

          <Link
            href={`/services/${service.id}/reserver`}
            className="btn-plum"
            style={{ display: "inline-block", padding: "16px 36px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
          >
            Réserver ce soin
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(20px,3vw,44px)", marginTop: 52 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(23px,2.8vw,32px)", margin: "0 0 18px" }}>Bénéfices</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {service.benefits.map((b) => (
              <div key={b} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--pdh-sand)", borderRadius: 14, padding: "14px 18px" }}>
                <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--pdh-teal)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </span>
                <span style={{ fontSize: 13.5, lineHeight: 1.6 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(23px,2.8vw,32px)", margin: "0 0 18px" }}>Le déroulé</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {service.steps.map((step) => (
              <div key={step.n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid rgba(94,64,116,.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-alta)",
                    fontSize: 13,
                    color: "var(--pdh-plum)",
                    flex: "none",
                  }}
                >
                  {step.n}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{step.title}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 3, lineHeight: 1.6 }}>{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
