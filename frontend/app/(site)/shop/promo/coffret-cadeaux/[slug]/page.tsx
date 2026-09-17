// A coffret's own page: the product it sells, reached from the picture on a
// "Coffrets & cadeaux" card.
//
// The same page as /produit/<slug> rather than a second product layout that
// would drift from it. Its metadata keeps /produit/<slug> as the canonical URL,
// so the two addresses never compete in search results.
export { default, generateMetadata } from "@/app/(site)/produit/[slug]/page";

// Route segment config has to be a literal in this file; it cannot be
// re-exported. Same value as the product page.
export const dynamic = "force-dynamic";
