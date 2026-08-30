import type { CategoryChip } from "@/lib/storefront/siteChromeContent";

/**
 * The quick-category tiles a shop starts with.
 *
 * The strip is configured in the Storefront Builder (Navigation → "Bande de
 * catégories"), and whatever is set there wins outright. This is only what
 * renders before anyone has configured anything.
 *
 * It lives here rather than in `data/nav.ts` on purpose: that file carries a
 * "AUTO-GENERATED — do not edit by hand" header and is overwritten by every
 * `npm run sync-cms`, so a default parked there would silently disappear on
 * the next sync.
 *
 * Every href is a category already in the main navigation, and every image is
 * a Cloudinary asset already used elsewhere on the storefront — so the
 * default set cannot 404 or point at a picture that was never uploaded.
 */
const IMG = "https://res.cloudinary.com/draqxinrp/image/upload/para-dhiver";

export const DEFAULT_CATEGORY_CHIPS: CategoryChip[] = [
  { label: "Visage", href: "/shop/visage", image: `${IMG}/visage.png` },
  { label: "Cheveux", href: "/shop/cheveux", image: `${IMG}/cheveux.png` },
  { label: "Corps", href: "/shop/corps", image: `${IMG}/dermo.png` },
  { label: "Bébé & Maman", href: "/shop/bebe-maman", image: `${IMG}/baby.png` },
  { label: "Maquillage", href: "/shop/maquillage", image: `${IMG}/maquillage.png` },
  { label: "Compléments", href: "/shop/complements-alimentaires", image: `${IMG}/complements.png` },
];
