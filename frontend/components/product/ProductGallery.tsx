"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { type KeyboardEvent, type TouchEvent, useEffect, useRef, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { ProductBadges } from "@/components/product/ProductBadges";
import { type Product, productGalleryImages } from "@/data/products";

/** Horizontal travel, in px, before a touch counts as a swipe rather than a
 * tap or the start of a vertical scroll. */
const SWIPE_THRESHOLD = 40;

/**
 * Remembers where a touch started and turns a mostly-horizontal stroke into
 * previous/next. Vertical strokes and pinches are left to the page: the frame
 * declares `touch-action: pan-y pinch-zoom`, and nothing here calls
 * preventDefault.
 */
function useSwipe(onPrev: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      start.current = t ? { x: t.clientX, y: t.clientY } : null;
    },
    onTouchEnd(e: TouchEvent) {
      const from = start.current;
      const t = e.changedTouches[0];
      start.current = null;
      if (!from || !t) return;
      const dx = t.clientX - from.x;
      const dy = t.clientY - from.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) onNext();
      else onPrev();
    },
  };
}

/**
 * The product's photographs.
 *
 * Two things it must not do, both of which it used to. It framed the hero as
 * a full-width 1:1 square, so on a laptop the image alone stood ~600px tall
 * and pushed the price, the option selector and the buy button below the
 * fold — the shopper met the product and had to scroll to find out what it
 * cost. And it drew that image with `object-fit: cover`, which crops a
 * packshot to fill the square: the very margins a product photo is composed
 * with, and sometimes the cap or the base.
 *
 * The frame is now bounded by the viewport (never taller than it, and always
 * shorter than the buy panel beside it), and the photo is contained inside
 * it at its own proportions.
 *
 * With several photos, the hero itself moves between them — arrows, a swipe
 * on touch screens, the arrow keys once it has focus — and says where it is
 * ("2 / 6"). The thumbnails alone made a phone shopper aim at 64px targets
 * under their thumb to see the next picture. The magnifier opens the current
 * photo full screen, where a packshot's label can actually be read.
 */
