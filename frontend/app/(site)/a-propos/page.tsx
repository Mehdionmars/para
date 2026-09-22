import type { Metadata } from "next";
import { InstitutionalDocument } from "@/components/institutional/InstitutionalDocument";
import { fetchInstitutionalPage } from "@/lib/storefront/institutional";
import { institutionalMetadata } from "@/lib/storefront/seo";

const SLUG = "a-propos" as const;
const TITLE = "À propos";

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata(
    SLUG,
    TITLE,
    "/a-propos",
    "Para d'Hiver, parapharmacie à Casablanca : produits authentiques, conseils de pharmaciens et livraison partout au Maroc.",
  );
}

export default async function AProposPage() {
  const page = await fetchInstitutionalPage(SLUG);
  return <InstitutionalDocument page={page} fallbackTitle={TITLE} />;
}
