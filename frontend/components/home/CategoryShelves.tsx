import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { ProductCard } from "@/components/ProductCard";
import { ShelfScroller } from "@/components/home/ShelfScroller";
import { AISLE_GROUPS } from "@/lib/storefront/aisles";
import { routes } from "@/lib/routes";
import type { LiveProduct } from "@/lib/storefront/products";

export type Shelf = { title: string; href: string; products: LiveProduct[]; image?: string };

/**
 * Visage, Cheveux, Corps: one shelf each, the products themselves.
 *
 * A single row that scrolls sideways at every width, opened by the category's
 * own photograph when it has one. A shelf with nothing to show is dropped
 * rather than padded.
 */
export function CategoryShelves({ shelves }: { shelves: Shelf[] }) {
  const filled = shelves.filter((shelf) => shelf.products.length > 0);
  if (filled.length === 0) return null;

  return (
    <div className="shelves">
      {filled.map((shelf) => (
        <section aria-labelledby={`shelf-${shelf.title}`} className="shelf" key={shelf.title}>
          <div className="shelf-inner">
            <header className="shelf-head">
              <h2 className="shelf-title" id={`shelf-${shelf.title}`}>
                {shelf.title}
              </h2>
              <Link className="shelf-all" href={shelf.href}>
                Voir tout<span className="sr-only"> {shelf.title}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </header>
            <ShelfScroller label={shelf.title}>
              {shelf.image ? (
                <div className="shelf-photo-item" role="listitem">
                  <Link className="shelf-photo" href={shelf.href}>
                    <CloudinaryImage alt="" fill sizes="(max-width: 899px) 45vw, 22vw" src={shelf.image} style={{ objectFit: "cover" }} />
                    <span className="shelf-photo-label">
                      {shelf.title}
                      <span aria-hidden="true"> →</span>
                    </span>
                  </Link>
                </div>
              ) : null}
              {shelf.products.map((product, i) => (
                <div key={product.id} role="listitem">
                  <ProductCard product={product} variant="catalogue" delayMs={i * 50} />
                </div>
              ))}
            </ShelfScroller>
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * The catalogue, glimpsed: the newest products across every category, with a
 * door into each category and into the whole thing.
 *
 * The filters are links, not client-side tabs: each one is a real page the
 * visitor can land on, share, or come back to.
 */
export function CatalogueWall({ products }: { products: LiveProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="catalogue-wall-title" className="shelf shelf--wall">
      <div className="shelf-inner">
        <header className="shelf-head shelf-head--wall">
          <h2 className="shelf-title" id="catalogue-wall-title">
            Les nouveautés du catalogue
          </h2>
          <nav aria-label="Parcourir le catalogue" className="shelf-filters">
            {AISLE_GROUPS.map((group) => (
              <Link href={group.href} key={group.title}>
                {group.title}
              </Link>
            ))}
            <Link className="shelf-all" href={routes.catalogue()}>
              Tout le catalogue
              <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </header>
        <div className="shelf-grid" role="list">
          {products.map((product, i) => (
            <div key={product.id} role="listitem">
              <ProductCard product={product} variant="catalogue" delayMs={i * 50} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
