"use client";

import { ArrowRight, Baby, Droplets, Scissors, Sparkles, Sun, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudinaryImage } from "@/components/CloudinaryImage";

/**
 * "Trouvez votre rituel" — the way out of a dead end.
 *
 * Around eighty of the mega-menu's /shop/* links point at sub-categories and
 * needs that no product carries yet (Products.category is a nine-value enum,
 * far narrower than the nav taxonomy). Those pages used to show one sentence
 * — "cette catégorie sera bientôt disponible" — and nothing to do next. This
 * turns the empty state into an entry point: the five aisles that do hold
 * products, each with a picture and a way in.
 *
 * The expanding-card behaviour is the interactive-selector pattern: the
 * chosen card takes `flex: 7`, the rest keep `flex: 1` and stay visible, and
 * only the chosen one shows its copy. None of the reference's chrome came
 * with it — no full-height stage, no near-black ground, no white 2px borders.
 *
 * Below 720px the cards stack and expand in height instead: five columns in a
 * 375px viewport would be 60px each, which is a row of slivers, not a choice.
 */

type Ritual = {
  blurb: string;
  icon: LucideIcon;
  image: string;
  slug: string;
  title: string;
};

const SHOT = (name: string) => `https://res.cloudinary.com/draqxinrp/image/upload/para-dhiver/${name}`;

// Every slug here is one of REAL_CATEGORY_BY_SLUG in app/(site)/shop/[slug] —
// these five land on a filtered grid with products in it, which is the whole
// point of offering them as the way out.
const RITUALS: Ritual[] = [
  {
    blurb: "Nettoyer, hydrater et prendre soin de votre peau",
    icon: Droplets,
    image: SHOT("visage.png"),
    slug: "visage",
    title: "Visage",
  },
  {
    blurb: "Hydratation, soins et bien-être au quotidien",
    icon: Sparkles,
    image: SHOT("dermo.png"),
    slug: "corps",
    title: "Corps",
  },
  {
    blurb: "Des cheveux plus forts, beaux et en pleine santé",
    icon: Scissors,
    image: SHOT("cheveux.png"),
    slug: "cheveux",
    title: "Cheveux",
  },
  {
    blurb: "Protégez votre peau toute l'année",
    icon: Sun,
    image: SHOT("solaire.png"),
    slug: "solaire",
    title: "Solaire",
  },
  {
    blurb: "Des soins doux pour toute la famille",
    icon: Baby,
    image: SHOT("baby.png"),
    slug: "bebe-maman",
    title: "Bébé & Maman",
  },
];

export function RitualSelector({ activeSlug }: { activeSlug?: string }) {
  // Opens on the aisle closest to what the visitor asked for when we can tell,
  // otherwise on the first.
  const [active, setActive] = useState(() => {
    const i = RITUALS.findIndex((r) => r.slug === activeSlug);
    return i === -1 ? 0 : i;
  });
  const [revealed, setRevealed] = useState<number[]>([]);

  // Staggered entrance, one card at a time. Cleared on unmount so a fast
  // navigation doesn't leave timers setting state on a dead component.
  useEffect(() => {
    const timers = RITUALS.map((_, i) => setTimeout(() => setRevealed((prev) => [...prev, i]), 90 * i));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section aria-labelledby="rituel-title" className="rituel">
      <div style={{ marginBottom: "clamp(18px,2.2vw,28px)", textAlign: "center" }}>
        <div style={{ color: "var(--pdh-teal)", fontFamily: "var(--font-raleway)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase" }}>
          Trouvez votre rituel
        </div>
        <h2
          id="rituel-title"
          style={{ fontFamily: "var(--font-jost)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 200, margin: "12px 0 0" }}
        >
          Découvrez les soins adaptés à vos envies
        </h2>
      </div>

      <ul className="rituel-rail">
        {RITUALS.map((ritual, i) => {
          const isActive = i === active;
          const Icon = ritual.icon;
          return (
            <li
              className="rituel-card"
              data-active={isActive ? "true" : "false"}
              key={ritual.slug}
              onFocus={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              style={{
                flexGrow: isActive ? 7 : 1,
                opacity: revealed.includes(i) ? 1 : 0,
                transform: revealed.includes(i) ? "none" : "translateX(-40px)",
              }}
            >
              <Link
                aria-current={isActive ? "true" : undefined}
                aria-label={`${ritual.title} — ${ritual.blurb}`}
                className="rituel-link"
                href={`/shop/${ritual.slug}`}
                onClick={() => setActive(i)}
              >
                <CloudinaryImage
                  alt=""
                  className="rituel-shot"
                  crop="fill"
                  fill
                  sizes="(max-width: 720px) 100vw, 620px"
                  src={ritual.image}
                  style={{ objectFit: "cover" }}
                />
                <span aria-hidden="true" className="rituel-scrim" />

                <span className="rituel-body">
                  <span className="rituel-icon">
                    <Icon aria-hidden="true" size={18} strokeWidth={1.6} />
                  </span>
                  <span className="rituel-text">
                    <span className="rituel-name">{ritual.title}</span>
                    <span className="rituel-detail">
                      <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.6, opacity: 0.88 }}>{ritual.blurb}</span>
                      <span
                        style={{
                          alignItems: "center",
                          display: "inline-flex",
                          fontSize: 10.5,
                          fontWeight: 600,
                          gap: 7,
                          letterSpacing: ".14em",
                          marginTop: 12,
                          textTransform: "uppercase",
                        }}
                      >
                        Découvrir les soins
                        <ArrowRight aria-hidden="true" size={13} strokeWidth={2} />
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
