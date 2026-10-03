/**
 * The 19 aisles, grouped the way a pharmacist would point to them.
 *
 * Slugs and labels mirror backend/src/collections/Products.ts
 * (SUB_CATEGORY_OPTIONS): the backend list is the one to read when adding.
 * The grouping is the only thing this file decides, and it is deliberately
 * code, not CMS content — the aisles themselves are fixed by the enum, so an
 * editor has nothing to rearrange here and nothing to break.
 */
export type Aisle = { slug: string; label: string };
export type AisleGroup = { title: string; href: string; aisles: Aisle[] };

export const AISLE_GROUPS: AisleGroup[] = [
  {
    title: "Visage",
    href: "/shop/visage",
    aisles: [
      { slug: "purifiants", label: "Acné & imperfections" },
      { slug: "peaux-sensibles", label: "Rougeurs & rosacée" },
      { slug: "peaux-seches", label: "Peaux sèches & atopiques" },
      { slug: "anti-taches", label: "Taches & éclat" },
      { slug: "anti-age", label: "Anti-âge" },
      { slug: "nettoyants", label: "Nettoyants" },
      { slug: "demaquillants", label: "Démaquillants" },
      { slug: "peelings-doux", label: "Peelings & gommages" },
    ],
  },
  {
    title: "Cheveux",
    href: "/shop/cheveux",
    aisles: [
      { slug: "chute-de-cheveux", label: "Chute de cheveux" },
      { slug: "shampoings-traitants", label: "Shampooings" },
      { slug: "apres-shampoings", label: "Après-shampooing" },
      { slug: "masques-capillaires", label: "Masques capillaires" },
      { slug: "cheveux-ongles", label: "Cils & sourcils" },
    ],
  },
  {
    title: "Corps",
    href: "/shop/corps",
    aisles: [
      { slug: "solaire", label: "Solaires" },
      { slug: "cremes-cicatrisantes", label: "Cicatrisants" },
      { slug: "laits-corps", label: "Laits & baumes" },
      { slug: "apres-epilation", label: "Épilation & après" },
      { slug: "soins-mains-pieds", label: "Mains & pieds" },
      { slug: "hygiene-intime", label: "Hygiène intime" },
    ],
  },
];
