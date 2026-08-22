import type { Metadata } from "next";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { COLLECTIONS } from "@/data/home";
import { IMG } from "@/data/products";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Collections — Para d'Hiver",
};

export default function CollectionsPage() {
  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "24px clamp(14px,3.4vw,32px) 70px" }}>
      <Breadcrumbs items={[{ label: "Accueil", href: routes.home() }, { label: "Collections" }]} />

      <div
        style={{
          position: "relative",
          borderRadius: "clamp(16px,2vw,24px)",
          overflow: "hidden",
          marginBottom: "clamp(24px,3vw,36px)",
          minHeight: "clamp(240px,26vw,320px)",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <CloudinaryImage preset="category" src={IMG.visage} alt="Collections Para d'Hiver" fill sizes="1200px" priority style={{ objectFit: "cover" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(47,31,61,.78),rgba(47,31,61,.18) 78%)" }} />
        <div style={{ position: "relative", zIndex: 3, padding: "clamp(24px,3vw,40px)", color: "var(--pdh-cream)", maxWidth: "min(100%,560px)" }}>
          <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.85 }}>Nos univers</div>
          <h1 style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(28px,4vw,46px)", lineHeight: 1.04, margin: "12px 0 10px" }}>
            Collections
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(247,238,229,.8)", margin: 0 }}>
            Des sélections composées par nos pharmaciens, par besoin et par moment de l&apos;année.
          </p>
        </div>
      </div>

      <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "clamp(14px,2vw,22px)" }}>
        {COLLECTIONS.map((collection, i) => (
          <Link
            key={collection.title}
            href="/catalogue"
            role="listitem"
            className="tile-hover"
            style={{
              position: "relative",
              height: "clamp(260px,26vw,320px)",
              borderRadius: 20,
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
              animation: "rise .5s both",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <CloudinaryImage preset="category" src={collection.img} alt={collection.title} fill sizes="480px" style={{ objectFit: "cover" }} />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(55,48,32,0) 36%,rgba(47,31,61,.82) 100%)" }} />
            <div style={{ position: "relative", zIndex: 3, padding: "clamp(18px,2.2vw,26px)", color: "var(--pdh-cream)", width: "100%" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(247,238,229,.16)",
                  border: "1px solid rgba(247,238,229,.34)",
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                {collection.count}
              </span>
              <div style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: 24, lineHeight: 1.15, margin: "10px 0 4px" }}>{collection.title}</div>
              <div style={{ fontSize: 12.5, color: "rgba(247,238,229,.78)", lineHeight: 1.6, maxWidth: 320 }}>{collection.sub}</div>
              <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 12 }}>Découvrir →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
