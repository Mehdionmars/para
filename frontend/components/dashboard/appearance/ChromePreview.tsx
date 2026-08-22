"use client";

import type { ChromeColorsDraft } from "@/lib/dashboard/storefront-mapping";

/**
 * A miniature of the page furniture, repainted as the operator types.
 *
 * Deliberately a caricature and not an iframe of the real storefront: the
 * question this answers is "does this palette hold together", and that is
 * legible at 200px in a fraction of the time a real render takes. It reads
 * the same draft the fields write, so nothing has to be saved — which is the
 * whole point, since the alternative is save-look-undo three times per colour.
 *
 * The fallbacks below are the storefront's own current colours, so a surface
 * with nothing configured previews exactly what a visitor sees today.
 */

const DEFAULTS = {
  topBar: { bg: "#373020", text: "#F7EEE5" },
  header: { bg: "#FFFFFF", text: "#373020", icon: "#373020", border: "#E7E1EC", link: "#373020" },
  footer: { bg: "#373020", text: "#F7EEE5", heading: "#FFFFFF", link: "#F7EEE5", border: "#514936" },
} as const;

const pick = (value: string, fallback: string) => (value.trim() ? value.trim() : fallback);

export function ChromePreview({
  topBar,
  header,
  footer,
  /** Dims the two surfaces that aren't being edited, so the operator's eye
   * goes to the one they are changing. */
  focus,
}: {
  topBar: ChromeColorsDraft;
  header: ChromeColorsDraft;
  footer: ChromeColorsDraft;
  focus?: "topBar" | "header" | "footer";
}) {
  const dim = (surface: "topBar" | "header" | "footer") => (focus && focus !== surface ? 0.45 : 1);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-500">
        Aperçu — mise à jour immédiate, aucune sauvegarde nécessaire
      </div>

      {/* ---- top bar ---- */}
      <div
        className="flex items-center justify-center px-3 py-1.5 text-[9px] font-semibold tracking-[0.14em] uppercase"
        style={{
          background: pick(topBar.backgroundColor, DEFAULTS.topBar.bg),
          color: pick(topBar.textColor, DEFAULTS.topBar.text),
          opacity: (topBar.opacity === null ? 100 : topBar.opacity) / 100 * dim("topBar"),
        }}
      >
        Livraison offerte dès 399 MAD
      </div>

      {/* ---- header ---- */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{
          background: pick(header.backgroundColor, DEFAULTS.header.bg),
          borderBottom: `1px solid ${pick(header.borderColor, DEFAULTS.header.border)}`,
          color: pick(header.textColor, DEFAULTS.header.text),
          opacity: dim("header"),
        }}
      >
        <span className="text-[11px] font-semibold tracking-[0.18em]">PARA D&apos;HIVER</span>
        <span className="mx-auto hidden text-[9px] sm:inline" style={{ color: pick(header.linkColor, DEFAULTS.header.link) }}>
          Marques · Visage · Cheveux
        </span>
        <span className="flex gap-1.5" style={{ color: pick(header.iconColor, DEFAULTS.header.icon) }}>
          {/* Two plain glyph-free marks rather than borrowed icons: this is a
              colour swatch in the shape of a header, not a copy of it. */}
          <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-current" />
          <span aria-hidden="true" className="h-3 w-3 rounded-sm border-2 border-current" />
        </span>
      </div>

      {/* ---- page body, so the two dark surfaces are judged against it ---- */}
      <div className="flex h-14 items-center justify-center bg-white text-[10px] text-gray-300">Contenu</div>

      {/* ---- footer ---- */}
      <div
        className="px-3 py-2.5"
        style={{
          background: pick(footer.backgroundColor, DEFAULTS.footer.bg),
          color: pick(footer.textColor, DEFAULTS.footer.text),
          opacity: dim("footer"),
        }}
      >
        <div className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: pick(footer.headingColor, DEFAULTS.footer.heading) }}>
          Boutique
        </div>
        <div className="mt-1 flex gap-2 text-[9px]" style={{ color: pick(footer.linkColor, DEFAULTS.footer.link) }}>
          <span>Produits</span>
          <span>Marques</span>
          <span>Promotions</span>
        </div>
        <div className="mt-2 pt-1.5 text-[8px] opacity-70" style={{ borderTop: `1px solid ${pick(footer.borderColor, DEFAULTS.footer.border)}` }}>
          © Para d&apos;Hiver
        </div>
      </div>
    </div>
  );
}

export { DEFAULTS as CHROME_PREVIEW_DEFAULTS };
