import Link from "next/link";
import { Breadcrumb, PageHeader, PageShell, ProseColumn } from "@/components/institutional/PageShell";
import { RichText } from "@/lib/storefront/richText";
import type { InstitutionalPage } from "@/lib/storefront/institutional";

/** "1. Objet du contrat" -> "objet-du-contrat", for a stable #anchor. */
export function sectionAnchor(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatUpdated(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-MA", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/**
 * The state a legal page is in before anyone has written it.
 *
 * Said plainly, rather than filled with placeholder clauses. A page that
 * invents "Article 3 — Prix" and puts plausible-sounding text under it is
 * worse than an empty one: a visitor cannot tell it apart from a real
 * document, and neither can the pharmacy. The page still answers 200 with the
 * full storefront chrome, and the route's metadata marks it noindex so it
 * cannot be indexed in this state.
 */
function AwaitingPublication({ title }: { title: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(94,64,116,.14)",
        borderRadius: 20,
        padding: "clamp(24px,3vw,36px)",
        background: "var(--pdh-sand)",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-alta)",
          fontWeight: 300,
          fontSize: "clamp(20px,2.4vw,26px)",
          color: "var(--pdh-plum)",
          margin: "0 0 12px",
        }}
      >
        Document en cours de publication
      </h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.8, opacity: 0.78, margin: "0 0 20px", maxWidth: "62ch" }}>
        Le contenu de la page «&nbsp;{title}&nbsp;» n&apos;est pas encore disponible en ligne. En attendant, notre
        équipe répond à toutes vos questions directement.
      </p>
      <Link
        href="/contact"
        className="btn-plum"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        Nous contacter
      </Link>
    </div>
  );
}

/** Jump list, shown only when there are enough sections for it to help. */
function TableOfContents({ sections }: { sections: { title: string }[] }) {
  if (sections.length < 3) return null;
  return (
    <nav
      aria-label="Sommaire"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        margin: "0 0 32px",
        paddingBottom: 26,
        borderBottom: "1px solid var(--pdh-plum-tint)",
      }}
    >
      {sections.map((section, i) => (
        <a
          key={section.title}
          href={`#${sectionAnchor(section.title)}`}
          className="link-hover"
          style={{
            display: "inline-block",
            padding: "7px 14px",
            borderRadius: 999,
            border: "1px solid var(--pdh-plum-border)",
            fontSize: 12,
            color: "var(--pdh-plum)",
          }}
        >
          {i + 1}. {section.title}
        </a>
      ))}
    </nav>
  );
}

export function InstitutionalDocument({
  page,
  fallbackTitle,
  breadcrumb,
  lede,
  children,
}: {
  page: InstitutionalPage | null;
  /** Used for the H1 and the breadcrumb before the page exists in the CMS. */
  fallbackTitle: string;
  breadcrumb?: { label: string; href?: string }[];
  /** Shown under the H1 when the CMS has no intro — /livraison uses it. */
  lede?: string;
  /** Rendered above the CMS sections. /livraison puts its tariff table here. */
  children?: React.ReactNode;
}) {
  const title = page?.title || fallbackTitle;
  const published = page?.status === "published";
  const sections = published ? (page?.sections ?? []) : [];
  const updated = published ? formatUpdated(page?.updatedAt ?? null) : "";

  return (
    <PageShell>
      <Breadcrumb items={breadcrumb ?? [{ label: title }]} />
      <PageHeader
        title={title}
        lede={(published && page?.intro) || lede}
        meta={updated ? `Dernière mise à jour le ${updated}` : undefined}
      />

      <ProseColumn>
        {children}

        {sections.length > 0 ? (
          <>
            <TableOfContents sections={sections} />
            {sections.map((section, i) => (
              <section key={section.title} id={sectionAnchor(section.title)} style={{ margin: "0 0 34px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-alta)",
                    fontWeight: 200,
                    fontSize: "clamp(22px,2.6vw,30px)",
                    color: "var(--pdh-ink)",
                    margin: "0 0 14px",
                    // scroll-margin, not a spacer: the sticky header would
                    // otherwise cover the heading a #anchor jumps to.
                    scrollMarginTop: 96,
                  }}
                >
                  {i + 1}. {section.title}
                </h2>
                <RichText value={section.body} />
              </section>
            ))}
          </>
        ) : (
          !children && <AwaitingPublication title={title} />
        )}
      </ProseColumn>
    </PageShell>
  );
}
