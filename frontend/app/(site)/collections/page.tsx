import type { Metadata } from "next";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { fetchCatalogue } from "@/lib/storefront/catalogue";
import { fetchCollectionCards } from "@/lib/storefront/collectionsPage";
import { IMG } from "@/data/products";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Collections — Para d'Hiver",
};

export default async function CollectionsPage() {
  const COLLECTIONS = await fetchCollectionCards();
  // The number on a card is the number of products its page really holds.
  const totals = await Promise.all(
    COLLECTIONS.map(async (c) => (c.productIds.length ? (await fetchCatalogue({ ids: c.productIds, limit: 1 })).total : 0)),
  );
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
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.85 }}>Nos univers</div>
          <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(28px,4vw,46px)", lineHeight: 1.04, margin: "12px 0 10px" }}>
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
            href={`/collections/${collection.slug}`}
            role="listitem"
            className="tile-hover"
            style={{ display: "block", animation: "rise .5s both", animationDelay: `${i * 60}ms` }}
          >
            <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 20, overflow: "hidden" }}>
              <CloudinaryImage preset="category" src={collection.img} alt={collection.title} fill sizes="480px" style={{ objectFit: "cover" }} />
              {totals[i] > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    background: "rgba(255,255,255,.92)",
                    color: "var(--pdh-plum)",
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    padding: "5px 11px",
                    borderRadius: 999,
                  }}
                >
                  {totals[i]} produit{totals[i] === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div style={{ padding: "16px 2px 0", color: "var(--pdh-ink)" }}>
              <div style={{ fontFamily: "var(--font-alta)", fontWeight: 300, fontSize: 25, lineHeight: 1.15 }}>{collection.title}</div>
              <div style={{ fontSize: 13, color: "rgba(26,26,26,.68)", lineHeight: 1.6, margin: "6px 0 0", maxWidth: 360 }}>{collection.sub}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 12, color: "var(--pdh-plum)" }}>Découvrir →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
