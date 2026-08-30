import { BRANDS } from "@/data/home";

export function BrandsMarquee({ brands }: { brands?: string[] } = {}) {
  const items = brands && brands.length > 0 ? brands : BRANDS;
  return (
    <section style={{ padding: "var(--sec-pt,var(--sec-y)) 0 var(--sec-pb,var(--sec-y))", overflow: "hidden" }}>
      <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,0px) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
        <span
          style={{
            fontFamily: "var(--font-poppins)",
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
          fontFamily: "var(--font-alta)",
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
