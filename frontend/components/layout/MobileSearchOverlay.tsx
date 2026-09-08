"use client";

import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NavItem } from "@/data/nav";
import { SearchAutocomplete } from "./SearchAutocomplete";

/**
 * Full-screen search, for the widths where the header has no room for a field.
 *
 * It used to be the search row and nothing else. The results came from
 * SearchAutocomplete's dropdown, which is positioned against the input, so on
 * a 375px phone they arrived as a 287px-wide rounded card 182px tall — 77% of
 * the width, 22% of the height — with 560px of blank white underneath it. And
 * before the first keystroke the whole screen was empty.
 *
 * So: the dialog is a column, the results own everything below the search row
 * (via `panelTarget`, which also drops the card's radius and shadow), and the
 * empty state offers the aisles instead of nothing.
 *
 * Those shortcuts are the real navigation passed down from the header, not a
 * "popular searches" list — there is no popularity data in this product, and
 * inventing one would put made-up rankings in front of shoppers.
 */
export function MobileSearchOverlay({ onClose, navItems = [] }: { onClose: () => void; navItems?: NavItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // A callback ref, not useRef: the portal target has to exist as *state* so
  // that SearchAutocomplete re-renders once the container is mounted. With a
  // plain ref the first render passes null and the panel never appears.
  const [resultsEl, setResultsEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/catalogue?q=${encodeURIComponent(query.trim())}`);
    onClose();
  }

  const shortcuts = navItems.filter((item) => !item.openInNewTab).slice(0, 8);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recherche"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        animation: "rise .3s cubic-bezier(.22,1,.36,1) both",
        fontFamily: "var(--font-poppins)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px calc(16px + env(safe-area-inset-top,0px))",
          flex: "none",
        }}
      >
        <form role="search" onSubmit={handleSubmit} style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <SearchAutocomplete
            inputId="mobile-site-search"
            value={query}
            onValueChange={setQuery}
            onNavigate={onClose}
            placeholder="Rechercher un produit, une marque…"
            variant="overlay"
            panelTarget={resultsEl}
            autoFocus
          />
        </form>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la recherche"
          className="icon-btn"
          style={{ flex: "none", width: 44, height: 44, color: "var(--pdh-plum)" }}
        >
          <X aria-hidden="true" size={22} />
        </button>
      </div>

      {/* Everything under the search row. The results portal in here; until
          there are any, it carries the shortcuts. `overscroll-behavior` keeps
          a scroll that reaches the end from dragging the page behind. */}
      <div
        ref={setResultsEl}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom,0px))",
        }}
      >
        {!query.trim() && shortcuts.length > 0 && (
          <nav aria-label="Rayons">
            <h2
              style={{
                margin: 0,
                padding: "10px 18px 6px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                opacity: 0.45,
              }}
            >
              Rayons
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {shortcuts.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      /* 48px of row: comfortably past the 24px WCAG 2.5.8
                         floor, and a size a thumb hits without aiming. */
                      minHeight: 48,
                      padding: "0 18px",
                      color: "var(--pdh-ink)",
                      borderBottom: "1px solid var(--pdh-plum-tint)",
                      fontSize: 14.5,
                    }}
                  >
                    {item.label}
                    <ArrowUpRight aria-hidden="true" size={16} style={{ flex: "none", opacity: 0.4 }} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>,
    document.body,
  );
}
