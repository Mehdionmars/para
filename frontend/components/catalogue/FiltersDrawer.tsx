"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Filters } from "./Filters";

type FiltersProps = React.ComponentProps<typeof Filters>;

export function FiltersDrawer({
  onClose,
  resultCount,
  ...filtersProps
}: FiltersProps & { onClose: () => void; resultCount: number }) {
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

  // Portaled to <body> — same containing-block issue as the mobile nav
  // drawer would otherwise apply if this were nested under the sticky
  // header's backdrop-filter.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filtrer les produits"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        animation: "rise .3s cubic-bezier(.22,1,.36,1) both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid rgba(94,64,116,.12)" }}>
        <span style={{ fontFamily: "var(--font-jost)", fontSize: 18, fontWeight: 500, color: "var(--pdh-ink)" }}>Filtrer</span>
        <button type="button" onClick={onClose} aria-label="Fermer les filtres" className="icon-btn" style={{ color: "var(--pdh-plum)" }}>
          <X aria-hidden="true" size={22} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 24px" }}>
        <div style={{ position: "static" }}>
          <Filters {...filtersProps} />
        </div>
      </div>

      <div style={{ padding: 16, borderTop: "1px solid rgba(94,64,116,.12)" }}>
        <button
          type="button"
          onClick={onClose}
          className="btn-plum"
          style={{ width: "100%", padding: "14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}
        >
          Voir {resultCount} produit{resultCount === 1 ? "" : "s"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
