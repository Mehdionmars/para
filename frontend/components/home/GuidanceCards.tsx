import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/routes";

/**
 * "Besoin d'un coup de pouce ?" — the popular aisles as a row of label cards.
 *
 * Name top-left, a two-line drawing bottom-right (teal for the object, plum for
 * the detail that says what it is for). The drawings are inline SVG on a 64
 * grid: no image to host, no icon-font, and an editor cannot break them. The
 * list is code, like the aisle index: the aisles themselves are fixed.
 */
type Card = { label: string; slug: string; icon: ReactNode };

const CARDS: Card[] = [
  {
    label: "Soldes",
    slug: "soldes",
    icon: (
      <>
        <path className="a" d="M12 34 34 12h18v18L30 52Z" />
        <circle className="b" cx="44" cy="20" r="2.6" />
        <path className="b" d="m25 41 12-12" />
        <circle className="b" cx="27" cy="31" r="1.8" />
        <circle className="b" cx="35" cy="39" r="1.8" />
      </>
    ),
  },
  {
    label: "Visage",
    slug: "visage",
    icon: (
      <>
        <ellipse className="a" cx="30" cy="34" rx="15" ry="19" />
        <path className="b" d="M23 31q2.5-2.5 5 0M33 31q2.5-2.5 5 0M25 42q5 4.5 10 0" />
        <path className="b" d="M52 10v9M47.5 14.5h9" />
      </>
    ),
  },
  {
    label: "Cheveux",
    slug: "cheveux",
    icon: (
      <>
        <rect className="a" x="16" y="24" width="22" height="32" rx="4" />
        <path className="a" d="M22 24v-6h10v6M22 18v-6h12" />
        <path className="b" d="M21 36h12M21 43h12" />
        <path className="b" d="M48 22q-5 5 0 10t0 10" />
      </>
    ),
  },
  {
    label: "Corps",
    slug: "corps",
    icon: (
      <>
        <rect className="a" x="18" y="28" width="26" height="28" rx="5" />
        <path className="a" d="M25 28v-6h12v6M31 22v-8h10v4" />
        <path className="b" d="M31 36c-4 5-5 8-5 10a5 5 0 0 0 10 0c0-2-1-5-5-10Z" />
        <path className="b" d="M52 34v10M47 39h10" />
      </>
    ),
  },
  {
    label: "Solaire",
    slug: "solaire",
    icon: (
      <>
        <circle className="a" cx="32" cy="32" r="10" />
        <path
          className="b"
          d="M32 9v7M32 48v7M9 32h7M48 32h7M15.7 15.7l5 5M43.3 43.3l5 5M15.7 48.3l5-5M43.3 20.7l5-5"
        />
      </>
    ),
  },
  {
    label: "K Beauty",
    slug: "k-beauty",
    icon: (
      <>
        <rect className="a" x="12" y="32" width="38" height="20" rx="4" />
        <path className="a" d="M14 32v-6a2 2 0 0 1 2-2h30a2 2 0 0 1 2 2v6" />
        <path className="b" d="M31 47c-6-4-8-6-8-9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3-2 5-8 9Z" />
        <path className="b" d="M54 12v8M50 16h8" />
      </>
    ),
  },
  {
    label: "Maquillage",
    slug: "maquillage",
    icon: (
      <>
        <rect className="a" x="34" y="34" width="14" height="20" rx="2" />
        <path className="a" d="M36 34v-8h10v8" />
        <path className="b" d="M37 26V16l9-6v16" />
        <path className="a" d="M14 54V34h8v20Z" />
        <path className="b" d="M18 34V12M15 15h6M15 20h6M15 25h6" />
      </>
    ),
  },
  {
    label: "Bébé & Maman",
    slug: "bebe-maman",
    icon: (
      <>
        <rect className="a" x="20" y="28" width="22" height="28" rx="5" />
        <path className="a" d="M22 28v-4h18v4" />
        <path className="b" d="M26 24c0-8 2-12 5-12s5 4 5 12" />
        <path className="b" d="M20 38h7M20 45h7" />
        <path className="b" d="M52 24c-3.500-2-5-4-5-6a3 3 0 0 1 5-1.500A3 3 0 0 1 57 18c0 2-1.500 4-5 6Z" />
      </>
    ),
  },
  {
    label: "Compléments",
    slug: "complements-alimentaires",
    icon: (
      <>
        <rect
          className="a"
          x="10"
          y="26"
          width="44"
          height="16"
          rx="8"
          transform="rotate(-40 32 34)"
        />
        <path className="b" d="M32 26v16" transform="rotate(-40 32 34)" />
        <path className="b" d="M52 10c-8 0-12 4-12 10 8 0 12-4 12-10Z" />
      </>
    ),
  },
  {
    label: "Bucco-dentaire",
    slug: "bucco-dentaire",
    icon: (
      <>
        <path
          className="a"
          d="M18 18c4-4 9-3 14-1 5-2 10-3 14 1 4 7-2 14-2 22-1 8-2 14-5 14-3 0-3-10-7-10s-4 10-7 10c-3 0-4-6-5-14 0-8-6-15-2-22Z"
        />
        <path className="b" d="M52 8v9M47.500 12.500h9" />
      </>
    ),
  },
];

export function GuidanceCards() {
  return (
    <section aria-labelledby="guidance-title" className="guidance">
      <div className="guidance-inner">
        <h2 className="sec-title guidance-title" id="guidance-title">
          Besoin d&apos;un coup de pouce&nbsp;?
        </h2>
        <p className="sec-deck guidance-deck">Voici ce qui plaît en ce moment.</p>

        <ul className="guidance-row">
          {CARDS.map((card) => (
            <li key={card.slug}>
              <Link className="guidance-card" href={routes.category(card.slug)}>
                <span className="guidance-label">{card.label}</span>
                <svg
                  aria-hidden="true"
                  className="guidance-icon"
                  fill="none"
                  focusable="false"
                  viewBox="0 0 64 64"
                >
                  {card.icon}
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
