"use client";

import { BadgeCheck, ChevronLeft, ChevronRight, CreditCard, MessageCircleHeart, Stethoscope, Truck } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CloudinaryImage } from "@/components/CloudinaryImage";

/**
 * The catalogue's editorial furniture.
 *
 * Both CTAs point at pages that exist: /contact for a pharmacist question and
 * /services/1 ("Diagnostic de peau", whose last step is building a routine).
 * There is no /conseils route on this site, and a banner whose button 404s is
 * worse than no banner.
 *
 * The page used to end with seven stacked blocks — editorial tiles, "Besoin
 * d'un conseil ?", "Top marques", a buying guide, "Coffrets & cadeaux", an SEO
 * intro with three link columns, and a trust bar — several of which said the
 * same thing twice. What remains is one of each: a hero, one reassurance
 * strip, two editorial banners, one brands rail, one service strip.
 */

const SHOT = (name: string) => `https://res.cloudinary.com/draqxinrp/image/upload/para-dhiver/${name}`;

// ---------------------------------------------------------------- hero

export function CatalogueHero({ intro, title }: { intro: string; title: string }) {
  return (
    <section className="cat-hero">
      <div className="cat-hero-copy">
        <div style={{ color: "var(--pdh-teal)", fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase" }}>
          Parapharmacie
        </div>
        <h1 style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(30px,4.2vw,50px)", fontWeight: 200, lineHeight: 1.08, margin: "14px 0 0" }}>
          {title}
        </h1>
        <p style={{ fontSize: "clamp(13.5px,1.1vw,15px)", lineHeight: 1.75, margin: "16px 0 0", maxWidth: 460, opacity: 0.66 }}>{intro}</p>
      </div>
      <div className="cat-hero-shot">
        <CloudinaryImage alt="" crop="fill" fill sizes="(max-width: 900px) 100vw, 560px" src={SHOT("coffret-hall.png")} style={{ objectFit: "cover" }} />
      </div>
    </section>
  );
}

// --------------------------------------------------------- reassurance

/**
 * Why buy here. Deliberately distinct from ServiceStrip at the foot of the
 * page, which answers the practical questions (threshold, delay, payment)
 * rather than repeating the same four promises in a second typeface.
 */
const PROMISES = [
  { icon: Stethoscope, label: "Conseils de nos pharmaciens" },
  { icon: BadgeCheck, label: "Produits authentiques" },
  { icon: Truck, label: "Livraison rapide partout au Maroc" },
  { icon: CreditCard, label: "Paiement sécurisé" },
];

export function ReassuranceStrip() {
  return (
    <ul className="cat-promises">
      {PROMISES.map(({ icon: Icon, label }) => (
        <li key={label} style={{ alignItems: "center", display: "flex", gap: 11, minWidth: 0 }}>
          <Icon aria-hidden="true" color="var(--pdh-plum)" size={19} strokeWidth={1.5} style={{ flex: "none" }} />
          <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{label}</span>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------ editorial pair

/**
 * Two banners, same system, different construction: the first sets its copy
 * against a photo on the right, the second inverts to a solid ink panel with
 * no photograph at all. Same radius, same type scale, same button — only the
 * weight changes, which is what stops them reading as one block printed
 * twice.
 */
export function EditorialPair() {
  return (
    <div className="cat-editorial">
      <section className="cat-advice">
        <div style={{ padding: "clamp(24px,2.6vw,38px)" }}>
          <div style={{ color: "var(--pdh-teal)", fontFamily: "var(--font-raleway)", fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase" }}>
            Besoin d&apos;un conseil ?
          </div>
          <h2 style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(21px,2.2vw,28px)", fontWeight: 200, lineHeight: 1.2, margin: "12px 0 10px" }}>
            Nos pharmaciens vous accompagnent dans le choix de vos soins.
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 22px", maxWidth: 340, opacity: 0.66 }}>
            Une routine à composer, un doute sur une association d&apos;actifs&nbsp;? Posez votre question, la réponse est gratuite.
          </p>
          <Link className="btn-plum" href="/contact" style={{ display: "inline-block", fontSize: 11.5, padding: "13px 26px", textTransform: "uppercase" }}>
            Demander conseil
          </Link>
        </div>
        <div className="cat-advice-shot">
          <CloudinaryImage alt="" crop="fill" fill sizes="(max-width: 900px) 100vw, 300px" src={SHOT("arbre-marques.png")} style={{ objectFit: "cover" }} />
        </div>
      </section>

      <section className="cat-routine">
        <div style={{ padding: "clamp(24px,2.6vw,38px)", position: "relative" }}>
          <div style={{ color: "rgba(247,238,229,.72)", fontFamily: "var(--font-raleway)", fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase" }}>
            Routine personnalisée
          </div>
          <h2
            style={{
              color: "var(--pdh-cream)",
              fontFamily: "var(--font-jost)",
              fontSize: "clamp(21px,2.2vw,28px)",
              fontWeight: 200,
              lineHeight: 1.2,
              margin: "12px 0 10px",
            }}
          >
            Trouvez votre routine idéale
          </h2>
          <p style={{ color: "rgba(247,238,229,.78)", fontSize: 13, lineHeight: 1.7, margin: "0 0 22px", maxWidth: 320 }}>
            Trois questions sur votre peau, et nos pharmaciens vous recommandent les produits adaptés.
          </p>
          <Link
            href="/services/1"
            style={{
              background: "var(--pdh-cream)",
              borderRadius: 999,
              color: "var(--pdh-ink)",
              display: "inline-block",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: ".08em",
              padding: "13px 26px",
              textTransform: "uppercase",
            }}
          >
            Découvrir
          </Link>
        </div>
      </section>
    </div>
  );
}

// --------------------------------------------------------------- brands

/**
 * Real marks now that Brands carries a logo, with the composed monogram
 * standing in until each one is uploaded. Names alone were what this rail
 * could show before the field existed.
 */
export function BrandsRail({ brands }: { brands: { logo: string | null; name: string; slug: string }[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  if (brands.length === 0) return null;

  const nudge = (direction: number) => {
    const el = railRef.current;
    if (el) el.scrollBy({ behavior: "smooth", left: direction * Math.max(240, el.clientWidth * 0.7) });
  };

  return (
    <section aria-labelledby="brands-title" style={{ marginTop: "clamp(38px,4.4vw,64px)" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 16, justifyContent: "space-between", marginBottom: 18 }}>
        <h2 id="brands-title" style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(21px,2.4vw,30px)", fontWeight: 200, margin: 0 }}>
          Nos marques partenaires
        </h2>
        <div className="univers-arrows" style={{ display: "flex", gap: 8 }}>
          {[
            { icon: ChevronLeft, label: "Marques précédentes", step: -1 },
            { icon: ChevronRight, label: "Marques suivantes", step: 1 },
          ].map(({ icon: Icon, label, step }) => (
            <button
              aria-label={label}
              className="circle-btn"
              key={label}
              onClick={() => nudge(step)}
              style={{
                alignItems: "center",
                background: "#fff",
                border: "1px solid rgba(94,64,116,.24)",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                height: 38,
                justifyContent: "center",
                width: 38,
              }}
              type="button"
            >
              <Icon aria-hidden="true" color="var(--pdh-plum)" size={16} strokeWidth={1.7} />
            </button>
          ))}
        </div>
      </div>

      <div className="cat-brands" ref={railRef}>
        {brands.map((brand) => (
          <Link aria-label={brand.name} className="cat-brand" href={`/marques/${brand.slug}`} key={brand.slug}>
            {/* The mark names the brand on its own now — a logotype with the
                brand name repeated underneath said it twice. */}
            <BrandLogo logo={brand.logo} name={brand.name} size="sm" slug={brand.slug} />
          </Link>
        ))}
      </div>
    </section>
  );
}

// -------------------------------------------------------- service strip

/**
 * The practical terms, not a second round of promises. `freeFrom` is the real
 * threshold from the shipping_rules table, passed in rather than written here
 * so the page can never advertise a figure the checkout won't honour.
 */
export function ServiceStrip({ freeFrom }: { freeFrom: number }) {
  const items = [
    { icon: Truck, sub: `Dès ${freeFrom} MAD d'achat`, title: "Livraison offerte" },
    { icon: BadgeCheck, sub: "24h à Casablanca, 48h ailleurs", title: "Expédition rapide" },
    { icon: CreditCard, sub: "CMI ou à la livraison", title: "Paiement sécurisé" },
    { icon: MessageCircleHeart, sub: "Nos pharmaciens répondent 7j/7", title: "Une question ?" },
  ];

  return (
    <ul className="cat-services">
      {items.map(({ icon: Icon, sub, title }) => (
        <li key={title} style={{ alignItems: "flex-start", display: "flex", gap: 12, minWidth: 0 }}>
          <Icon aria-hidden="true" color="var(--pdh-plum)" size={18} strokeWidth={1.5} style={{ flex: "none", marginTop: 2 }} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 600 }}>{title}</span>
            <span style={{ display: "block", fontSize: 11.5, marginTop: 3, opacity: 0.6 }}>{sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
