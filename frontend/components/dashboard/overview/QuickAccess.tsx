"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { visibleNavGroups } from "@/lib/dashboard/nav";
import type { Role } from "@/lib/dashboard/roles";

/** One icon colour per group, so the grid still reads by section with no
 * heading and no frame. Token-based, so dark mode follows. */
const GROUP_ICON: Record<string, string> = {
  Boutique: "text-primary",
  Catalogue: "text-success-strong",
  Pilotage: "text-foreground",
  Système: "text-muted-foreground",
  Ventes: "text-warning-strong",
};

/** Words people type for a destination that its label does not contain. */
const KEYWORDS: Record<string, string> = {
  "/dashboard/analytics": "statistiques stats ventes chiffres",
  "/dashboard/bookings": "rdv rendez vous reservation services agenda",
  "/dashboard/coffrets": "cadeau cadeaux coffret gift",
  "/dashboard/coupons": "code promo reduction remise",
  "/dashboard/customers": "client acheteur",
  "/dashboard/import": "excel csv fichier import",
  "/dashboard/inventory": "stock rupture reapprovisionner",
  "/dashboard/invoices": "facture recu",
  "/dashboard/notifications": "alerte email",
  "/dashboard/orders": "commande livraison",
  "/dashboard/overview": "kpi chiffres resume",
  "/dashboard/settings": "parametres reglages paiement",
  "/dashboard/storefront": "site accueil page banniere hero rayon",
  "/dashboard/storefront?tab=global&panel=logo": "logo marque image",
};

const PLACEHOLDERS = [
  "Commandes, rendez-vous, produits…",
  "Changer le logo du site",
  "Ajouter un produit",
  "Voir les coffrets & cadeaux",
  "Créer un code promo",
  "Rechercher un produit par son nom",
];

/** Lowercase, accents stripped: "Paramètres" matches "parametres". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/**
 * The dashboard's landing page: a search field, then every destination as an
 * icon with its label — no frame, spread over a wide grid.
 *
 * The list is the sidebar's own (lib/dashboard/nav.ts), filtered by the same
 * roles, so an icon never leads to a page the user cannot open. "Tableau de
 * bord" is left out — it is this page.
 *
 * Typing filters the icons as you go. Enter opens the first one left; when
 * nothing matches, the words are searched in the products instead, so the
 * field is never a dead end.
 */
export function QuickAccess({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");

  const items = useMemo(
    () =>
      visibleNavGroups({ roles }).flatMap((group) =>
        group.items
          .filter((item) => item.href !== "/dashboard")
          .map((item) => ({ ...item, group: group.label, haystack: fold(`${item.label} ${group.label} ${KEYWORDS[item.href] ?? ""}`) })),
      ),
    [roles],
  );

  const terms = fold(query).split(/\s+/).filter(Boolean);
  const shown = terms.length === 0 ? items : items.filter((item) => terms.every((t) => item.haystack.includes(t)));

  function submit(value: string) {
    if (shown.length > 0 && terms.length > 0) router.push(shown[0].href);
    else if (value.trim()) router.push(`/dashboard/products?search=${encodeURIComponent(value.trim())}`);
  }

  return (
    <div className="flex flex-col items-center gap-10">
      <motion.div
        className="w-full max-w-2xl"
        initial={reducedMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ damping: 20, stiffness: 220, type: "spring" }}
      >
        <AIChatInput value={query} onChange={setQuery} onSubmit={submit} placeholders={PLACEHOLDERS} label="Rechercher une page ou un produit" />
        <p className="mt-2 h-5 text-center text-xs text-muted-foreground" aria-live="polite">
          {terms.length > 0 &&
            (shown.length > 0
              ? `Entrée pour ouvrir « ${shown[0].label} »`
              : `Aucune page ne correspond — Entrée pour chercher « ${query.trim()} » dans les produits`)}
        </p>
      </motion.div>

      <nav aria-label="Accès rapide" className="w-full max-w-6xl">
        <motion.ul layout className="grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          <AnimatePresence mode="popLayout" initial={!reducedMotion}>
            {shown.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.href}
                  layout
                  initial={{ opacity: 0, scale: 0.6, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
                  transition={{ damping: 16, delay: query ? 0 : i * 0.035, stiffness: 260, type: "spring" }}
                >
                  <Link
                    href={item.href}
                    className="qa-card group flex flex-col items-center gap-2.5 rounded-2xl px-2 py-4 text-center text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Icon className={`qa-icon size-8 ${GROUP_ICON[item.group] ?? "text-foreground"}`} strokeWidth={1.6} aria-hidden="true" />
                    <span className="leading-tight">{item.label}</span>
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </nav>
    </div>
  );
}
