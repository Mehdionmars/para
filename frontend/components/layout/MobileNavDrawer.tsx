"use client";

import { ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MEGA_MENU, NAV_ITEMS, type MegaMenuContent, type NavItem } from "@/data/nav";
import { useFavorites } from "@/context/favorites-context";
import { navItemClassName, navItemStyle } from "@/lib/navStyle";
import { NavItemLabel } from "./NavItemLabel";

const SHELF = "#fff";
const listStyle: React.CSSProperties = { listStyle: "none", margin: 0, padding: 0 };
const rowGap: React.CSSProperties = { borderBottom: "1px solid var(--pdh-plum-tint)" };
// navItemStyle brings the desktop pill; on this shelf a row is a flat strip.
const rowFlat: React.CSSProperties = { borderRadius: 0, background: "#fff", padding: "0 20px", minHeight: 56 };
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: 56,
  padding: "0 20px",
  background: "#fff",
  fontSize: 16,
  fontWeight: 500,
  color: "var(--pdh-ink)",
  cursor: "pointer",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div role="presentation" style={{ padding: "26px 20px 8px", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pdh-teal-text)", background: SHELF }}>
      {children}
    </div>
  );
}

export function MobileNavDrawer({
  onClose,
  navItems = NAV_ITEMS,
  megaMenu = MEGA_MENU,
}: {
  onClose: () => void;
  navItems?: NavItem[];
  megaMenu?: Record<string, MegaMenuContent>;
}) {
  const [panel, setPanel] = useState<NavItem | null>(null);
  const favorites = useFavorites();
  const router = useRouter();

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  function onNavKeyDown(e: React.KeyboardEvent, href: string) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    navigate(href);
  }

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

  // Portaled to <body>: Header has `backdropFilter` for its frosted-glass
  // sticky look, and per spec that makes it a containing block for any
  // `position: fixed` descendant — this drawer's inset:0 was resolving
  // against the header's own ~179px height instead of the viewport,
  // leaving 9 of 11 nav categories unreachable. Escaping via portal is the
  // correct fix; removing backdropFilter would also work but loses the effect.
  return createPortal(
    <>
    {/* The page stays visible, dimmed, to the right of the panel; a tap on it closes the menu. */}
    <div aria-hidden="true" onClick={onClose} className="mnav-backdrop" />
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        width: "min(88vw, 400px)",
        zIndex: 101,
        background: "#FFFFFF",
        boxShadow: "0 0 32px rgba(0,0,0,.18)",
        display: "flex",
        flexDirection: "column",
        animation: "drawer-in .28s cubic-bezier(.22,1,.36,1) both",
        fontFamily: "var(--font-poppins)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: panel ? "6px 8px" : "18px 20px",
          minHeight: 64,
          borderBottom: "1px solid var(--pdh-plum-tint)",
        }}
      >
        {panel ? (
          <button
            type="button"
            onClick={() => setPanel(null)}
            aria-label="Retour au menu"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 48, padding: "0 10px 0 6px", fontSize: 16, fontWeight: 500, color: "var(--pdh-ink)", cursor: "pointer" }}
          >
            <ChevronLeft aria-hidden="true" size={22} style={{ color: "var(--pdh-plum)" }} />
            {panel.label}
          </button>
        ) : (
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--pdh-ink)" }}>Menu</span>
        )}
        <button type="button" onClick={onClose} aria-label="Fermer le menu" className="icon-btn" style={{ color: "var(--pdh-plum)" }}>
          <X aria-hidden="true" size={22} />
        </button>
      </div>

      <nav
        key={panel?.label ?? "root"}
        className="mnav-scroll"
        role="menu"
        aria-label={panel ? panel.label : "Navigation principale"}
        style={{ flex: 1, overflowY: "auto", background: SHELF, paddingBottom: "calc(16px + env(safe-area-inset-bottom,0px))", animation: "rise .25s cubic-bezier(.22,1,.36,1) both" }}
      >
        {panel ? (
          <>
            <ul style={listStyle}>
              <li role="none" style={rowGap}>
                <div
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => navigate(panel.href)}
                  onKeyDown={(e) => onNavKeyDown(e, panel.href)}
                  style={{ ...rowStyle, color: "var(--pdh-plum)" }}
                >
                  Tout voir
                </div>
              </li>
            </ul>
            {(panel.megaKey ? megaMenu[panel.megaKey]?.columns : undefined)?.map((col) => (
              <div key={col.title}>
                <SectionLabel>{col.title}</SectionLabel>
                <ul style={listStyle}>
                  {col.links.map((link) => (
                    <li key={link.label} role="none" style={rowGap}>
                      {/* Same styling path as the desktop mega menu, so a link
                          configured in Payload keeps its colour and badge. */}
                      <div
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => navigate(link.href)}
                        onKeyDown={(e) => onNavKeyDown(e, link.href)}
                        className={navItemClassName(link)}
                        style={{ ...rowStyle, ...navItemStyle(link), ...rowFlat }}
                      >
                        <NavItemLabel item={link} badgeScale={0.9} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        ) : (
          <>
            <SectionLabel>Catégories</SectionLabel>
            <ul style={listStyle}>
              {navItems.map((item) => {
                const hasChildren = ((item.megaKey ? megaMenu[item.megaKey]?.columns?.length : 0) ?? 0) > 0;
                return (
                  <li key={item.label} role="none" style={rowGap}>
                    <div
                      role="menuitem"
                      tabIndex={0}
                      aria-haspopup={hasChildren ? "true" : undefined}
                      onClick={() => (hasChildren ? setPanel(item) : navigate(item.href))}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        if (hasChildren) setPanel(item);
                        else navigate(item.href);
                      }}
                      className={navItemClassName(item)}
                      style={{
                        ...rowStyle,
                        justifyContent: "space-between",
                        // Same per-item variables as desktop; the CSS fallback
                        // keeps the drawer's original ink colour when unset.
                        ...navItemStyle(item),
                        "--nav-color": item.appearance?.color ?? "var(--pdh-ink)",
                        ...rowFlat,
                      } as React.CSSProperties}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        <NavItemLabel item={item} />
                      </span>
                      {hasChildren ? <ChevronRight aria-hidden="true" size={20} style={{ color: "var(--pdh-ink)", flex: "none" }} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <SectionLabel>Autres</SectionLabel>
            <ul style={listStyle}>
              {[
                { href: "/services", label: "Magasin et services", Icon: MapPin },
                { href: "/contact", label: "Contact", Icon: MessageCircle },
                { href: "/favoris", label: favorites.count > 0 ? `Mes favoris (${favorites.count})` : "Mes favoris", Icon: Heart },
              ].map(({ href, label, Icon }) => (
                <li key={href} role="none" style={rowGap}>
                  <div
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => navigate(href)}
                    onKeyDown={(e) => onNavKeyDown(e, href)}
                    style={{ ...rowStyle, gap: 14 }}
                  >
                    <Icon aria-hidden="true" size={22} strokeWidth={1.6} />
                    {label}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </div>
    </>,
    document.body,
  );
}
