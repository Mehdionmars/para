import { BRANDS } from "@/data/home";

export function BrandsMarquee({ brands }: { brands?: string[] } = {}) {
  const items = brands && brands.length > 0 ? brands : BRANDS;
  return (
    <section style={{ padding: "clamp(28px,3.6vw,48px) 0", overflow: "hidden" }}>
      <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "0 clamp(14px,3.4vw,32px) clamp(28px,3.6vw,48px)" }}>
        <span
          style={{
            fontFamily: "var(--font-raleway)",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: ".28em",
            textTransform: "uppercase",
            color: "var(--pdh-plum)",
            whiteSpace: "nowrap",
          }}
        >
          Nos marques partenaires
        </span>
      </div>
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          gap: 70,
          whiteSpace: "nowrap",
          animation: "marquee 30s linear infinite",
          fontFamily: "var(--font-jost)",
          fontWeight: 300,
          fontSize: 24,
          letterSpacing: ".16em",
          color: "rgba(94,64,116,.5)",
        }}
      >
        {[...items, ...items].map((b, i) => (
          <span key={i}>{b}</span>
        ))}
      </div>
    </section>
  );
}
