import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoffretCard } from "@/components/home/GiftSetsCarousel";
import { COFFRETS, COFFRETS_COPY } from "@/data/home";
import { routes } from "@/lib/routes";
import { fetchLiveHomeContent, fetchPublishedHomeContent } from "@/lib/storefront/homeContent";

export const metadata: Metadata = {
  title: "Coffrets & cadeaux — Para d'Hiver",
  description: "Coffrets prêts à offrir et cartes cadeaux, emballés à la main dans notre parapharmacie d'Aïn Sebaâ.",
};

/**
 * Every coffret and gift card on one page — where the home section's
 * "Tous les coffrets" leads.
 *
 * The same cards as the home carousel, read from the same Home content with
 * the same draft/published rule, so a card added or hidden in
 * /dashboard/coffrets shows up here and on the home page together. The
 * snapshot stands in only when the CMS does not answer.
 */
export default async function CoffretsPage() {
  const isPreview = (await draftMode()).isEnabled;
  const live = isPreview
    ? await fetchLiveHomeContent().catch(() => null)
    : await fetchPublishedHomeContent().catch(() => null);

  const coffrets = live?.coffrets ?? COFFRETS;
  const copy = live?.coffretsCopy ?? COFFRETS_COPY;

  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "24px var(--sec-pad-x, clamp(14px,3.4vw,32px)) 70px" }}>
      <Breadcrumbs items={[{ label: "Accueil", href: routes.home() }, { label: "Coffrets & cadeaux" }]} />

      <header style={{ margin: "clamp(12px,2vw,24px) 0 clamp(24px,3vw,40px)", maxWidth: 640 }}>
        <h1 className="sec-title" style={{ margin: 0 }}>
          {copy.title || "Coffrets & cadeaux"}
        </h1>
        {copy.subtitle && (
          <p className="sec-deck" style={{ marginTop: 10 }}>
            {copy.subtitle}
          </p>
        )}
      </header>

      {coffrets.length > 0 ? (
        <div
          role="list"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: "clamp(20px,2.4vw,32px) clamp(14px,2vw,24px)" }}
        >
          {coffrets.map((c, i) => (
            <div key={`${c.title}-${i}`} role="listitem">
              <CoffretCard c={c} />
            </div>
          ))}
        </div>
      ) : (
        <p className="sec-deck">Aucun coffret disponible pour le moment. Revenez bientôt, ou contactez-nous pour composer le vôtre.</p>
      )}
    </div>
  );
}
