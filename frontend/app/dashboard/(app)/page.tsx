import { QuickAccess } from "@/components/dashboard/overview/QuickAccess";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getSessionUser } from "@/lib/dashboard/payload";

/**
 * The dashboard's landing page: every destination, and nothing else.
 *
 * It used to open on seven KPI cards and four charts, which made "where do I
 * change the logo" a question answered by scrolling past revenue. The figures
 * now live at /dashboard/overview, one tile away.
 */
export default async function DashboardHomePage() {
  // The layout has already turned away anyone without a staff role; this
  // read is for the roles the tiles are filtered by.
  const user = await getSessionUser();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Tableau de bord" description="Où voulez-vous aller ?" />
      <QuickAccess roles={user?.roles ?? []} />
    </div>
  );
}
