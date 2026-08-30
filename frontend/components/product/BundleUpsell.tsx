"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import type { StockState } from "@/components/ProductCard";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { money, productImage, stars, type Product } from "@/data/products";
import { routes } from "@/lib/routes";

/**
 * A product that can go into the bundle. Everything past `Product` is
 * optional because the two callers supply different amounts of truth: the
 * product page has a full `LiveProductDetail` for the item being viewed, and
 * only a `LiveProduct` for each suggestion.
 *
 * `gallery` is read for the hover swap and nothing else. The PDP's own
 * gallery leads with the hero while a suggestion's holds alternates only, so
 * the alternate is *found* rather than indexed — see `alternateShot`.
 */
export type BundleItem = Product & {
  image?: string;
  gallery?: string[];
  stockState?: StockState;
};

type Props = {
  /** The product being viewed. Always the first card — it is the one the
   *  shopper already came for, so the bundle reads as an addition to it. */
  currentProduct: BundleItem;
  /** Suggestions, in priority order. On the product page these are the same
   *  live category matches the "Vous aimerez aussi" rail uses. */
  products: BundleItem[];
  /**
   * Percentage off the selected subtotal. 0 is a real, supported value: the
   * summary then drops the discount line entirely rather than printing
   * "−0 MAD", and the section still works as a plain multi-add.
   */
  bundleDiscountPercent?: number;
  /** Cards shown, current product included. Three fits the row at every
   *  width; more starts compressing the packshots. */
  maxItems?: number;
};

/** Money is compared and summed here before display, so the float noise of
 *  repeated percentage maths must not reach the total. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** First shot that is not the hero. Absent for most products — the majority
 *  of the catalogue is photographed once — and then there is no hover swap. */
function alternateShot(item: BundleItem, hero: string): string | undefined {
  return (item.gallery || []).find((src) => src && src !== hero);
}

/** Product names carry a second line in the CMS for some references; the
 *  card and the cart both want the first. */
const firstLine = (name: string) => name.split("\n")[0];

