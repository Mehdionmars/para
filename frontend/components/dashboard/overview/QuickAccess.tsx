"use client";

import { Clock, CornerDownLeft, Loader2, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { globalSearch, type SearchGroup } from "@/app/dashboard/(app)/search-actions";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { visibleNavGroups } from "@/lib/dashboard/nav";
import { parseRecent, readRecent, subscribeRecent } from "@/lib/dashboard/recent";
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
  "Un produit, une commande, un client…",
  "Effaclar, PDH-260902, Sara…",
  "Changer le logo du site",
  "Les rendez-vous de demain",
  "Créer un code promo",
];

/** Lowercase, accents stripped: "Paramètres" matches "parametres". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function ago(at: number): string {
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

type Row = { href: string; title: string; detail: string; group: string };

/**
 * The dashboard's landing page: a search over everything, then every
 * destination as an icon with its label.
 *
 * The field searches the pages (the sidebar's own list, lib/dashboard/nav.ts,
 * filtered by the same roles) and, from two letters on, the products,
 * orders, customers and appointments the operator's role may read. With the
 * field empty, the panel lists the pages visited last. Arrows move through
 * the results, Enter opens one, Escape closes the panel; Enter with no
 * result searches the products, so the field is never a dead end.
 */
export function QuickAccess({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<{ q: string; groups: SearchGroup[] }>({ groups: [], q: "" });
  const latest = useRef("");

  const recentRaw = useSyncExternalStore(subscribeRecent, readRecent, () => "[]");
  const recent = useMemo(() => parseRecent(recentRaw), [recentRaw]);

  const items = useMemo(
    () =>
      visibleNavGroups({ roles }).flatMap((group) =>
        group.items
          .filter((item) => item.href !== "/dashboard")
          .map((item) => ({ ...item, group: group.label, haystack: fold(`${item.label} ${group.label} ${KEYWORDS[item.href] ?? ""}`) })),
      ),
    [roles],
  );

  const trimmed = query.trim();
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const shown = terms.length === 0 ? items : items.filter((item) => terms.every((t) => item.haystack.includes(t)));

  // The data search, debounced; a slower answer to an older query is dropped.
  useEffect(() => {
    latest.current = trimmed;
    if (trimmed.length < 2) return;
    const timer = setTimeout(async () => {
      const groups = await globalSearch(trimmed).catch(() => []);
      if (latest.current === trimmed) setRemote({ groups, q: trimmed });
    }, 220);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const loading = trimmed.length >= 2 && remote.q !== trimmed;
  const groups: { label: string; rows: Row[] }[] =
    trimmed.length === 0
      ? [{ label: "Récemment visités", rows: recent.map((v) => ({ detail: ago(v.at), group: "recent", href: v.href, title: v.label })) }]
      : [
          { label: "Pages", rows: shown.slice(0, 5).map((p) => ({ detail: p.group, group: "page", href: p.href, title: p.label })) },
          ...(remote.q === trimmed ? remote.groups : []).map((g) => ({
            label: g.label,
            rows: g.hits.map((h) => ({ ...h, group: g.label })),
          })),
        ].filter((g) => g.rows.length > 0);
  const rows = groups.flatMap((g) => g.rows);
  const current = Math.min(active, Math.max(rows.length - 1, 0));
  const panelOpen = focused && (rows.length > 0 || trimmed.length > 0);

  function open(href: string) {
    setFocused(false);
    router.push(href);
  }

  function submit(value: string) {
    if (rows[current]) open(rows[current].href);
    else if (value.trim()) open(`/dashboard/products?search=${encodeURIComponent(value.trim())}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (rows.length === 0) return;
      setActive((current + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length);
    } else if (e.key === "Escape") {
      if (query) setQuery("");
      else (e.target as HTMLInputElement).blur();
    }
  }

  let index = -1;

  return (
    <div className="flex flex-col items-center gap-10">
      <motion.div
        className="relative z-20 w-full max-w-2xl"
        initial={reducedMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ damping: 20, stiffness: 220, type: "spring" }}
      >
        <AIChatInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setActive(0);
          }}
          onSubmit={submit}
          onKeyDown={onKeyDown}
          onFocusChange={setFocused}
          placeholders={PLACEHOLDERS}
          label="Rechercher dans le dashboard"
          inputProps={{
            "aria-activedescendant": panelOpen && rows[current] ? `${listId}-${current}` : undefined,
            "aria-autocomplete": "list",
            "aria-controls": listId,
            "aria-expanded": panelOpen,
            role: "combobox",
          }}
        />

        <AnimatePresence>
          {panelOpen && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.98, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 }, y: -6 }}
              transition={{ damping: 24, stiffness: 340, type: "spring" }}
              className="absolute inset-x-0 top-full mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl"
            >
              <div id={listId} role="listbox" aria-label="Résultats">
                {groups.map((g) => (
                  <div key={g.label} role="group" aria-label={g.label} className="py-1">
                    <p className="flex items-center gap-1.5 px-3 pt-1 pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {g.label === "Récemment visités" && <Clock className="size-3.5" aria-hidden="true" />}
                      {g.label}
                    </p>
                    {g.rows.map((r) => {
                      index++;
                      const i = index;
                      const isActive = i === current;
                      return (
                        <button
                          key={`${g.label}-${r.href}-${r.title}`}
                          id={`${listId}-${i}`}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          // Keeps focus in the field, so the panel stays open
                          // until the navigation.
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => open(r.href)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isActive ? "bg-accent text-foreground" : "text-foreground"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">{r.title}</span>
                          {r.detail && <span className="max-w-[45%] flex-none truncate text-xs text-muted-foreground">{r.detail}</span>}
                          {isActive && <CornerDownLeft className="size-3.5 flex-none text-muted-foreground" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {trimmed.length === 0 && recent.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">Les pages que vous ouvrez apparaîtront ici.</p>
                )}
                {loading && (
                  <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Recherche dans les produits, commandes, clients…
                  </p>
                )}
                {trimmed.length > 0 && !loading && rows.length === 0 && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => submit(query)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
                  >
                    <Search className="size-4" aria-hidden="true" /> Aucun résultat — chercher « {trimmed} » dans les produits
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
