"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchAutocomplete } from "./SearchAutocomplete";

export function MobileSearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

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
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px calc(16px + env(safe-area-inset-top,0px))" }}>
        <form role="search" onSubmit={handleSubmit} style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <SearchAutocomplete
            inputId="mobile-site-search"
            value={query}
            onValueChange={setQuery}
            onNavigate={onClose}
            placeholder="Rechercher un produit, une marque…"
            variant="overlay"
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
    </div>,
    document.body,
  );
}
