// Pure types + client-safe helpers only — no server-only imports, so client
// components (e.g. ProductForm) can import this without dragging in
// next/headers via lib/dashboard/payload.ts.

export const CATEGORY_OPTIONS = [
  "Visage",
  "Corps",
  "Cheveux",
  "Solaire",
  "Baby & Mom",
  "Maquillage",
  "Bucco-Dentaire",
  "Compléments alimentaires",
  "Hygiène",
] as const;
export type Category = (typeof CATEGORY_OPTIONS)[number];

export type Brand = { id: number; name: string };

export type Media = { id: number; url: string; alt: string };

export const BADGE_TYPES = [
  { label: "Top", value: "top" },
  { label: "Nouveau", value: "nouveau" },
  { label: "Best-seller", value: "bestseller" },
  { label: "Promo", value: "promo" },
  { label: "Exclusivité", value: "exclusivite" },
  { label: "Coup de cœur", value: "coupdecoeur" },
  { label: "Édition limitée", value: "editionlimitee" },
  { label: "Personnalisé", value: "custom" },
] as const;
export type BadgeType = (typeof BADGE_TYPES)[number]["value"];

export const BADGE_TYPE_DEFAULT_LABEL: Record<BadgeType, string> = {
  top: "Top",
  nouveau: "Nouveau",
  bestseller: "Best-seller",
  promo: "Promo",
  exclusivite: "Exclusivité",
  coupdecoeur: "Coup de cœur",
  editionlimitee: "Édition limitée",
  custom: "",
};

export type ProductBadge = { enabled: boolean; type: BadgeType; text?: string; bgColor?: string | null; textColor?: string | null };

export const VARIANT_OPTION_TYPES = [
  { label: "Contenance", value: "contenance" },
  { label: "Format", value: "format" },
  { label: "Taille", value: "taille" },
  { label: "Couleur", value: "couleur" },
  { label: "Parfum", value: "parfum" },
  { label: "Pack", value: "pack" },
  { label: "Autre", value: "autre" },
] as const;
export type VariantOptionType = (typeof VARIANT_OPTION_TYPES)[number]["value"];

export type ProductVariant = {
  id?: string;
  optionValue: string;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  oldPrice?: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  image?: Media | number | null;
  active: boolean;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  brand: Brand | number;
  category: Category;
  size: string;
  price: number;
  oldPrice?: number | null;
  badges?: ProductBadge[];
  rating: number;
  reviews: number;
  tint: string;
  description: string;
  image?: Media | number | null;
  gallery?: { image: Media | number }[];
  sku?: string | null;
  barcode?: string | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  hasVariants?: boolean | null;
  variantOptionType?: VariantOptionType | null;
  variants?: ProductVariant[];
  isPublished: boolean;
  featured?: boolean;
  discontinued?: boolean;
  /** Payload timestamp. Displayed as a column, and used as the reference for
   * the bulk operations' optimistic-concurrency check. */
  updatedAt?: string;
  /** Payload timestamp. Always present on the wire; optional here because the
   * bulk-edit paths build Products locally without one. */
  createdAt?: string;
};

export function stockStatus(product: Pick<Product, "stock" | "lowStockThreshold">): "out" | "low" | "ok" {
  if (product.stock <= 0) return "out";
  if (product.stock <= product.lowStockThreshold) return "low";
  return "ok";
}

export type RailEligibility = "eligible" | "out-of-stock" | "draft" | "discontinued";

/** Mirrors the exact eligibility rules the live homepage rails apply
 * (see frontend/lib/storefront/products.ts's BASE_ELIGIBILITY) — so this
 * badge never drifts out of sync with what actually shows on the storefront. */
export function railEligibility(product: Pick<Product, "stock" | "isPublished" | "discontinued">): RailEligibility {
  if (product.discontinued) return "discontinued";
  if (!product.isPublished) return "draft";
  if (product.stock <= 0) return "out-of-stock";
  return "eligible";
}
