"use client";

import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/cart-context";
import { useFavorites } from "@/context/favorites-context";
import { useToast } from "@/context/toast-context";
import { PRODUCTS } from "@/data/products";

export function FavoritesView() {
  const favorites = useFavorites();
  const cart = useCart();
  const toast = useToast();
  const products = PRODUCTS.filter((p) => favorites.isFavorite(p.id));

  // A wishlist is a shopping list: adding it item by item is the whole reason
  // people abandon one. Availability is not filtered here because this view
  // reads the static catalogue snapshot, which carries no live stock — the
  // checkout re-reads both stock and price from the database anyway.
  function handleAddAll() {
    products.forEach((product) => cart.addProduct(product, 1));
    toast.fire(
      products.length === 1
        ? "1 produit ajouté au panier"
        : `${products.length} produits ajoutés au panier`,
    );
  }

  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, letterSpacing: ".02em", marginBottom: 16 }}>
        <Link href="/" className="link-hover" style={{ color: "inherit", opacity: 0.55 }}>
          Accueil
        </Link>{" "}
        <span style={{ opacity: 0.4 }}>/</span> <span style={{ fontWeight: 600 }}>Favoris</span>
      </nav>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: "clamp(24px,3vw,36px)",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(28px,3.8vw,44px)", margin: 0 }}>
            Mes favoris
          </h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, opacity: 0.62, margin: "12px 0 0" }}>
            {products.length === 0
              ? "Les produits que vous mettez en favoris depuis le catalogue apparaissent ici."
              : `${products.length} produit${products.length === 1 ? "" : "s"} enregistré${products.length === 1 ? "" : "s"} sur cet appareil.`}
          </p>
        </div>

        {products.length > 0 && (
          <button type="button" onClick={handleAddAll} className="btn-plum wishlist-add-all">
            <ShoppingBag aria-hidden="true" size={16} strokeWidth={1.7} />
            Tout ajouter au panier
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "clamp(60px,8vw,100px) 20px",
            borderRadius: "clamp(16px,2vw,24px)",
            background: "var(--pdh-sand)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(94,64,116,.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--pdh-plum)",
              margin: "0 auto 18px",
            }}
          >
            <Heart aria-hidden="true" size={22} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(20px,2.4vw,26px)", fontWeight: 300, marginBottom: 8 }}>
            Votre liste de favoris est vide
          </div>
          <p style={{ fontSize: 13.5, opacity: 0.6, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Ajoutez vos produits préférés pour les retrouver facilement.
          </p>
          <Link
            href="/shop"
            className="btn-plum"
            style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
          >
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        // auto-FILL, not auto-fit. auto-fit collapses the empty tracks, so a
        // wishlist holding one or two products stretched each card across the
        // full 1280px container — the actual cause of the oversized cards.
        // auto-fill keeps the track count, so cards stay ~210px whether there
        // is 1 favourite or 40.
        <div
          role="list"
          className="wishlist-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,210px),1fr))",
            columnGap: "clamp(14px,1.8vw,24px)",
            rowGap: "clamp(28px,3.2vw,42px)",
          }}
        >
          {products.map((product, i) => (
            <div key={product.id} role="listitem">
              {/* delayMs capped: a 40-item wishlist would otherwise stagger
                  the last card in by 1.6s of dead time. */}
              <ProductCard product={product} variant="wishlist" delayMs={Math.min(i, 11) * 35} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
