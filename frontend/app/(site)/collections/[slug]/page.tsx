import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
import { fetchCollectionBySlug } from "@/lib/storefront/collectionsPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await fetchCollectionBySlug(slug);
  if (!collection) return { title: "Collections — Para d'Hiver" };
  return {
    title: `${collection.title} — Para d'Hiver`,
    description: collection.sub || undefined,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await fetchCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <CatalogueView
      breadcrumbExtra={{ label: "Collections", href: "/collections" }}
      initialIds={collection.productIds}
      initialQuery=""
      pageImage={collection.img}
      pageIntro={collection.sub || undefined}
      pageTitle={collection.title}
    />
  );
}
