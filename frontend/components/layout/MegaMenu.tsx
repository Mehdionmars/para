"use client";

import { ArrowRight } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import { useState } from "react";
import { NavItemLabel } from "@/components/layout/NavItemLabel";
import { money } from "@/data/products";
import { MEGA_MENU, type MegaLink, type MegaMenuContent } from "@/data/nav";
import { navItemClassName, navItemStyle } from "@/lib/navStyle";

const VISIBLE_ITEMS = 15;

function MegaColumnList({ links, showArrows }: { links: MegaLink[]; showArrows: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? links : links.slice(0, VISIBLE_ITEMS);

  return (
    <>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
        {visible.map((link) => (
          <li key={link.label} role="none">
            {/* Same nav-link plumbing as the top-level navbar: a link
                styled in Payload looks identical wherever it appears, and
                there is no second styling implementation to keep in sync.
                `link-hover` is dropped when the editor set a hover colour,
                because that utility forces plum with !important. */}
            <Link
              href={link.href}
              role="menuitem"
              className={`${link.appearance?.hoverColor ? "" : "link-hover "}mega-link ${navItemClassName(link)}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                ...navItemStyle(link),
              }}
            >
              {showArrows && <ArrowRight aria-hidden="true" size={14} style={{ color: "var(--pdh-teal-text)", flexShrink: 0 }} />}
              <NavItemLabel item={link} badgeScale={0.9} />
            </Link>
          </li>
        ))}
      </ul>
      {links.length > VISIBLE_ITEMS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="link-hover mega-link"
          style={{ fontSize: 12, color: "var(--pdh-teal-text)", marginTop: 10, textAlign: "start", cursor: "pointer" }}
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </>
  );
}

export function MegaMenu({
  activeKey,
  megaMenu = MEGA_MENU,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  activeKey: string;
  megaMenu?: Record<string, MegaMenuContent>;
  onNavigate?: () => void;
  /** Safety net on top of the DOM-containment fix below: even a stray gap
   * (sub-pixel rounding, a fast mouse jump between frames) still keeps the
   * menu open as long as the pointer is somewhere over this panel. */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const content = megaMenu[activeKey];
  const columns = content?.columns || [];
  const promo = content?.promo;
  const categoryCard = promo ? null : content?.categoryCard;
  const featured = content?.featured;
  // The right-hand aside: an editor's promo tile, else the category's own
  // photograph, then the featured product under it. Each part is optional.
  const hasAside = Boolean(promo || categoryCard || featured);
  if (columns.length === 0 && !hasAside) return null;
  const maxColumns = hasAside ? 4 : 5;

  return (
    // Two elements on purpose: the `rise` reveal animation's keyframes end at
    // `transform: none`, and with `animation-fill-mode: both` that permanently
    // overwrites any inline `transform` on the *same* element once the
    // animation completes — including the translateX(-50%) this panel needs
    // to stay centered. Splitting positioning (outer, static) from the
    // animation (inner) keeps the two transforms from fighting each other.
    //
    // paddingTop (not marginTop) for the visual gap under the nav: a margin
    // would leave a real dead zone between <nav>'s own box and this panel —
    // moving the pointer from a trigger down into the menu crosses empty
    // page background that's outside both elements' hit areas, firing
    // <nav>'s onMouseLeave before the pointer ever reaches the menu. Padding
    // keeps that space inside this element's own (hoverable, and — since
    // it's a DOM descendant of <nav> — still "inside nav" for mouseleave
    // purposes) box instead.
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        left: "50%",
        top: "100%",
        transform: "translateX(-50%)",
        // Same container system as the header's own maxWidth — not a
        // different hardcoded number, so the panel's edges line up with the
        // header content above it at every desktop width.
        width: "min(1280px, calc(100% - 32px))",
        paddingTop: 10,
        zIndex: 70,
      }}
    >
      <div
        role="menu"
        aria-label={`Sous-catégories ${activeKey}`}
        onClick={onNavigate}
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          animation: "rise .28s cubic-bezier(.22,1,.36,1) both",
          fontFamily: "var(--font-poppins)",
        }}
      >
        {content?.subtitle && (
          <div
            style={{
              padding: "clamp(20px,2.2vw,26px) clamp(24px,2.4vw,32px) 0",
              fontSize: 12.5,
              color: "#6b6355",
            }}
          >
            {content.subtitle}
          </div>
        )}
        <div
          style={{
            padding: "clamp(24px,2.4vw,32px)",
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(columns.length, maxColumns)},1fr)${hasAside ? " minmax(220px,280px)" : ""}`,
            gap: "clamp(18px,2.6vw,34px)",
          }}
        >
          {columns.slice(0, maxColumns).map((col, i) => (
            <div key={col.title} role="none" style={{ display: "flex", flexDirection: "column", gap: 11, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "var(--pdh-ink)",
                }}
              >
                {col.title}
              </div>
              <MegaColumnList links={col.links} showArrows={i > 0} />
            </div>
          ))}

          {hasAside && (
            <div role="none" style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {categoryCard && (
            <Link
              href={categoryCard.href}
              className="tile-hover"
              style={{
                position: "relative",
                minHeight: featured ? 132 : 180,
                flex: featured ? "0 0 auto" : 1,
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <CloudinaryImage preset="thumb" src={categoryCard.img} alt="" fill sizes="280px" style={{ objectFit: "cover" }} />
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(var(--pdh-ink-rgb), 0) 40%,rgba(47,31,61,.82) 100%)" }} />
              <div style={{ position: "relative", zIndex: 3, padding: 16, color: "var(--pdh-cream)" }}>
                <div style={{ fontFamily: "var(--font-alta)", fontWeight: 300, fontSize: 19, lineHeight: 1.1 }}>{categoryCard.name}</div>
                <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 8 }}>Voir tout →</div>
              </div>
            </Link>
          )}

          {promo && (
            <Link
              href={promo.ctaUrl || "/catalogue"}
              className="tile-hover"
              style={{
                position: "relative",
                minHeight: featured ? 132 : 180,
                flex: featured ? "0 0 auto" : 1,
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              {promo.img && <CloudinaryImage preset="thumb" src={promo.img} alt="" fill sizes="280px" style={{ objectFit: "cover" }} />}
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(var(--pdh-ink-rgb), 0) 40%,rgba(47,31,61,.82) 100%)" }} />
              <div style={{ position: "relative", zIndex: 3, padding: 18, color: "var(--pdh-cream)" }}>
                <div style={{ fontFamily: "var(--font-alta)", fontWeight: 300, fontSize: 17, lineHeight: 1.15 }}>{promo.title}</div>
                {promo.description && (
                  <div style={{ fontSize: 11.5, color: "rgba(var(--pdh-cream-rgb), 0.82)", marginTop: 5, lineHeight: 1.5 }}>{promo.description}</div>
                )}
                {promo.ctaLabel && (
                  <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 10 }}>{promo.ctaLabel} →</div>
                )}
              </div>
            </Link>
          )}

          {featured && (
            <Link
              href={featured.href}
              style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr",
                gap: 12,
                alignItems: "center",
                padding: categoryCard || promo ? "12px 0 0" : 0,
                borderTop: categoryCard || promo ? "1px solid rgba(var(--pdh-ink-rgb), 0.14)" : "none",
              }}
            >
              <div style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#F7F4F1" }}>
                <CloudinaryImage preset="thumb" src={featured.img} alt="" fill sizes="72px" style={{ objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--pdh-plum)" }}>Produit vedette</div>
                {featured.brand && (
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 3, color: "var(--pdh-ink)" }}>{featured.brand}</div>
                )}
                <div
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.3,
                    marginTop: 2,
                    color: "var(--pdh-ink)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {featured.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: "var(--pdh-ink)" }}>
                  {money(featured.price)}
                  {featured.old > 0 && (
                    <span style={{ fontWeight: 400, marginLeft: 8, color: "#8a8174", textDecoration: "line-through", fontSize: 11.5 }}>{money(featured.old)}</span>
                  )}
                </div>
              </div>
            </Link>
          )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
