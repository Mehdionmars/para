"use client";

import { Clock, CornerDownLeft, Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { globalSearch, type SearchGroup } from "@/app/dashboard/(app)/search-actions";
import { visibleNavGroups } from "@/lib/dashboard/nav";
import { parseRecent, readRecent, subscribeRecent } from "@/lib/dashboard/recent";
import type { Role } from "@/lib/dashboard/roles";
import { cn } from "@/lib/utils";

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
  "/dashboard/logo": "logo marque image footer pied de page",
  "/dashboard/notifications": "alerte email",
  "/dashboard/orders": "commande livraison",
  "/dashboard/overview": "kpi chiffres resume",
  "/dashboard/settings": "parametres reglages compte mot de passe paiement boutique horaires livraison services equipe",
  "/dashboard/storefront": "site accueil page banniere hero rayon",
};

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

type Row = { href: string; title: string; detail: string };

/**
 * The dashboard's search: one combobox over the pages and the data.
 *
 * It searches the destinations the operator's roles may open (the sidebar's
 * own list, lib/dashboard/nav.ts) and, from two letters on, the products,
 * orders, customers and appointments their session may read — globalSearch
 * runs with that session, so access control decides what comes back. With
 * the field empty the panel lists the pages visited last. Arrows move, Enter
 * opens, Escape clears then closes; Enter with no result searches the
 * products, so the field is never a dead end. "/" or Ctrl+K focuses it from
 * anywhere on the page.
 *
 * Two placements share this one behaviour: `large` heads the dashboard home,
 * `compact` sits in the top bar of every other page and folds to an icon
 * below `sm`, opening over the bar when pressed.
 */
