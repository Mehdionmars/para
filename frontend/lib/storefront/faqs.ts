import type { LexicalRoot } from "@/lib/storefront/richText";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when a question is saved. */
export const FAQS_TAG = "faqs";

/** Display order of the groups on /faq, and their headings. */
export const FAQ_CATEGORY_ORDER = ["commande", "livraison", "paiement", "retours", "produits"] as const;

export const FAQ_CATEGORY_LABELS: Record<string, string> = {
  commande: "Commande",
  livraison: "Livraison",
  paiement: "Paiement",
  retours: "Retours",
  produits: "Produits et conseils",
};

export type Faq = { question: string; answer: LexicalRoot | null; category: string; order: number };

export type FaqGroup = { category: string; label: string; items: Faq[] };

type RawFaq = { question?: string; answer?: LexicalRoot; category?: string; order?: number };

/**
 * The published questions, grouped for display.
 *
 * Nothing is hardcoded here. The eight questions in the brief are real
 * questions, but their *answers* are commercial and policy statements this
 * repository does not hold — and the two that could be answered from data
 * (delivery times and fees) must not be restated as prose, because /livraison
 * already reads them from `shipping-rules` and a second copy would diverge
 * the day a tariff moves. So the page renders whatever the pharmacy has
 * actually written, and an empty state when that is nothing.
 */
export async function fetchFaqs(): Promise<FaqGroup[]> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/faqs?where[published][equals]=true&limit=100&depth=0&sort=order`, {
      next: { revalidate: 3600, tags: [FAQS_TAG] },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  const docs = (data?.docs ?? []) as RawFaq[];

  const items: Faq[] = docs
    .map((d) => ({
      question: d.question?.trim() || "",
      answer: d.answer ?? null,
      category: d.category?.trim() || "commande",
      order: typeof d.order === "number" ? d.order : 0,
    }))
    .filter((f) => f.question);

  return FAQ_CATEGORY_ORDER.map((category) => ({
    category,
    label: FAQ_CATEGORY_LABELS[category] ?? category,
    items: items.filter((i) => i.category === category).sort((a, b) => a.order - b.order),
  })).filter((g) => g.items.length > 0);
}
