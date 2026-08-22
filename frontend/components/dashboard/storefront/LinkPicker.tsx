"use client";

import { useState } from "react";
import { ProductPicker, type PickedProduct } from "@/components/dashboard/storefront/ProductPicker";
import { routes } from "@/lib/routes";

const CATEGORY_ROUTES = [
  { label: "Visage", value: routes.category("visage") },
  { label: "Corps", value: routes.category("corps") },
  { label: "Cheveux", value: routes.category("cheveux") },
  { label: "Solaire", value: routes.category("solaire") },
  { label: "Maquillage", value: routes.category("maquillage") },
  { label: "Bébé & Maman", value: routes.category("bebe-maman") },
  { label: "Bucco-dentaire", value: routes.category("bucco-dentaire") },
  { label: "Compléments alimentaires", value: routes.category("complements-alimentaires") },
  { label: "Nouveautés", value: routes.category("nouveautes") },
  { label: "Soldes", value: routes.category("soldes") },
];

const INTERNAL_PAGES = [
  { label: "Accueil", value: routes.home() },
  { label: "Catalogue complet", value: routes.catalogue() },
  { label: "Toutes les marques", value: routes.brands() },
  { label: "Services", value: "/services" },
  { label: "Contact", value: "/contact" },
  { label: "Favoris", value: "/favoris" },
];

type Kind = "page" | "category" | "brand" | "product" | "external";

const KIND_LABELS: Record<Kind, string> = {
  page: "Page",
  category: "Catégorie",
  brand: "Marque",
  product: "Produit",
  external: "URL",
};

function inferKind(value: string): Kind {
  if (!value) return "page";
  // "/shop/brand/..." is the legacy path (still resolves via a redirect) —
  // still recognized here so old CTAs edited in the Builder show as "Marque".
  if (value.startsWith("/marques/") || value.startsWith("/shop/brand/")) return "brand";
  if (value.startsWith("/produit/")) return "product";
  if (CATEGORY_ROUTES.some((c) => c.value === value)) return "category";
  if (INTERNAL_PAGES.some((p) => p.value === value)) return "page";
  return "external";
}

/** Structured CTA-link builder: category/brand/product pickers write real
 * routes, "URL" stays open for anything else (external links, or a path not
 * covered above). Never invents a route — every preset here is a route that
 * actually exists in the app. */
export function LinkPicker({
  label,
  value,
  onChange,
  brands,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  brands: { id: number; name: string; slug: string }[];
}) {
  const [kind, setKind] = useState<Kind>(() => inferKind(value));
  const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400";

  const currentBrandSlug = value.startsWith("/marques/")
    ? value.replace("/marques/", "")
    : value.startsWith("/shop/brand/")
      ? value.replace("/shop/brand/", "")
      : "";
  const currentProductSlug = value.startsWith("/produit/") ? value.replace("/produit/", "") : "";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${kind === k ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      {kind === "page" && (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choisir une page...</option>
          {INTERNAL_PAGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      )}

      {kind === "category" && (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choisir une catégorie...</option>
          {CATEGORY_ROUTES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      )}

      {kind === "brand" && (
        <select className={inputCls} value={currentBrandSlug} onChange={(e) => onChange(e.target.value ? routes.brand(e.target.value) : "")}>
          <option value="">Choisir une marque...</option>
          {brands
            .filter((b) => b.slug)
            .map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
        </select>
      )}

      {kind === "product" && (
        <ProductPicker
          max={1}
          selected={currentProductSlug ? [{ id: -1, slug: currentProductSlug, label: `Produit : ${currentProductSlug}` }] : []}
          onChange={(sel: PickedProduct[]) => {
            const picked = sel[sel.length - 1];
            onChange(picked ? routes.product(picked.slug || String(picked.id)) : "");
          }}
        />
      )}

      {kind === "external" && (
        <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://... ou /un-chemin" />
      )}

      {value && <p className="truncate text-[11px] text-gray-400">→ {value}</p>}
    </div>
  );
}