export function DashboardSearch({ roles, variant }: { roles: Role[]; variant: "large" | "compact" }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  // Compact only: the phone layout shows a button until it is pressed.
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<{ q: string; groups: SearchGroup[] }>({ groups: [], q: "" });
  const latest = useRef("");

  const recentRaw = useSyncExternalStore(subscribeRecent, readRecent, () => "[]");
  const recent = useMemo(() => parseRecent(recentRaw), [recentRaw]);

  const pages = useMemo(
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
  const matchingPages = terms.length === 0 ? [] : pages.filter((p) => terms.every((t) => p.haystack.includes(t)));

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

  // "/" and Ctrl/⌘+K focus the field, unless the operator is already typing
  // somewhere else — a slash in a product description must stay a slash.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      const shortcut = (e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing);
      if (!shortcut) return;
      e.preventDefault();
      setExpanded(true);
      // After the expanded field has rendered on a phone.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loading = trimmed.length >= 2 && remote.q !== trimmed;
  const groups: { label: string; rows: Row[] }[] =
    trimmed.length === 0
      ? [{ label: "Récemment visités", rows: recent.map((v) => ({ detail: ago(v.at), href: v.href, title: v.label })) }]
      : [
          { label: "Pages", rows: matchingPages.slice(0, 5).map((p) => ({ detail: p.group, href: p.href, title: p.label })) },
          ...(remote.q === trimmed ? remote.groups : []).map((g) => ({ label: g.label, rows: g.hits })),
        ].filter((g) => g.rows.length > 0);
  const rows = groups.flatMap((g) => g.rows);
  const current = Math.min(active, Math.max(rows.length - 1, 0));
  const panelOpen = focused && (rows.length > 0 || trimmed.length > 0);

  function close() {
    setFocused(false);
    setExpanded(false);
    inputRef.current?.blur();
  }

  function open(href: string) {
    close();
    setQuery("");
    router.push(href);
  }

  function submit() {
    if (rows[current]) open(rows[current].href);
    else if (trimmed) open(`/dashboard/products?search=${encodeURIComponent(trimmed)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (rows.length === 0) return;
      setActive((current + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      if (query) setQuery("");
      else close();
    }
  }

  const large = variant === "large";
  let index = -1;

  const field = (
    <div className={cn("relative w-full min-w-0", large ? "max-w-3xl" : "lg:w-80")}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          large ? "left-3.5 size-[18px]" : "left-2.5 size-4",
        )}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onFocus={() => setFocused(true)}
        // Deferred so a click on a result lands before the panel unmounts.
        onBlur={() =>
          setTimeout(() => {
            setFocused(false);
            // On a phone an empty field folds back to the icon, so a tap
            // elsewhere gives the bar back.
            if (!inputRef.current?.value) setExpanded(false);
          }, 120)
        }
        onKeyDown={onKeyDown}
        placeholder={large ? "Rechercher une page, un produit, une commande, un client…" : "Rechercher…"}
        aria-label="Rechercher dans le dashboard"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={panelOpen}
        aria-activedescendant={panelOpen && rows[current] ? `${listId}-${current}` : undefined}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "w-full min-w-0 rounded-lg border border-input bg-card text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          large ? "h-11 pr-16 pl-10 text-[15px]" : "h-9 pr-12 pl-8 text-sm",
        )}
      />
      {/* The shortcut hint, on devices with a keyboard worth hinting at. */}
      <kbd
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 font-sans text-[11px] leading-5 text-muted-foreground [@media(hover:hover)]:inline-block"
      >
        /
      </kbd>

      {panelOpen && (
        <div
          className={cn(
            "absolute inset-x-0 top-full z-30 mt-1.5 max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg",
            "animate-in fade-in-0 slide-in-from-top-1 duration-100",
            !large && "sm:min-w-96",
          )}
        >
          <div id={listId} role="listbox" aria-label="Résultats de recherche">
            {groups.map((g) => (
              <div key={g.label} role="group" aria-label={g.label} className="py-1">
                <p className="flex items-center gap-1.5 px-2.5 pt-1 pb-1 text-xs font-medium text-muted-foreground">
                  {g.label === "Récemment visités" && <Clock className="size-3.5" aria-hidden="true" />}
                  {g.label}
                </p>
                {g.rows.map((r) => {
                  index++;
                  const i = index;
                  const isActive = i === current;
                  return (
                    <div
                      key={`${g.label}-${r.href}-${r.title}`}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={isActive}
                      // Keeps focus in the field, so the panel stays open until
                      // the navigation.
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => open(r.href)}
                      className={cn(
                        "flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm text-foreground",
                        isActive && "bg-accent",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      {r.detail && <span className="max-w-[45%] flex-none truncate text-xs text-muted-foreground">{r.detail}</span>}
                      <CornerDownLeft className={cn("size-3.5 flex-none text-muted-foreground", !isActive && "invisible")} aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
            ))}

            {trimmed.length === 0 && recent.length === 0 && (
              <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">Les pages que vous ouvrez apparaîtront ici.</p>
            )}
            {loading && (
              <p className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Recherche dans les produits, commandes, clients et rendez-vous…
              </p>
            )}
            {trimmed.length > 0 && !loading && rows.length === 0 && (
              <div
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={submit}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                <Search className="size-4 flex-none" aria-hidden="true" />
                <span className="min-w-0 truncate">Aucun résultat — chercher « {trimmed} » dans les produits</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (large) return field;

  return (
    <>
      {/* Phones: a button in the bar, the field laid over the bar once open. */}
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-label="Rechercher"
        className="inline-flex size-10 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:hidden"
      >
        <Search className="size-[18px]" aria-hidden="true" />
      </button>

      <div
        className={cn(
          "min-w-0 sm:static sm:flex sm:bg-transparent sm:p-0",
          expanded ? "absolute inset-0 z-20 flex items-center gap-2 bg-card px-2" : "hidden",
        )}
      >
        {field}
        <button
          type="button"
          onClick={close}
          aria-label="Fermer la recherche"
          className="inline-flex size-10 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:hidden"
        >
          <X className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
