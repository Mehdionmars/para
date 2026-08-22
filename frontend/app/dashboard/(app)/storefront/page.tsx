import { StorefrontBuilder } from "@/components/dashboard/storefront/StorefrontBuilder";
import { requireRole } from "@/lib/dashboard/guard";
import { payloadFetch } from "@/lib/dashboard/payload";
import { canEditContent } from "@/lib/dashboard/roles";
import { mapHomeDocToDraft, mapNavigationDocToDraft, mapSiteChromeDocToDraft, mapThemeDocToDraft } from "@/lib/dashboard/storefront-mapping";

export default async function StorefrontPage() {
  await requireRole(canEditContent);

  const [homeRes, chromeRes, themeRes, navigationRes, brandsRes, categoriesRes] = await Promise.all([
    payloadFetch("/api/globals/home?draft=true&depth=2"),
    payloadFetch("/api/globals/site-chrome?draft=true&depth=2"),
    payloadFetch("/api/globals/theme?draft=true&depth=0"),
    payloadFetch("/api/globals/navigation?draft=true&depth=1"),
    payloadFetch("/api/brands?limit=200&sort=name&depth=0"),
    payloadFetch("/api/categories?limit=500&sort=name&depth=0"),
  ]);

  if (!homeRes.ok) {
    throw new Error("Impossible de charger le contenu de la page d'accueil.");
  }
  if (!chromeRes.ok) {
    throw new Error("Impossible de charger le contenu global (top bar / header / footer).");
  }
  if (!themeRes.ok) {
    throw new Error("Impossible de charger le thème.");
  }
  if (!navigationRes.ok) {
    throw new Error("Impossible de charger la navigation.");
  }

  const homeDoc = await homeRes.json();
  const chromeDoc = await chromeRes.json();
  const themeDoc = await themeRes.json();
  const navigationDoc = await navigationRes.json();
  const brandsData = brandsRes.ok ? await brandsRes.json() : { docs: [] };
  const brands: { id: number; name: string; slug: string }[] = (brandsData.docs || []).map((b: { id: number; name: string; slug?: string }) => ({
    id: b.id,
    name: b.name,
    slug: b.slug || "",
  }));
  const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { docs: [] };
  const categories: { id: number; name: string }[] = (categoriesData.docs || [])
    .filter((c: { isActive?: boolean }) => c.isActive !== false)
    .map((c: { id: number; name: string }) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col -m-6">
      <StorefrontBuilder
        initialDraft={mapHomeDocToDraft(homeDoc)}
        initialStatus={homeDoc._status || "draft"}
        brands={brands}
        categories={categories}
        initialChromeDraft={mapSiteChromeDocToDraft(chromeDoc)}
        initialChromeStatus={chromeDoc._status || "draft"}
        initialThemeDraft={mapThemeDocToDraft(themeDoc)}
        initialThemeStatus={themeDoc._status || "draft"}
        initialNavigationDraft={mapNavigationDocToDraft(navigationDoc)}
        initialNavigationStatus={navigationDoc._status || "draft"}
      />
    </div>
  );
}