export function BundleUpsell({ currentProduct, products, bundleDiscountPercent = 15, maxItems = 3 }: Props) {
  const cart = useCart();
  const toast = useToast();

  const items = useMemo(() => {
    const rest = products.filter((p) => p.id !== currentProduct.id);
    return [currentProduct, ...rest].slice(0, Math.max(2, maxItems));
  }, [currentProduct, products, maxItems]);

  const inStock = useMemo(() => items.filter((i) => i.stockState !== "out"), [items]);

  // Everything available starts ticked: the offer is the default, and a
  // shopper who wants less unticks. Starting empty would make the summary
  // read as zero and the section look broken on arrival.
  const [selected, setSelected] = useState<Set<number>>(() => new Set(inStock.map((i) => i.id)));
  const [justAdded, setJustAdded] = useState(false);
  const adding = useRef(false);

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const chosen = useMemo(
    () => items.filter((i) => i.stockState !== "out" && selected.has(i.id)),
    [items, selected],
  );

  // Every figure below is derived from the actual selection. `original`
  // counts each item's pre-markdown price where it has one, so "vous
  // économisez" is the whole distance from list price to what is paid —
  // the bundle discount plus any markdown already on the products.
  const totals = useMemo(() => {
    const subtotal = round2(chosen.reduce((sum, i) => sum + i.price, 0));
    const original = round2(chosen.reduce((sum, i) => sum + (i.old || i.price), 0));
    const discount = round2((subtotal * bundleDiscountPercent) / 100);
    const total = round2(subtotal - discount);
    return { subtotal, original, discount, total, savings: round2(original - total) };
  }, [chosen, bundleDiscountPercent]);

  // Two cards is the floor: one product is not a bundle, and the "+" would
  // have nothing to join.
  if (items.length < 2) return null;

  function handleAdd() {
    if (adding.current || chosen.length === 0) return;
    adding.current = true;
    // addProduct merges by product+variant key, so a double submit would
    // silently push every line to qty 2 rather than erroring — hence the
    // guard rather than a disabled attribute alone.
    for (const item of chosen) cart.addProduct({ ...item, name: firstLine(item.name) }, 1);
    toast.fire(
      chosen.length === 1
        ? `${firstLine(chosen[0].name)} ajouté au panier`
        : `${chosen.length} produits ajoutés au panier`,
    );
    setJustAdded(true);
    window.setTimeout(() => {
      setJustAdded(false);
      adding.current = false;
    }, 2200);
  }

  const countLabel =
    chosen.length === 0
      ? "Aucun produit sélectionné"
      : `${chosen.length} produit${chosen.length > 1 ? "s" : ""} sélectionné${chosen.length > 1 ? "s" : ""}`;

  return (
    <section aria-labelledby="bundle-title" className="bundle">
      <div className="bundle-head">
        <h2 className="bundle-title" id="bundle-title">
          Complétez votre routine
        </h2>
        <p className="bundle-sub">Découvrez les produits qui s&apos;associent parfaitement à votre sélection.</p>
      </div>

      <div className="bundle-body">
        <div className="bundle-picks" role="list">
          {items.map((item, index) => {
            const hero = item.image || productImage(item.id);
            const alt = alternateShot(item, hero);
            const out = item.stockState === "out";
            const isOn = !out && selected.has(item.id);
            const name = firstLine(item.name);

            return (
              // The "+" is a sibling of the slots rather than a child of one:
              // nested inside, the last card (which has no "+") kept the width
              // the others gave away and the row came out ragged.
              <Fragment key={item.id}>
                <div className="bundle-slot" role="listitem">
                  <article className="bundle-card" data-on={isOn || undefined} data-out={out || undefined}>
                    <div className="bundle-shot-wrap">
                      <Link aria-label={`Voir ${name}`} className="bundle-shot-link" href={routes.product(item.slug)}>
                        {/* Decorative: the link above names the product, and
                            the alternate is that same product from another
                            angle — announcing either would be noise. */}
                        <CloudinaryImage alt="" className="bundle-shot" crop="limit" fill sizes="200px" src={hero} />
                        {alt && (
                          <CloudinaryImage
                            alt=""
                            aria-hidden="true"
                            className="bundle-shot bundle-shot--alt"
                            crop="limit"
                            fill
                            sizes="200px"
                            src={alt}
                          />
                        )}
                      </Link>

                      <input
                        aria-label={out ? `${name} — indisponible` : `Inclure ${name} dans le lot`}
                        checked={isOn}
                        className="bundle-check"
                        disabled={out}
                        onChange={() => toggle(item.id)}
                        type="checkbox"
                      />
                    </div>

                    <div className="bundle-info">
                      <div className="bundle-brand">{item.brand}</div>
                      <Link className="bundle-name pdh-clamp-2" href={routes.product(item.slug)}>
                        {name}
                      </Link>

                      <div className="bundle-metaline">
                        {item.reviews > 0 ? (
                          <>
                            <span aria-hidden="true" className="bundle-stars">
                              {stars(item.rating)}
                            </span>
                            <span>
                              {item.rating.toLocaleString("fr-FR")} ({item.reviews})
                            </span>
                          </>
                        ) : (
                          item.size && <span>{item.size}</span>
                        )}
                      </div>

                      <div className="bundle-price-row">
                        <span className="bundle-price">{money(item.price)}</span>
                        {!!item.old && <span className="pdh-price-old">{money(item.old)}</span>}
                      </div>

                      {/* Availability is stated in words, not left to the
                          greyed-out photograph — the tick is the card's only
                          other signal and it is absent here for two reasons. */}
                      {out && <span className="bundle-out">Indisponible</span>}
                    </div>
                  </article>
                </div>

                {index < items.length - 1 && (
                  <span aria-hidden="true" className="bundle-plus">
                    <Plus size={15} strokeWidth={1.7} />
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>

        <aside aria-label="Récapitulatif du lot" className="bundle-summary">
          <div className="bundle-summary-head">
            <span className="bundle-summary-kicker">Offre routine</span>
            {/* The figures all change together as boxes are ticked, so the
                count is announced and the rest is read on demand rather than
                three regions racing each other. */}
            <p aria-live="polite" className="bundle-count">
              {countLabel}
            </p>
          </div>

          <dl className="bundle-figures">
            <div className="bundle-fig">
              <dt>Sous-total</dt>
              <dd>{money(totals.subtotal)}</dd>
            </div>
            {bundleDiscountPercent > 0 && (
              <div className="bundle-fig">
                <dt>Remise du lot ({bundleDiscountPercent}%)</dt>
                <dd className="bundle-fig-minus">−{money(totals.discount)}</dd>
              </div>
            )}
            <div className="bundle-fig bundle-fig--total">
              <dt>Total du lot</dt>
              <dd>{money(totals.total)}</dd>
            </div>
          </dl>

          {totals.savings > 0 && <p className="bundle-save">Vous économisez {money(totals.savings)}</p>}

          <button className="btn-plum bundle-cta" disabled={chosen.length === 0} onClick={handleAdd} type="button">
            {justAdded ? "Ajouté au panier" : "Ajouter la sélection au panier"}
          </button>

          {chosen.length === 0 && <p className="bundle-hint">Sélectionnez au moins un produit pour continuer.</p>}
        </aside>
      </div>
    </section>
  );
}
