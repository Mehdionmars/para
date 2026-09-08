import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RitualSelector } from "@/components/catalogue/RitualSelector";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Trouvez votre rituel — Para d'Hiver",
  description: "Les univers de soin de Para d'Hiver : visage, corps, cheveux, solaire et bébé. Choisissez le vôtre et découvrez la sélection.",
};

/**
 * The rituals selector, on a page of its own.
 *
 * It used to render only inside the catalogue's empty-category branch, as the
 * way out of a `/shop/*` link with no products behind it. That made it a
 * recovery device nobody could reach on purpose: five aisles with photographs
 * of them, visible only to visitors who had already hit a dead end.
 *
 * Here it is a destination. The empty-category state still points at it — see
 * CatalogueView — but as a link, not by unfolding the whole block inside a
 * shop URL.
 *
 * `RitualSelector` supplies its own <h1>, so nothing else on this page may
 * carry one.
 */
export default function RituelsPage() {
  return (
    <div
      className="mobile-page-pad"
      style={{
        margin: "0 auto",
        maxWidth: "min(1280px,100%)",
        padding: "clamp(18px,2.4vw,30px) clamp(14px,3.4vw,32px) clamp(44px,5vw,76px)",
      }}
    >
      <Breadcrumbs items={[{ label: "Accueil", href: routes.home() }, { label: "Trouvez votre rituel" }]} />
      <RitualSelector />
    </div>
  );
}
