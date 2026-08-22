"use client";

import { ArrowUpRight, Heart } from "lucide-react";
import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { ProductBadges } from "@/components/product/ProductBadges";
import { useCart } from "@/context/cart-context";
import { useFavorites } from "@/context/favorites-context";
import { useToast } from "@/context/toast-context";
import { type Product, money, productImage, stars } from "@/data/products";
import { routes } from "@/lib/routes";

export type ProductCardVariant = "rail" | "promo" | "campaign" | "dermo" | "similar" | "catalogue" | "wishlist";

export type StockState = "ok" | "low" | "out";

/**
 * Every product photo in the catalogue is a square packshot on white
 * (verified: 72/72 published products, 800x800 or 600x600 — none portrait,
 * none landscape). Showing the source at its own ratio is both truer to the
 * product and the reason the card stops reading as an anonymous cropped photo.
 */
const SHOT_RATIO = "1/1";

type Props = {
  // `image` is provided directly by live-fetched rails/catalogue data;
  // pages still reading from the data/products.ts snapshot fall back to the
  // static productImage(id) lookup below. `stockState` is only present when
  // the caller has real live inventory data (catalogue) — omit it elsewhere
  // rather than fabricate availability.
  product: Product & { image?: string; stock?: number; stockState?: StockState };
  variant: ProductCardVariant;
  /** Stagger the entrance animation for grid layouts. */
  delayMs?: number;
  /** Only used by the "dermo" variant. */
  dermo?: { actif: string; claim: string };
};

const VARIANT_CONFIG: Record<
  ProductCardVariant,
  {
    showFav: boolean;
    showBadge: boolean;
    /** The rating line, which only the editorial rails have room to carry. */
    showRating: boolean;
    large: boolean;
  }
> = {
  rail: { showFav: true, showBadge: true, showRating: true, large: false },
  catalogue: { showFav: true, showBadge: true, showRating: false, large: true },
  promo: { showFav: true, showBadge: true, showRating: false, large: false },
  campaign: { showFav: false, showBadge: true, showRating: false, large: false },
  dermo: { showFav: false, showBadge: true, showRating: false, large: false },
  similar: { showFav: false, showBadge: false, showRating: false, large: false },
  wishlist: { showFav: true, showBadge: true, showRating: false, large: false },
};

/**
 * A product, unframed.
 *
 * The card this replaces was a tile inside a tile: a sand panel, a 1px plum
 * border, a white plate inset within it, then a shadow lift on hover — four
 * pieces of chrome around one photograph. With up to three badges stacked on
 * the shot, a 31px price and a full-width uppercase plum pill under it, every
 * card in a row of four shouted at the same volume and the products
 * themselves came third.
 *
 * Now there is no card. The packshots are photographed on white and the
 * storefront's ground is white, so the shot simply sits on the page; the type
 * below is separated by rhythm rather than by a box; and the call to action
 * rises in on hover, where a pointer user is already committed. On touch,
 * where there is no hover to give, it is always there.
 */
