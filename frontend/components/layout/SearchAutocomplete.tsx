"use client";

import { ArrowRight, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { routes } from "@/lib/routes";

export type Suggestions = {
  products: { id: number; name: string; slug: string; price: number; image: string | null; brand: string | null }[];
  brands: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
};

const EMPTY: Suggestions = { brands: [], categories: [], products: [] };
const money = (n: number) => `${new Intl.NumberFormat("fr-MA").format(Math.round(n))} MAD`;

/**
 * Predictive search panel, shared by the desktop header and the mobile
 * overlay so both behave identically.
 *
 * Suggestions start at the *first* character — the point of the feature is
 * that "u" already narrows the catalogue. The 150 ms debounce is short
 * enough to feel immediate while still collapsing a burst of keystrokes into
 * one request; every in-flight request is aborted when the next one starts,
 * so a slow early response can never overwrite a newer one.
 *
 * Implemented as a combobox: arrow keys move through the flattened option
 * list, Enter opens the highlighted one, Escape closes. Without that a
 * keyboard user could reach the input and never reach the results.
 */
export function SearchAutocomplete({
  value,
  onValueChange,
  onNavigate,
  inputId,
  placeholder,
  autoFocus = false,
  variant = "header",
}: {
  value: string;
  onValueChange: (v: string) => void;
  onNavigate?: () => void;
  inputId: string;
  placeholder: string;
  autoFocus?: boolean;
  variant?: "header" | "overlay";
}) {
  const router = useRouter();
  const listId = useId();
  const [data, setData] = useState<Suggestions>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const term = value.trim();

  useEffect(() => {
    if (!term) {
      setData(EMPTY);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as Suggestions;
        setData(json);
        setOpen(true);
        setHighlight(-1);
      } catch {
        // Aborted by the next keystroke, or offline — leave the last results
        // on screen rather than flashing an empty panel.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  // Flattened for keyboard traversal: the panel is three sections but one
  // list as far as arrow keys are concerned.
  const options: { href: string; key: string }[] = [
    ...data.products.map((p) => ({ href: routes.product(p.slug), key: `p${p.id}` })),
    ...data.brands.map((b) => ({ href: routes.brand(b.slug), key: `b${b.slug}` })),
    ...data.categories.map((c) => ({ href: routes.category(c.slug), key: `c${c.slug}` })),
  ];

  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (options.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => {
        const next = e.key === "ArrowDown" ? h + 1 : h - 1;
        return ((next % options.length) + options.length) % options.length;
      });
      return;
    }
    if (e.key === "Enter" && highlight >= 0 && options[highlight]) {
      // Otherwise the form's own submit takes over and lands on the full
      // results page, which is the right fallback.
      e.preventDefault();
      go(options[highlight].href);
    }
  }

  const hasResults = data.products.length > 0 || data.brands.length > 0 || data.categories.length > 0;
  const showPanel = open && !!term;

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
      <Search
        aria-hidden="true"
        size={18}
        strokeWidth={1.8}
        color="#6b6355"
        style={{ position: "absolute", left: variant === "header" ? 22 : 16, pointerEvents: "none" }}
      />
      <label htmlFor={inputId} className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        Rechercher un produit, une marque
      </label>
      <input
        id={inputId}
        className="search-input"
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={highlight >= 0 && options[highlight] ? `${listId}-${options[highlight].key}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => term && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: variant === "header" ? 48 : 46,
          borderRadius: 999,
          padding: variant === "header" ? "0 44px 0 52px" : "0 40px 0 44px",
          fontSize: 14,
        }}
      />

      {loading && (
        <Loader2
          aria-hidden="true"
          size={16}
          className="animate-spin"
          style={{ position: "absolute", right: variant === "header" ? 20 : 14, color: "var(--pdh-plum)" }}
        />
      )}

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Suggestions de recherche"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 60,
            background: "#fff",
            border: "1px solid rgba(94,64,116,.14)",
            borderRadius: 16,
            boxShadow: "0 24px 48px -28px rgba(55,48,32,.5)",
            maxHeight: "min(70vh, 460px)",
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {!hasResults ? (
            <p style={{ margin: 0, padding: "18px", fontSize: 13, opacity: 0.6 }}>
              {loading ? "Recherche…" : `Aucun résultat pour « ${term} »`}
            </p>
          ) : (
            <>
              {data.products.length > 0 && (
                <Section title="Produits">
                  {data.products.map((p, i) => (
                    <Row
                      key={p.id}
                      id={`${listId}-p${p.id}`}
                      active={highlight === i}
                      onSelect={() => go(routes.product(p.slug))}
                      onHover={() => setHighlight(i)}
                    >
                      <span
                        style={{
                          position: "relative",
                          width: 40,
                          height: 40,
                          flex: "none",
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "#f4f1ec",
                        }}
                      >
                        <CloudinaryImage
                          src={p.image}
                          alt=""
                          preset="thumb"
                          fill
                          sizes="80px"
                          style={{ objectFit: "cover" }}
                          fallbackSrc={PRODUCT_PLACEHOLDER}
                        />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.35, color: "var(--pdh-ink)" }}>
                          {p.name}
                        </span>
                        {p.brand && <span style={{ display: "block", fontSize: 11.5, opacity: 0.55 }}>{p.brand}</span>}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", color: "var(--pdh-plum)" }}>
                        {money(p.price)}
                      </span>
                    </Row>
                  ))}
                </Section>
              )}

              {data.brands.length > 0 && (
                <Section title="Marques">
                  {data.brands.map((b, i) => (
                    <Row
                      key={b.slug}
                      id={`${listId}-b${b.slug}`}
                      active={highlight === data.products.length + i}
                      onSelect={() => go(routes.brand(b.slug))}
                      onHover={() => setHighlight(data.products.length + i)}
                    >
                      <span style={{ fontSize: 13.5 }}>{b.name}</span>
                    </Row>
                  ))}
                </Section>
              )}

              {data.categories.length > 0 && (
                <Section title="Catégories">
                  {data.categories.map((c, i) => (
                    <Row
                      key={c.slug}
                      id={`${listId}-c${c.slug}`}
                      active={highlight === data.products.length + data.brands.length + i}
                      onSelect={() => go(routes.category(c.slug))}
                      onHover={() => setHighlight(data.products.length + data.brands.length + i)}
                    >
                      <span style={{ fontSize: 13.5 }}>{c.name}</span>
                    </Row>
                  ))}
                </Section>
              )}

              <button
                type="button"
                onClick={() => go(`/catalogue?q=${encodeURIComponent(term)}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "13px 18px",
                  borderTop: "1px solid rgba(94,64,116,.1)",
                  background: "var(--pdh-sand)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: ".04em",
                  color: "var(--pdh-plum)",
                  cursor: "pointer",
                }}
              >
                Voir tous les résultats
                <ArrowRight aria-hidden="true" size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          padding: "10px 18px 6px",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          opacity: 0.45,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({
  id,
  active,
  onSelect,
  onHover,
  children,
}: {
  id: string;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      // Prevents the input losing focus before the click registers, which
      // would close the panel and swallow the selection.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "8px 18px",
        cursor: "pointer",
        background: active ? "rgba(94,64,116,.07)" : "transparent",
      }}
    >
      {children}
    </div>
  );
}
