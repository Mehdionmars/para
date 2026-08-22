"use client";

import { ChevronDown, Heart, MapPin, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MEGA_MENU, NAV_ITEMS, type MegaMenuContent, type NavItem } from "@/data/nav";
import { useFavorites } from "@/context/favorites-context";
import { navItemClassName, navItemLinkProps, navItemStyle } from "@/lib/navStyle";
import { NavItemLabel } from "./NavItemLabel";

export function MobileNavDrawer({
  onClose,
  navItems = NAV_ITEMS,
  megaMenu = MEGA_MENU,
}: {
  onClose: () => void;
  navItems?: NavItem[];
  megaMenu?: Record<string, MegaMenuContent>;
}) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const favorites = useFavorites();

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
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
          justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: "1px solid rgba(94,64,116,.12)",
        }}
      >
        <span style={{ fontFamily: "var(--font-jost)", fontSize: 18, fontWeight: 500, color: "var(--pdh-ink)" }}>Menu</span>
        <button type="button" onClick={onClose} aria-label="Fermer le menu" className="icon-btn" style={{ color: "var(--pdh-plum)" }}>
          <X aria-hidden="true" size={22} />
        </button>
      </div>

      <nav role="menu" aria-label="Navigation principale" style={{ flex: 1, overflowY: "auto", padding: "8px 20px 24px" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {navItems.map((item) => {
            const columns = item.megaKey ? megaMenu[item.megaKey]?.columns : undefined;
            const isOpen = openItem === item.label;

            if (!columns || columns.length === 0) {
              return (
                <li key={item.label} role="none" style={{ borderBottom: "1px solid rgba(94,64,116,.1)" }}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={onClose}
                    {...navItemLinkProps(item)}
                    className={navItemClassName(item)}
                    style={{
                      display: "block",
                      padding: "16px 4px",
                      fontSize: 15,
                      // Same per-item variables as desktop; the CSS fallback
                      // keeps the drawer's original ink colour when unset.
                      ...navItemStyle(item),
                      "--nav-color": item.appearance?.color ?? "#222222",
                    } as React.CSSProperties}
                  >
                    <NavItemLabel item={item} />
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.label} role="none" style={{ borderBottom: "1px solid rgba(94,64,116,.1)" }}>
                <button
                  type="button"
                  onClick={() => setOpenItem(isOpen ? null : item.label)}
                  aria-expanded={isOpen}
                  className={navItemClassName(item)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 4px",
                    fontSize: 15,
                    cursor: "pointer",
                    textAlign: "left",
                    ...navItemStyle(item),
                    "--nav-color": item.appearance?.color ?? "#222222",
                  } as React.CSSProperties}
                >
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <NavItemLabel item={item} />
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    style={{ color: "var(--pdh-teal)", transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: "0 4px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
                    {columns.map((col) => (
                      <div key={col.title}>
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--pdh-teal)", marginBottom: 10 }}>
                          {col.title}
                        </div>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                          {col.links.map((link) => (
                            <li key={link.label} role="none">
                              {/* Same styling path as the desktop mega menu,
                                  so a link configured in Payload doesn't
                                  silently lose its colour or badge on phones
                                  — where most of this traffic is. */}
                              <Link
                                href={link.href}
                                role="menuitem"
                                onClick={onClose}
                                className={navItemClassName(link)}
                                style={{ fontSize: 13.5, ...navItemStyle(link) }}
                              >
                                <NavItemLabel item={link} badgeScale={0.9} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        style={{
          borderTop: "1px solid rgba(94,64,116,.12)",
          padding: "12px 20px calc(16px + env(safe-area-inset-bottom,0px))",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Link
          href="/services"
          onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", minHeight: 44, fontSize: 14, color: "#222222" }}
        >
          <MapPin aria-hidden="true" size={19} strokeWidth={1.6} />
          Magasin et services
        </Link>
        <Link
          href="/contact"
          onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", minHeight: 44, fontSize: 14, color: "#222222" }}
        >
          <MessageCircle aria-hidden="true" size={19} strokeWidth={1.6} />
          Contact
        </Link>
        <Link
          href="/favoris"
          onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", minHeight: 44, fontSize: 14, color: "#222222" }}
        >
          <Heart aria-hidden="true" size={19} strokeWidth={1.6} />
          Mes favoris {favorites.count > 0 ? `(${favorites.count})` : ""}
        </Link>
      </div>
    </div>,
    document.body,
  );
}
