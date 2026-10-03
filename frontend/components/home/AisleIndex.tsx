import Link from "next/link";
import { AISLE_GROUPS } from "@/lib/storefront/aisles";
import { routes } from "@/lib/routes";

/**
 * The aisles, as an index — no photographs needed.
 *
 * Set like the label wall of an old pharmacy's drawers: a number, a name, and
 * how many products are behind it. It works with no image at all, which is the
 * real state of the 19 aisles today, and it needs no fallback because there is
 * nothing to fall back from.
 *
 * `counts` is the aisle -> product count map. An empty map means "unknown"
 * (the request failed), and every aisle is shown; a known zero hides the row,
 * so the index never leads to an empty shelf.
 */
export function AisleIndex({ counts, showAll = true }: { counts: Map<string, number>; showAll?: boolean }) {
  const known = counts.size > 0;
  const groups = AISLE_GROUPS.map((group) => ({
    ...group,
    aisles: group.aisles.filter((aisle) => !known || (counts.get(aisle.slug) ?? 0) > 0),
  })).filter((group) => group.aisles.length > 0);

  if (groups.length === 0) return null;

  const total = groups.reduce((sum, group) => sum + group.aisles.length, 0);
  let position = 0;

  return (
    <section aria-labelledby="aisle-index-title" className="aisle-index">
      <div className="aisle-index-inner">
        <header className="aisle-index-head">
          <h2 className="sec-title" id="aisle-index-title">
            Quel est votre souci&nbsp;?
          </h2>
          <p className="sec-deck">
            {total} rayons, classés par ce que vous cherchez à régler plutôt que par marque.
          </p>
          {showAll ? (
            <Link className="aisle-index-all" href={routes.catalogue()}>
              Tout le catalogue
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </header>

        <div className="aisle-index-groups">
          {groups.map((group) => (
            <div className="aisle-group" key={group.title}>
              <h3 className="aisle-group-title">
                <Link href={group.href}>{group.title}</Link>
              </h3>
              <ul className="aisle-list">
                {group.aisles.map((aisle) => {
                  position += 1;
                  const count = counts.get(aisle.slug);
                  return (
                    <li key={aisle.slug}>
                      <Link className="aisle-row" href={routes.category(aisle.slug)}>
                        <span aria-hidden="true" className="aisle-row-num">
                          {String(position).padStart(2, "0")}
                        </span>
                        <span className="aisle-row-name">{aisle.label}</span>
                        {known && count ? (
                          <span className="aisle-row-count">
                            {count}
                            <span className="sr-only"> produit{count > 1 ? "s" : ""}</span>
                          </span>
                        ) : null}
                        <span aria-hidden="true" className="aisle-row-arrow">
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