export function ProductCard({ product, variant, delayMs, dermo }: Props) {
  const cart = useCart();
  const favorites = useFavorites();
  const toast = useToast();
  const config = VARIANT_CONFIG[variant];
  const href = routes.product(product.slug);
  const isFavorite = favorites.isFavorite(product.id);
  const outOfStock = product.stockState === "out";
  const lowStock = product.stockState === "low";

  // Availability is only worth a line when it is news. A green tick printed on
  // nineteen cards out of twenty was decoration wearing an information
  // costume — and it crowded out the contenance, which shoppers actually
  // compare. Scarcity keeps its line, in its own colour; rupture is said once,
  // at the bottom, in the slot where the action would otherwise be.
  const meta = lowStock
    ? { color: "#8A5A0F", text: `Plus que ${product.stock}` }
    : product.size
      ? { color: undefined, text: product.size }
      : null;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (outOfStock) return;
    // A card sells the product as listed: it has no option selector, so the
    // line carries no variant. Choosing one is what the product page is for.
    cart.addProduct(product, 1);
    toast.fire(`${product.name} ajouté au panier`);
  }

  function handleFav(e: React.MouseEvent) {
    e.preventDefault();
    favorites.toggle(product.id);
  }

  return (
    <article
      className={variant === "dermo" ? "pdh-card pdh-card--tinted" : "pdh-card"}
      style={{
        animation: delayMs !== undefined ? "rise .5s both" : undefined,
        animationDelay: delayMs !== undefined ? `${delayMs}ms` : undefined,
      }}
    >
      <div className="pdh-shot-wrap" style={{ aspectRatio: SHOT_RATIO }}>
        <Link aria-label={product.name} href={href} style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          {/* Decorative: the wrapping Link already carries the product name
              as its aria-label, so a second announcement would be noise. */}
          <CloudinaryImage
            alt=""
            className="pdh-shot"
            // "limit" preserves the source ratio and never upscales — the
            // counterpart to object-fit: contain.
            crop="limit"
            fill
            sizes={config.large ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px" : "260px"}
            src={product.image || productImage(product.id)}
            // Desaturated and dimmed rather than dimmed alone: at the opacity
            // that reads as "off" on a bare white ground, a pale packshot had
            // nearly disappeared. Draining the colour carries the state and
            // lets the product stay visible.
            style={{ filter: outOfStock ? "grayscale(.55)" : undefined, opacity: outOfStock ? 0.7 : 1 }}
          />
        </Link>

        {config.showBadge && (
          // Two, not three. Without a frame to hold them, a third pill turns
          // the top-left corner of the photograph into a stack of stickers —
          // and the third was always the least useful of the three.
          <ProductBadges badges={product.badges} compact={!config.large} limit={2} oldPrice={product.old || null} price={product.price} />
        )}

        {variant === "dermo" && dermo && <span className="pdh-actif">{dermo.actif}</span>}

        {config.showFav && (
          <button
            aria-label={isFavorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
            aria-pressed={isFavorite}
            className="fav-btn"
            data-active={isFavorite ? "true" : "false"}
            onClick={handleFav}
            type="button"
          >
            <Heart aria-hidden="true" color="var(--pdh-plum)" fill={isFavorite ? "var(--pdh-plum)" : "none"} size={15} strokeWidth={1.6} />
          </button>
        )}
      </div>

      <div className="pdh-body">
        <div className="pdh-brand">{product.brand}</div>

        <Link
          // Two-line clamp with a matching fixed height, so every card in a
          // row ends at the same place regardless of name length — a ragged
          // bottom edge is what makes a grid of products look untidy.
          className="pdh-clamp-2 pdh-name"
          href={href}
          style={{
            fontSize: config.large ? 15.5 : variant === "dermo" ? 13.5 : 14.5,
            minHeight: config.large ? 41 : 38,
          }}
        >
          {product.name}
        </Link>

        <div className="pdh-metaline">
          {meta && <span style={{ color: meta.color }}>{meta.text}</span>}
          {config.showRating && product.reviews > 0 && (
            <>
              <span aria-hidden="true" style={{ color: "var(--pdh-teal)", letterSpacing: ".08em" }}>
                {stars(product.rating)}
              </span>
              <span>({product.reviews})</span>
            </>
          )}
          {variant === "dermo" && dermo && <span>{dermo.claim}</span>}
        </div>

        <div className="pdh-price-row">
          <span className="pdh-price" style={{ fontSize: config.large ? 26 : 22 }}>
            {money(product.price)}
          </span>
          {!!product.old && <span className="pdh-price-old">{money(product.old)}</span>}
        </div>

        {/* The hairline above this button is the card's only remaining rule,
            and it does what the border used to: it says where the product
            ends and the action begins. */}
        <button
          aria-label={outOfStock ? `${product.name} — rupture de stock` : `Ajouter ${product.name} au panier`}
          className={outOfStock ? "pdh-cta pdh-cta--static" : "pdh-cta"}
          disabled={outOfStock}
          onClick={handleAdd}
          type="button"
        >
          {/* The rule belongs to the card and stays; only its label comes and
              goes. Fading the border with the label left every second card in
              a row missing its baseline, which is the one thing holding a
              frameless grid together. */}
          <span className="pdh-cta-inner">
            {outOfStock ? "Rupture de stock" : "Ajouter au panier"}
            {!outOfStock && <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.8} />}
          </span>
        </button>
      </div>
    </article>
  );
}
