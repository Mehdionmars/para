import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";

export type CtaTile = { eyebrow: string; title: string; bg: string; img: string };

/** Two-up promotional tiles linking to the catalogue. Used twice on the home page. */
export function CtaPair({ tiles, height }: { tiles: CtaTile[]; height: number }) {
  return (
    <section
      style={{
        maxWidth: "min(1280px,100%)",
        margin: "0 auto",
        padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
        gap: "clamp(14px,2vw,24px)",
      }}
    >
      {tiles.map((tile) => (
        <Link
          key={tile.title}
          href="/catalogue"
          className="tile-hover"
          style={{
            position: "relative",
            height,
            borderRadius: 20,
            overflow: "hidden",
            background: tile.bg,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <CloudinaryImage preset="editorial" src={tile.img} alt="" fill sizes="620px" style={{ objectFit: "cover" }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(47,31,61,.55),transparent 62%)" }} />
          <div style={{ position: "relative", zIndex: 3, padding: 32, color: "var(--pdh-cream)", maxWidth: "min(320px,56%)" }}>
            <div style={{ fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.85 }}>
              {tile.eyebrow}
            </div>
            <div style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "clamp(23px,2.8vw,32px)", lineHeight: 1.1, margin: "8px 0 16px" }}>
              {tile.title}
            </div>
            <span className="btn-plum" style={{ display: "inline-block", padding: "11px 24px", fontSize: 11.5, textTransform: "uppercase" }}>
              Découvrir
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
