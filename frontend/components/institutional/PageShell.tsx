import Link from "next/link";
import type { ReactNode } from "react";
import { Snowflakes } from "@/components/Snowflakes";

/**
 * The shell every institutional page sits in — /a-propos, /cgv, /faq,
 * /livraison, /retours, the legal pages and the blog.
 *
 * Nothing here is new. The container width, the breadcrumb, the plum gradient
 * header with its snowflakes, the eyebrow/H1/lede stack and the 62ch measure
 * are lifted from app/(site)/contact/page.tsx, which is the storefront's
 * existing institutional page. Extracted so the eight pages added alongside it
 * cannot drift into looking like a different site — and so a change to the
 * header is one edit, not nine.
 */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      style={{ fontSize: 11.5, letterSpacing: ".1em", opacity: 0.55, marginBottom: 18 }}
    >
      <Link href="/" className="link-hover" style={{ color: "inherit" }}>
        Accueil
      </Link>
      {items.map((item) => (
        // The separator is a sibling of the link, never a child of it: nested
        // inside, the slash joins the link's hit area and its underline.
        <span key={item.label}>
          {" / "}
          {item.href ? (
            <Link href={item.href} className="link-hover" style={{ color: "inherit" }}>
              {item.label}
            </Link>
          ) : (
            item.label
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  eyebrow = "Para d'Hiver",
  title,
  lede,
  meta,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Small line under the lede — "Dernière mise à jour le …" on legal pages. */
  meta?: ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: "clamp(16px,2vw,24px)",
        background: "linear-gradient(120deg,#2f1f3d,var(--pdh-plum) 65%,#4b3563)",
        color: "var(--pdh-cream)",
        padding: "48px clamp(20px,4vw,56px)",
        position: "relative",
        overflow: "hidden",
        marginBottom: 36,
      }}
    >
      <Snowflakes opacity={0.3} />
      <div style={{ position: "relative", maxWidth: "min(100%,860px)" }}>
        <div
          style={{
            fontFamily: "var(--font-poppins)",
            fontSize: 10.5,
            letterSpacing: ".24em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: "var(--font-alta)",
            fontWeight: 200,
            fontSize: "clamp(30px,4.6vw,52px)",
            lineHeight: 1.02,
            margin: "14px 0 12px",
          }}
        >
          {title}
        </h1>
        {lede && (
          // 62ch, the measure /contact settled on: past ~75 characters a line
          // the eye loses its place on the return sweep, and these pages are
          // the longest prose on the site.
          <p style={{ fontSize: 14.5, lineHeight: 1.75, opacity: 0.8, margin: 0, maxWidth: "62ch" }}>{lede}</p>
        )}
        {meta && <div style={{ fontSize: 12, opacity: 0.65, marginTop: 14 }}>{meta}</div>}
      </div>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        maxWidth: "min(1280px,100%)",
        margin: "0 auto",
        padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * The reading column for long prose.
 *
 * 72ch rather than the 1280px the shell allows: a CGV set across the full
 * width of a desktop screen is unreadable, and `min(100%, …)` means it costs
 * nothing on a phone — no fixed width ever reaches the mobile layout.
 */
export function ProseColumn({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: "min(100%,72ch)" }}>{children}</div>;
}
