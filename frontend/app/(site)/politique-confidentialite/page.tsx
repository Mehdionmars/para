import type { Metadata } from "next";
import { InstitutionalDocument } from "@/components/institutional/InstitutionalDocument";
import { fetchInstitutionalPage } from "@/lib/storefront/institutional";
import { institutionalMetadata } from "@/lib/storefront/seo";

const SLUG = "politique-confidentialite" as const;
const TITLE = "Politique de confidentialité";

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata(SLUG, TITLE, "/politique-confidentialite");
}

export default async function PolitiqueConfidentialitePage() {
  const page = await fetchInstitutionalPage(SLUG);
  return (
    <InstitutionalDocument
      page={page}
      fallbackTitle={TITLE}
      breadcrumb={[{ label: "Politique de confidentialité" }]}
    />
  );
}
