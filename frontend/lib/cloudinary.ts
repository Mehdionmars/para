/**
 * Cloudinary delivery-URL builder.
 *
 * Why this exists: the Cloudinary storage adapter (backend/src/lib/
 * cloudinaryAdapter.ts) deliberately uploads originals untransformed, so the
 * `url` Payload stores points at a full-size asset — up to 4000x4000. Serving
 * that straight to a 400px product card is the exact thing this file
 * prevents: every transformation is applied here, at delivery time, by
 * rewriting the URL. Nothing is baked in at upload, so the same original can
 * back a thumbnail, a PDP hero and a marketing banner.
 *
 * `q_auto` + `f_auto` are always applied: Cloudinary then picks the codec per
 * request (AVIF/WebP where the browser sends Accept, JPEG otherwise) and the
 * quality per image content. That negotiation is why these URLs must be hit
 * directly rather than proxied through Next's own image optimizer — see
 * cloudinaryLoader() below.
 */

/** Widths we actually request. Keeping the set small keeps the Cloudinary
 * derived-asset count (and cache hit rate) sane across thousands of SKUs. */
export const CLOUDINARY_WIDTHS = [160, 240, 320, 400, 600, 800, 1000, 1280, 1600] as const;

export type CloudinaryCrop = "fill" | "limit" | "fit" | "pad" | "scale";

export type CloudinaryOptions = {
  width?: number;
  height?: number;
  /** "fill" crops to the exact box (cards); "limit" never upscales (PDP). */
  crop?: CloudinaryCrop;
  /** 1-100, or "auto" (default) to let Cloudinary decide per image. */
  quality?: number | "auto";
  /** Defaults to "auto" so Cloudinary negotiates AVIF/WebP/JPEG per request. */
  format?: string;
  /** Device pixel ratio; "auto" requires the Cloudinary JS SDK, so prefer a number. */
  dpr?: number;
  /** Focus point for crops — "auto" tracks the subject, good for packshots. */
  gravity?: string;
};

const CLOUDINARY_HOST = "res.cloudinary.com";

/** A Cloudinary delivery URL, split so transformations can be inserted. */
type ParsedCloudinaryUrl = { base: string; existingTransform: string | null; path: string };

// A transformation segment looks like "w_400,h_400,c_fill" / "f_auto" — one
// or more `key_value` pairs. A public id ("para-dhiver/foo") never matches,
// which is how an already-transformed URL is detected rather than doubled up.
const TRANSFORM_SEGMENT = /^[a-z]{1,3}_[^/]+$/;

function parseCloudinaryUrl(url: string): ParsedCloudinaryUrl | null {
  if (!url.includes(CLOUDINARY_HOST)) return null;
  const marker = "/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return null;

  const base = url.slice(0, at + marker.length);
  const rest = url.slice(at + marker.length);
  const [first, ...others] = rest.split("/");

  if (others.length > 0 && TRANSFORM_SEGMENT.test(first)) {
    return { base, existingTransform: first, path: others.join("/") };
  }
  return { base, existingTransform: null, path: rest };
}

/** True for URLs this module can actually transform. */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return Boolean(url && url.includes(CLOUDINARY_HOST) && url.includes("/upload/"));
}

/**
 * The public id of a Cloudinary asset ("para-dhiver/products/SKU/main"),
 * derived from its delivery URL. Payload's upload field stores the URL, not
 * the id, so this is how callers get one without a second source of truth.
 */
export function cloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url) return null;
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return null;
  return parsed.path.replace(/^v\d+\//, "").replace(/\.[^./]+$/, "");
}

function buildTransform(options: CloudinaryOptions): string {
  const parts: string[] = [];
  if (options.width) parts.push(`w_${Math.round(options.width)}`);
  if (options.height) parts.push(`h_${Math.round(options.height)}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.gravity) parts.push(`g_${options.gravity}`);
  if (options.dpr) parts.push(`dpr_${options.dpr}`);
  // Always last, and always present: quality then format negotiation.
  parts.push(`q_${options.quality ?? "auto"}`);
  parts.push(`f_${options.format ?? "auto"}`);
  return parts.join(",");
}

/**
 * Builds an optimized delivery URL from a Cloudinary URL *or* a bare public
 * id. Anything that isn't a Cloudinary asset (the local
 * /assets/product-placeholder.svg, an Instagram CDN URL) is returned
 * untouched, so callers can pass whatever the CMS gave them without
 * branching.
 */
export function getCloudinaryUrl(src: string | null | undefined, options: CloudinaryOptions = {}): string {
  if (!src) return "";

  const transform = buildTransform(options);
  const parsed = parseCloudinaryUrl(src);

  if (parsed) {
    // An explicit transform already in the URL wins — don't fight a caller
    // (or a CMS editor) who asked for something specific.
    if (parsed.existingTransform) return src;
    return `${parsed.base}${transform}/${parsed.path}`;
  }

  // Not a URL at all: treat it as a public id, which needs the cloud name.
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!src.startsWith("http") && cloudName) {
    return `https://${CLOUDINARY_HOST}/${cloudName}/image/upload/${transform}/${src}`;
  }

  return src;
}

