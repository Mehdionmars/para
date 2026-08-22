"use client";

import { HelpCircle, Heart, Mail, MapPin, Menu, MessageCircle, Phone, Search, ShoppingBag, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { useEffect, useRef, useState } from "react";
import { MEGA_MENU, NAV_ITEMS, type MegaMenuContent, type NavItem } from "@/data/nav";
import { HEADER_ACTIONS, HEADER_SEARCH, LOGO, type HeaderAction, type HeaderSearchConfig, type Logo } from "@/data/siteChrome";
import { useCart } from "@/context/cart-context";
import { useFavorites } from "@/context/favorites-context";
import { navItemClassName, navItemLinkProps, navItemStyle } from "@/lib/navStyle";
import { routes } from "@/lib/routes";
import { MegaMenu } from "./MegaMenu";
import { NavItemLabel } from "./NavItemLabel";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { MobileSearchOverlay } from "./MobileSearchOverlay";
import { SearchAutocomplete } from "./SearchAutocomplete";

// HeaderAction.icon is a plain string name, not a resolved component — it
// can arrive as a prop from a Server Component during preview (see
// scripts/sync-cms.mjs's note on HEADER_ACTIONS), so resolution to an actual
// lucide-react component happens here, client-side.
const ACTION_ICONS: Record<string, LucideIcon> = { HelpCircle, Heart, Mail, MapPin, MessageCircle, Phone, ShoppingBag };
const resolveActionIcon = (name: string) => ACTION_ICONS[name] || Heart;

// Standard hover-intent debounce for mega-menus — tolerates the pointer
// leaving both the trigger and the panel briefly (a diagonal move that
// clips the corner, a moment of hesitation) without closing prematurely.
const CLOSE_DELAY_MS = 350;

// "Marques" points at the brand index (/marques) but individual brand pages
// live one level under it (/marques/[slug]) — both should light up the same
// trigger.
function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === routes.brands()) {
    return pathname === routes.brands() || pathname.startsWith(`${routes.brands()}/`);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// Badge colour resolution moved to lib/navStyle.ts (navBadgeColors) so the
// mobile drawer resolves it the same way instead of keeping its own copy.

export function Header({
  logo = LOGO,
  headerSearch = HEADER_SEARCH,
  headerActions = HEADER_ACTIONS,
  navItems = NAV_ITEMS,
  megaMenu = MEGA_MENU,
}: {
  logo?: Logo;
  headerSearch?: HeaderSearchConfig;
  headerActions?: HeaderAction[];
  navItems?: NavItem[];
  megaMenu?: Record<string, MegaMenuContent>;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const cart = useCart();
  const favorites = useFavorites();

  // "Favoris" and "Panier" keep their real route/behavior (badge counts,
  // opening the cart drawer) regardless of any `href` in the CMS data —
  // only their label/icon come from the builder for those two.
  const servicesAction = headerActions.find((a) => a.key === "services");
  const contactAction = headerActions.find((a) => a.key === "contact");
  const favorisAction = headerActions.find((a) => a.key === "favoris");
  const panierAction = headerActions.find((a) => a.key === "panier");
  const ServicesIcon = servicesAction ? resolveActionIcon(servicesAction.icon) : null;
  const ContactIcon = contactAction ? resolveActionIcon(contactAction.icon) : null;
  const FavorisIcon = favorisAction ? resolveActionIcon(favorisAction.icon) : null;
  const PanierIcon = panierAction ? resolveActionIcon(panierAction.icon) : null;

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (query.trim()) router.push(`/catalogue?q=${encodeURIComponent(query.trim())}`);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveNav(null), CLOSE_DELAY_MS);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveNav(null);
    }
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveNav(null);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const activeItem = navItems.find((n) => n.label === activeNav);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "var(--chrome-header-bg, rgba(255,255,255,.93))",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--chrome-header-border, rgba(94,64,116,.12))",
      }}
    >
      <div
        className="header-row"
        style={{
          maxWidth: "min(1280px,100%)",
          margin: "0 auto",
          padding: "18px clamp(14px,3.4vw,32px)",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "clamp(16px,2.4vw,40px)",
        }}
      >
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Ouvrir le menu"
          className="icon-btn nav-mobile-trigger"
          style={{ flex: "none", order: -1 }}
        >
          <Menu aria-hidden="true" size={24} strokeWidth={1.6} />
        </button>

        <Link href={logo.href} aria-label="Para d'Hiver — Accueil" style={{ flex: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="logo-mark" style={{ position: "relative", width: 42, height: 42, flex: "none" }}>
            <CloudinaryImage preset="brand" src={logo.img} alt="" fill sizes="42px" style={{ objectFit: "contain" }} />
          </span>
          <span
            className="logo-wordmark"
            style={{
              fontFamily: "var(--font-jost)",
              fontWeight: 400,
              fontSize: "clamp(20px,2.2vw,27px)",
              letterSpacing: ".24em",
              color: "var(--pdh-ink)",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {logo.wordmark}
          </span>
        </Link>

        {headerSearch.enabled && (
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="header-search-form"
            style={{ flex: "1 1 300px", minWidth: 220, position: "relative", display: "flex", alignItems: "center" }}
          >
            <SearchAutocomplete
              inputId="site-search"
              value={query}
              onValueChange={setQuery}
              placeholder={headerSearch.placeholder}
            />
          </form>
        )}

        {headerSearch.enabled && (
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Rechercher"
            className="icon-btn header-search-icon-btn"
          >
            <Search aria-hidden="true" size={22} strokeWidth={1.6} />
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "clamp(14px,1.8vw,26px)", flex: "none" }}>
          {servicesAction && (
            <Link
              href={servicesAction.href || "/services"}
              aria-label={servicesAction.label}
              className="link-hover header-secondary-link"
              style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--chrome-header-text, var(--pdh-ink))", whiteSpace: "nowrap" }}
            >
              {ServicesIcon && <ServicesIcon aria-hidden="true" size={20} strokeWidth={1.5} />}
              <span className="header-util-label" style={{ fontSize: 13.5 }}>{servicesAction.label}</span>
            </Link>
          )}

          {contactAction && (
            <Link
              href={contactAction.href || "/contact"}
              aria-label={contactAction.label}
              className="link-hover header-secondary-link"
              style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--chrome-header-text, var(--pdh-ink))", whiteSpace: "nowrap" }}
            >
              {ContactIcon && <ContactIcon aria-hidden="true" size={20} strokeWidth={1.5} />}
              <span className="header-util-label" style={{ fontSize: 13.5 }}>{contactAction.label}</span>
            </Link>
          )}

          {favorisAction && (
          <Link
            href="/favoris"
            className="icon-btn header-secondary-link"
            style={{ position: "relative", display: "flex", alignItems: "center", color: "var(--chrome-header-icon, var(--pdh-ink))" }}
            aria-label={`Voir mes favoris (${favorites.count})`}
          >
            {FavorisIcon && <FavorisIcon aria-hidden="true" size={21} strokeWidth={1.5} />}
            {favorites.count > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -6,
                  right: -8,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "var(--pdh-teal)",
                  color: "#fff",
                  fontSize: 9.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {favorites.count}
              </span>
            )}
          </Link>
          )}

          {panierAction && (
          <button
            type="button"
            onClick={cart.openCart}
            className="icon-btn"
            aria-label={`Ouvrir le panier (${cart.count} article${cart.count === 1 ? "" : "s"})`}
            style={{ position: "relative" }}
          >
            {PanierIcon && <PanierIcon aria-hidden="true" size={21} strokeWidth={1.5} />}
            {cart.count > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -6,
                  right: -8,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "var(--pdh-plum)",
                  color: "#fff",
                  fontSize: 9.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {cart.count}
              </span>
            )}
          </button>
          )}
        </div>
      </div>

      <nav
        ref={navRef}
        className="nav-desktop"
        onMouseLeave={scheduleClose}
        onBlur={(e) => {
          // Fires on every child blur too (React's onBlur bubbles like
          // focusout) — only actually close once focus has left the nav
          // *and* the mega-menu entirely, not while it's just moving
          // between two links inside them.
          if (!navRef.current?.contains(e.relatedTarget as Node | null)) setActiveNav(null);
        }}
        style={{ borderTop: "1px solid var(--chrome-header-border, rgba(94,64,116,.08))", position: "relative" }}
      >
        <ul
          role="menubar"
          style={{
            listStyle: "none",
            margin: "0 auto",
            maxWidth: "min(1280px,100%)",
            padding: "0 clamp(14px,3.4vw,32px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "safe center",
            gap: "clamp(16px,2.4vw,32px)",
            overflowX: "auto",
            scrollbarWidth: "none",
            whiteSpace: "nowrap",
          }}
        >
          {navItems.map((item) => {
            const isOpen = activeNav === item.label;
            const isRouteActive = isNavItemActive(item, pathname);
            return (
              <li
                key={item.label}
                role="none"
                onMouseEnter={() => { cancelClose(); setActiveNav(item.label); }}
                onFocus={() => { cancelClose(); setActiveNav(item.label); }}
              >
                <Link
                  href={item.href}
                  role="menuitem"
                  aria-haspopup={item.megaKey ? "menu" : undefined}
                  aria-expanded={item.megaKey ? isOpen : undefined}
                  onClick={() => setActiveNav(null)}
                  {...navItemLinkProps(item)}
                  className={navItemClassName(item)}
                  // data-active drives the .nav-link[data-active] rule so the
                  // per-item activeColor wins; the theme fallback lives in CSS.
                  data-active={isOpen || isRouteActive ? "true" : undefined}
                  style={{
                    display: "block",
                    padding: item.appearance?.backgroundColor ? "14px 12px" : "14px 0",
                    borderRadius: item.appearance?.backgroundColor ? 999 : undefined,
                    fontSize: 14,
                    position: "relative",
                    ...navItemStyle(item),
                  }}
                >
                  <NavItemLabel item={item} />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: 8,
                      height: 1.5,
                      width: "100%",
                      background: "var(--pdh-plum)",
                      transformOrigin: "left",
                      transform: isOpen || isRouteActive ? "scaleX(1)" : "scaleX(0)",
                      transition: "transform .3s cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {activeItem?.megaKey && (
          <MegaMenu
            activeKey={activeItem.megaKey}
            megaMenu={megaMenu}
            onNavigate={() => setActiveNav(null)}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          />
        )}
      </nav>

      {mobileNavOpen && <MobileNavDrawer onClose={() => setMobileNavOpen(false)} navItems={navItems} megaMenu={megaMenu} />}
      {mobileSearchOpen && <MobileSearchOverlay onClose={() => setMobileSearchOpen(false)} />}
    </header>
  );
}