export function ProductGallery({
  product,
  images,
  /** Overrides the hero when the selected option has a photo of its own. */
  variantImage = "",
}: {
  product: Product;
  /** From the live Payload fetch. Callers on the static snapshot omit it. */
  images?: string[];
  variantImage?: string;
}) {
  const gallery = images?.length ? images : productGalleryImages(product.id);
  const count = gallery.length;
  const [active, setActive] = useState(0);
  // An option photo that is not one of the gallery shots is shown in the
  // hero until the shopper moves to another photo themselves.
  const [showVariant, setShowVariant] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Selecting an option that ships its own photo moves the hero to it. If the
  // shopper then picks a thumbnail, that wins until the option changes again.
  useEffect(() => {
    if (!variantImage) return;
    const at = gallery.indexOf(variantImage);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(at === -1 ? 0 : at);
    setShowVariant(at === -1);
  }, [variantImage, gallery]);

  const variantOutsideGallery = showVariant && !!variantImage && gallery.indexOf(variantImage) === -1;
  const hero = variantOutsideGallery ? variantImage : gallery[active];

  const wrap = (index: number) => ((index % count) + count) % count;
  function go(index: number) {
    setShowVariant(false);
    setActive(wrap(index));
  }
  // From the latest index, not the one this render closed over: two quick
  // presses before a re-render must move two photos, not one.
  function step(delta: number) {
    setShowVariant(false);
    setActive((current) => wrap(current + delta));
  }
  const prev = () => step(-1);
  const next = () => step(1);
  const swipe = useSwipe(prev, next);

  // Keep the selected thumbnail in view when the row scrolls (phones), by
  // scrolling the row only — scrollIntoView would also move the page.
  useEffect(() => {
    const row = thumbsRef.current;
    const thumb = row?.children[active] as HTMLElement | undefined;
    if (!row || !thumb || row.scrollWidth <= row.clientWidth) return;
    const left = thumb.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + thumb.offsetWidth > row.scrollLeft + row.clientWidth) {
      const centred = left - (row.clientWidth - thumb.offsetWidth) / 2;
      const furthest = row.scrollWidth - row.clientWidth;
      const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      row.scrollTo({ behavior: calm ? "auto" : "smooth", left: Math.max(0, Math.min(centred, furthest)) });
    }
  }, [active]);

  function onKeyDown(e: KeyboardEvent) {
    if (count < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  }

  const position = variantOutsideGallery ? null : `${active + 1} / ${count}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        aria-label={count > 1 ? `Photos du produit, ${position ?? "photo de l'option"}` : undefined}
        aria-roledescription={count > 1 ? "carrousel" : undefined}
        className="pdp-media"
        onKeyDown={onKeyDown}
        role={count > 1 ? "region" : undefined}
        tabIndex={count > 1 ? 0 : undefined}
        {...(count > 1 ? swipe : {})}
      >
        {/* The PDP hero is the LCP element: `priority` preloads it, and
            c_limit means a smaller original is never upscaled. */}
        <CloudinaryImage
          alt={product.name}
          crop="limit"
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 620px"
          src={hero}
          style={{ objectFit: "contain" }}
        />
        <ProductBadges badges={product.badges} oldPrice={product.old || null} price={product.price} />

        <button
          aria-label="Agrandir la photo"
          className="pdp-media-btn pdp-media-zoom"
          onClick={() => dialogRef.current?.showModal()}
          type="button"
        >
          <ZoomIn aria-hidden="true" size={18} />
        </button>

        {count > 1 && (
          <>
            <button aria-label="Photo précédente" className="pdp-media-btn pdp-media-nav" data-dir="prev" onClick={prev} type="button">
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <button aria-label="Photo suivante" className="pdp-media-btn pdp-media-nav" data-dir="next" onClick={next} type="button">
              <ChevronRight aria-hidden="true" size={20} />
            </button>
            {position && (
              <span aria-hidden="true" className="pdp-media-count">
                {position}
              </span>
            )}
          </>
        )}
      </div>

      {count > 1 && (
        <div className="pdp-thumbs" ref={thumbsRef}>
          {gallery.map((src, i) => (
            <button
              aria-label={`Voir l'image ${i + 1}`}
              aria-pressed={active === i && !variantOutsideGallery}
              className="pdp-thumb"
              key={src + i}
              onClick={() => go(i)}
              style={{
                borderColor: active === i && !variantOutsideGallery ? "var(--pdh-plum)" : "var(--pdh-plum-tint)",
              }}
              type="button"
            >
              {/* Thumbnails are tiny — 160px is plenty, and lazy by default.
                  contain here too: a cropped thumbnail of a contained hero
                  shows a different shape than the image it selects. */}
              <CloudinaryImage alt="" crop="limit" fill sizes="160px" src={src} style={{ objectFit: "contain" }} />
            </button>
          ))}
        </div>
      )}

      {/* Native <dialog>: showModal() gives the focus trap, Escape to close
          and an inert page behind it without any of that being rebuilt here. */}
      <dialog
        aria-label={`${product.name} — photo agrandie`}
        className="pdp-lightbox"
        onClick={(e) => {
          // A click on the dark surround (the dialog itself), not on the photo
          // or a control, closes it.
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
        onKeyDown={onKeyDown}
        ref={dialogRef}
      >
        <div className="pdp-lightbox-frame" {...(count > 1 ? swipe : {})}>
          <CloudinaryImage alt={product.name} crop="limit" fill sizes="100vw" src={hero} style={{ objectFit: "contain" }} />
        </div>
        <button
          aria-label="Fermer"
          className="pdp-media-btn pdp-lightbox-close"
          onClick={() => dialogRef.current?.close()}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
        {count > 1 && (
          <>
            <button aria-label="Photo précédente" className="pdp-media-btn pdp-media-nav" data-dir="prev" onClick={prev} type="button">
              <ChevronLeft aria-hidden="true" size={22} />
            </button>
            <button aria-label="Photo suivante" className="pdp-media-btn pdp-media-nav" data-dir="next" onClick={next} type="button">
              <ChevronRight aria-hidden="true" size={22} />
            </button>
            {position && (
              <span aria-live="polite" className="pdp-media-count">
                {position}
              </span>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
