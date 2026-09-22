import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb, PageHeader, PageShell, ProseColumn } from "@/components/institutional/PageShell";
import { FaqAccordion } from "@/components/institutional/FaqAccordion";
import { fetchFaqs } from "@/lib/storefront/faqs";
import { RichText, plainText } from "@/lib/storefront/richText";
import { absoluteUrl } from "@/lib/storefront/seo";

const TITLE = "Questions fréquentes";

export async function generateMetadata(): Promise<Metadata> {
  const groups = await fetchFaqs();
  const empty = groups.length === 0;

  return {
    title: `${TITLE} — Para d'Hiver`,
    description: "Livraison, paiement, suivi de commande, retours : les réponses aux questions les plus posées.",
    alternates: { canonical: absoluteUrl("/faq") },
    openGraph: {
      title: `${TITLE} — Para d'Hiver`,
      url: absoluteUrl("/faq"),
      siteName: "Para d'Hiver",
      locale: "fr_MA",
      type: "article",
    },
    robots: empty ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function FaqPage() {
  const groups = await fetchFaqs();

  /**
   * FAQPage structured data, emitted only when there is something to
   * describe. Google penalises FAQ markup that does not match visible text,
   * so it is built from the same nodes the page renders, flattened to plain
   * text.
   */
  const jsonLd =
    groups.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: groups.flatMap((g) =>
            g.items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: plainText(item.answer) },
            })),
          ),
        }
      : null;

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "FAQ" }]} />
      <PageHeader
        title={TITLE}
        lede="Livraison, paiement, suivi de commande, retours — et si vous ne trouvez pas, écrivez-nous."
      />

      <ProseColumn>
        {groups.length === 0 ? (
          // No seeded questions. The eight in the brief are real questions,
          // but their answers are commercial and policy statements this
          // repository does not hold — and the two that data could answer
          // (délais, frais) live on /livraison, read from the tariffs
          // checkout bills against. A prose copy here would diverge from
          // them the first time a rule changes.
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
              Nos réponses arrivent
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.8, opacity: 0.78, margin: "0 0 20px", maxWidth: "62ch" }}>
              Cette page se remplit au fur et à mesure. Pour les frais et les zones de livraison, tout est déjà
              détaillé sur la page Livraison — pour le reste, notre équipe vous répond directement.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link
                href="/livraison"
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
                Voir la livraison
              </Link>
              <Link
                href="/contact"
                className="link-hover"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  borderRadius: 999,
                  border: "1px solid rgba(94,64,116,.24)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--pdh-plum)",
                }}
              >
                Nous contacter
              </Link>
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.category} style={{ margin: "0 0 34px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-alta)",
                  fontWeight: 200,
                  fontSize: "clamp(22px,2.6vw,30px)",
                  color: "var(--pdh-ink)",
                  margin: "0 0 10px",
                }}
              >
                {group.label}
              </h2>
              <FaqAccordion
                items={group.items.map((item) => ({
                  question: item.question,
                  answer: <RichText value={item.answer} />,
                }))}
              />
            </section>
          ))
        )}
      </ProseColumn>

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </PageShell>
  );
}
