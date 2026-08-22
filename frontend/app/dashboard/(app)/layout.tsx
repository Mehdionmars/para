import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ToastProvider } from "@/components/dashboard/ui/Toast";
import { getSessionUser } from "@/lib/dashboard/payload";
import { isStaffUser } from "@/lib/dashboard/roles";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await getSessionUser();
  if (!user) redirect("/dashboard/login");
  // "customer" is a real role but isn't wired to any staff surface — this
  // dashboard is staff-only, so anyone without a staff role is turned away
  // rather than shown an empty, confusing shell.
  if (!isStaffUser(user)) redirect("/dashboard/login?error=acces_refuse");

  return (
    // Mounted at the layout so any dashboard page can raise a toast without
    // each one wiring up its own provider.
    <ToastProvider>
      <DashboardShell email={user.email} roles={user.roles}>
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
