import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { routes } from "@/lib/routes";

export type Rayon = {
  label: string;
  slug: string;
  /** Products on the shelf; null when the count could not be fetched. */
  count: number | null;
  /** Packshot of one real product from the shelf, "" when none has a photo. */
  image: string;
};

/**
 * "Nos rayons" — the main shelves of the shop as a grid of cards, each one
 * headed by a real product from that shelf and how many products are behind
 * it. Sits just above "Besoin d'un coup de pouce ?" on the homepage.
 */
export function RayonsGrid({ rayons }: { rayons: Rayon[] }) {
  if (rayons.length === 0) return null;

  return (
    <section aria-labelledby="rayons-title" className="rayons">
      <div className="rayons-inner">
        <h2 className="sec-title" id="rayons-title">
          Nos rayons
        </h2>
        <p className="sec-deck rayons-deck">Tous nos soins, rangés comme en pharmacie.</p>

        <ul className="rayons-grid">
          {rayons.map((rayon) => (
            <li key={rayon.slug}>
              <Link className="rayon-card" href={routes.category(rayon.slug)}>
                <span className="rayon-shot">
                  {rayon.image ? (
                    <CloudinaryImage alt="" crop="limit" fill sizes="(max-width: 640px) 45vw, 220px" src={rayon.image} />
                  ) : (
                    <span aria-hidden="true" className="rayon-initial">
                      {rayon.label.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="rayon-label">{rayon.label}</span>
                {rayon.count !== null && (
                  <span className="rayon-count">
                    {rayon.count} produit{rayon.count > 1 ? "s" : ""}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
