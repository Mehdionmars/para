"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback } from "react";
import {
  getCloudinaryUrl,
  isCloudinaryUrl,
  IMAGE_PRESETS,
  type CloudinaryCrop,
  type ImagePresetName,
} from "@/lib/cloudinary";

/** Shown when a product genuinely has no photo yet. Never a stand-in
 * "lifestyle" shot — that would misrepresent a product nobody has seen. */
export const PRODUCT_PLACEHOLDER = "/assets/product-placeholder.svg";

type Props = Omit<ImageProps, "src" | "loader" | "alt"> & {
  /** A Cloudinary delivery URL, a bare public id, or a local path. */
  src: string | null | undefined;
  /** Required — pass "" only for decorative images already labelled by an
   * adjacent link, so screen readers don't hear the name twice. */
  alt: string;
  /** Cards crop to a square ("fill"); PDP/hero should never upscale ("limit"). */
  crop?: CloudinaryCrop;
  /** Names the surface this image belongs to, supplying both `crop` and
   * `sizes` from lib/cloudinary's IMAGE_PRESETS. An explicit `crop`/`sizes`
   * prop still wins, for the odd one-off. */
  preset?: ImagePresetName;
  /** Used when `src` is empty. Defaults to the product placeholder. */
  fallbackSrc?: string;
};

/**
 * next/image wrapper that routes Cloudinary assets through Cloudinary's own
 * transformation + CDN instead of the Next image optimizer, and degrades to
 * a placeholder rather than a broken image.
 *
 * The raw (untransformed) URL is handed to <Image> on purpose: next/image
 * calls the loader once per srcset width, and the loader is the single place
 * that builds a transformation. Pre-transforming the src here instead would
 * hand the loader an already-transformed URL, which it must leave alone —
 * and every srcset entry would collapse to the same size.
 *
 * Non-Cloudinary sources (the local placeholder, Instagram CDN URLs) fall
 * through to the default optimizer untouched, so this is safe to use
 * everywhere without checking the source first.
 */
export function CloudinaryImage({
  src,
  alt,
  crop,
  preset,
  sizes,
  fallbackSrc = PRODUCT_PLACEHOLDER,
  ...rest
}: Props) {
  const resolved = src || fallbackSrc;
  const presetConfig = preset ? IMAGE_PRESETS[preset] : undefined;

  const effectiveCrop: CloudinaryCrop = crop ?? presetConfig?.crop ?? "fill";
  const effectiveGravity = presetConfig?.gravity;
  const effectiveSizes = sizes ?? presetConfig?.sizes;

  // Closes over the resolved crop/gravity so each call site keeps its own
  // framing while still going through the one URL builder.
  const loader = useCallback(
    ({ src: loaderSrc, width, quality }: { src: string; width: number; quality?: number }) =>
      isCloudinaryUrl(loaderSrc)
        ? getCloudinaryUrl(loaderSrc, {
            crop: effectiveCrop,
            gravity: effectiveGravity,
            quality: quality ?? "auto",
            width,
          })
        : loaderSrc,
    [effectiveCrop, effectiveGravity],
  );

  if (!isCloudinaryUrl(resolved)) {
    return <Image src={resolved} alt={alt} sizes={effectiveSizes} {...rest} />;
  }

  return <Image {...rest} alt={alt} loader={loader} sizes={effectiveSizes} src={resolved} />;
}
