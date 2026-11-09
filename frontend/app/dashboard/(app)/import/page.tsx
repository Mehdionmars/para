import { PageHeader } from "@/components/dashboard/PageHeader";
import { ImportView } from "@/components/dashboard/import/ImportView";
import { requireRole } from "@/lib/dashboard/guard";
import { canImport } from "@/lib/dashboard/roles";

export default async function ImportPage() {
  await requireRole(canImport);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Import produits" description="Créez ou mettez à jour des produits en masse depuis un fichier CSV ou Excel. Le SKU fait foi : un SKU existant met à jour le produit, un nouveau SKU en crée un." />
      <ImportView />
    </div>
  );
}
