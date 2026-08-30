import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { routes } from "@/lib/routes";
import { fetchAllBrandsWithCounts } from "@/lib/storefront/catalogue";

export const metadata: Metadata = {
  title: "Marques — Para d'Hiver",
};

export default async function BrandsPage() {
  const brands = await fetchAllBrandsWithCounts();

  // Every referenced brand appears, including the seven with nothing published
  // yet. Hiding them made the page lie about what the pharmacy carries and
  // made a visitor who came looking for one conclude it isn't stocked at all.
  // They are shown, plainly marked, and not clickable — a tile that leads to
  // an empty page is a worse answer than a tile that says "bientôt".
  const stocked = brands.filter((b) => b.productCount > 0);
  const total = stocked.reduce((n, b) => n + b.productCount, 0);

  return (
    <div style={{ margin: "0 auto", maxWidth: "min(1280px,100%)", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <Breadcrumbs items={[{ label: "Accueil", href: routes.home() }, { label: "Marques" }]} />

      <div style={{ maxWidth: 760 }}>
        <h1 style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(28px,3.8vw,44px)", fontWeight: 200, margin: 0 }}>
          Toutes les marques
        </h1>
        <p style={{ fontSize: 13.5, lineHeight: 1.75, margin: "12px 0 0", color: "#5f6772" }}>
          {brands.length} laboratoires et marques dermocosmétiques référencés chez Para d&apos;Hiver,{" "}
          {stocked.length} avec des produits en ligne — {total} références disponibles.
        </p>
      </div>

      {brands.length === 0 ? (
        <p style={{ fontSize: 14, marginTop: 30, color: "#5f6772" }}>Aucune marque disponible pour le moment.</p>
      ) : (
        <ul className="brand-grid">
          {brands.map((brand) => {
            const available = brand.productCount > 0;
            const count = `${brand.productCount} produit${brand.productCount === 1 ? "" : "s"}`;

            return (
              <li key={brand.id}>
                {available ? (
                  <Link aria-label={`${brand.name} — ${count}`} className="brand-tile" href={routes.brand(brand.slug)}>
                    <BrandLogo logo={brand.logo} name={brand.name} slug={brand.slug} />
                    <span className="brand-tile-count">{count}</span>
                  </Link>
                ) : (
                  // Not a link and not a disabled button: there is no action to
                  // offer, so nothing here takes focus or invites a click.
                  <div aria-label={`${brand.name} — aucun produit en ligne pour le moment`} className="brand-tile brand-tile--soon" role="group">
                    <BrandLogo logo={brand.logo} muted name={brand.name} slug={brand.slug} />
                    <span className="brand-tile-count brand-tile-count--soon">Bientôt</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