/**
 * next/image loader. Passing this makes <Image> emit Cloudinary URLs (and a
 * Cloudinary-backed srcset) instead of routing through /_next/image.
 *
 * That matters for more than tidiness: with the default optimizer the Next
 * server fetches the full-size original and re-encodes it itself on every
 * cache miss — CPU and egress we're paying for twice, on an asset a CDN edge
 * could have served already. It also can't do `f_auto`, because by then the
 * browser's Accept header is gone.
 */
export function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (!isCloudinaryUrl(src)) return src;
  return getCloudinaryUrl(src, { crop: "limit", quality: quality ?? "auto", width });
}

// ---- delivery presets ---------------------------------------------------

/**
 * Named presets, one per real surface in this storefront.
 *
 * A preset pairs the crop behaviour with the `sizes` string that surface
 * actually lays out — the two have to agree, and splitting them across call
 * sites is how a 220px card ends up requesting a 1600px derivative. Declaring
 * intent once ("this is a product card") keeps every instance of that surface
 * consistent and makes a layout change a one-line edit here.
 *
 * `crop`:
 *   fill  — exact box, subject-aware via gravity (cards, thumbs, banners)
 *   limit — never upscales, preserves the whole frame (PDP hero, zoom)
 */
export type ImagePreset = {
  crop: CloudinaryCrop;
  sizes: string;
  gravity?: string;
};

const PRESET_DEFINITIONS = {
  /** Catalogue / rail / homepage product cards. Two-up on phones. */
  productCard: {
    crop: "fill",
    sizes: "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px",
  },
  /** PDP main image — the LCP element on a product page. */
  productMain: {
    crop: "limit",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px",
  },
  /** PDP gallery thumbnails. Deliberately tiny. */
  productThumbnail: {
    crop: "fill",
    sizes: "160px",
  },
  /** Full-bleed hero. Wide but never the 4000px original. */
  hero: {
    crop: "fill",
    gravity: "auto",
    sizes: "100vw",
  },
  /** Marketing banners and campaign tiles — subject-aware so a crop to a
   * different aspect on mobile doesn't decapitate the product shot. */
  marketing: {
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 768px) 100vw, 1200px",
  },
  /** Editorial half-tiles (CtaPair, SummerEdit, DermoCorner). */
  editorial: {
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
  /** Brand logos and marquee entries. */
  brand: {
    crop: "fit",
    sizes: "(max-width: 640px) 40vw, 240px",
  },
  /** Category / collection tiles. */
  category: {
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 640px) 50vw, 33vw",
  },
  /** Small square avatars: cart lines, mega-menu promos, Instagram grid. */
  thumb: {
    crop: "fill",
    sizes: "120px",
  },
} as const satisfies Record<string, ImagePreset>;

export type ImagePresetName = keyof typeof PRESET_DEFINITIONS;

// Re-exported through the widened type: `as const satisfies` keeps the key
// names (which is what ImagePresetName needs) but narrows each entry to its
// own literal shape, so entries without `gravity` wouldn't expose the
// property at all. Widening here gives every preset the full ImagePreset
// type while the keys stay exact.
export const IMAGE_PRESETS: Record<ImagePresetName, ImagePreset> = PRESET_DEFINITIONS;

/**
 * Direct transformed URL for a named preset at an explicit width.
 *
 * Most call sites should use <CloudinaryImage preset="..."> instead, which
 * lets next/image emit a full srcset. This is for the cases that need a
 * single concrete URL — a CSS background, an og:image, a preload hint.
 * Deterministic by construction: same input, same URL, so Cloudinary's CDN
 * and the browser cache both hit.
 */
export function presetUrl(src: string | null | undefined, preset: ImagePresetName, width: number): string {
  const { crop, gravity } = IMAGE_PRESETS[preset];
  return getCloudinaryUrl(src, { crop, gravity, width });
}

// The §17 named helpers, expressed against the presets above so there is one
// definition of each surface's crop rather than two that can drift.
export const productCardImage = (src?: string | null, w = 400) => presetUrl(src, "productCard", w);
export const productMainImage = (src?: string | null, w = 900) => presetUrl(src, "productMain", w);
export const productThumbnail = (src?: string | null, w = 180) => presetUrl(src, "productThumbnail", w);
export const productZoomImage = (src?: string | null, w = 1600) => presetUrl(src, "productMain", w);
export const heroImage = (src?: string | null, w = 1600) => presetUrl(src, "hero", w);
export const marketingImage = (src?: string | null, w = 1200) => presetUrl(src, "marketing", w);
export const brandImage = (src?: string | null, w = 240) => presetUrl(src, "brand", w);
export const categoryImage = (src?: string | null, w = 600) => presetUrl(src, "category", w);
