import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { UNIVERSES } from "@/lib/catalogue/universes";

/**
 * Les rayons, en haut de l'accueil mobile.
 *
 * Sur un téléphone, la page d'accueil s'ouvre sur une bannière : sans ce
 * rail, entrer dans un rayon demande d'ouvrir le menu hamburger, donc un appui
 * et une lecture de liste. Les pastilles rondes mettent les neuf univers à un
 * seul appui, à l'endroit où le pouce se trouve déjà.
 *
 * Réservé au mobile : au-dessus de 768px le méga-menu de l'en-tête couvre le
 * même besoin, et /catalogue a déjà son propre carrousel d'univers. Il n'y a
 * donc rien de nouveau à maintenir côté desktop.
 *
 * La source est `UNIVERSES`, la même liste que le carrousel du catalogue —
 * pas une copie. Les catégories y correspondent exactement à l'énumération de
 * `Products.category`, ce qui fait que le lien filtre réellement.
 */

/** Assez grand pour être visé au pouce, assez petit pour en montrer quatre. */
const DISC = 68;

export function MobileCategoryRail() {
  return (
    <nav aria-label="Nos rayons" className="mobile-category-rail">
      <ul className="mobile-category-rail__track">
        {UNIVERSES.map((universe) => (
          <li key={universe.category} className="mobile-category-rail__item">
            <Link href={`/catalogue?cat=${encodeURIComponent(universe.category)}`} className="mobile-category-rail__link">
              <span className="mobile-category-rail__disc" style={{ height: DISC, width: DISC }}>
                {universe.image ? (
                  <CloudinaryImage
                    alt=""
                    crop="fill"
                    fill
                    // Le rail est la première chose sous l'en-tête : ces
                    // vignettes sont visibles sans défiler. Les charger
                    // paresseusement les ferait apparaître après coup, sur des
                    // ronds vides. `eager` sans `priority` : elles s'affichent
                    // tout de suite sans pour autant passer devant l'image
                    // principale dans la file de chargement.
                    loading="eager"
                    sizes={`${DISC * 2}px`}
                    src={universe.image}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  // Pas de photo éditoriale pour ce rayon : son initiale plutôt
                  // qu'une image empruntée à un autre rayon, qui le
                  // représenterait mal. Même règle que le carrousel du
                  // catalogue.
                  <span aria-hidden="true" className="mobile-category-rail__initial">
                    {universe.category.charAt(0)}
                  </span>
                )}
              </span>
              <span className="mobile-category-rail__label">{universe.category}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
