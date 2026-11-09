"use client";

import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { VisitRecorder } from "@/components/dashboard/VisitRecorder";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Role } from "@/lib/dashboard/roles";

/**
 * Dashboard chrome: the sidebar, the sticky bar, and the page's gutter.
 *
 * SidebarProvider owns the responsive behaviour — a Sheet below `lg`, a
 * collapsible rail above it, ⌘B, and a TooltipProvider for the rail's labels.
 * `defaultOpen` comes from the cookie the provider itself writes, read on the
 * server by the layout, so a collapsed rail stays collapsed on the next page
 * load instead of opening for one frame and snapping shut.
 *
 * Surfaces here are tokens (`bg-background`, `bg-card`, `border-border`), so
 * the chrome follows the theme on every admin page.
 */
export function DashboardShell({
  roles,
  email,
  defaultOpen = true,
  children,
}: {
  roles: Role[];
  email: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar roles={roles} email={email} />

      <SidebarInset className="min-w-0 bg-background">
        {/* Sticky, because the window scrolls (SidebarProvider is min-h-svh).
            Opaque rather than blurred: a translucent bar over the long product
            tables read as a second, heavier header, and the blur bought
            nothing a solid card surface does not. `relative` is load-bearing:
            the phone search opens laid over this bar. */}
        <header className="sticky top-0 z-20 flex h-14 flex-none items-center gap-1.5 border-b border-border bg-card px-2 sm:gap-2 sm:px-4">
          {/* 40px on touch layouts; the rail-era 28px was below any tap
              target guideline once the bar became the only way to the menu. */}
          <SidebarTrigger
            aria-label="Ouvrir ou fermer le menu"
            className="size-10 flex-none text-muted-foreground transition-colors hover:text-foreground lg:size-8"
          />

          {/* Fixed height rather than inherited, so the rule does not stretch
              to the full height of the bar. */}
          <Separator orientation="vertical" className="mr-1 !h-4" />

          {/* min-w-0 + flex-1 is what lets a long trail truncate instead of
              pushing the bell off a 320px screen. */}
          <div className="min-w-0 flex-1">
            <DashboardBreadcrumb />
          </div>
          <VisitRecorder />

          <div className="flex flex-none items-center gap-1">
            <Topbar roles={roles} />
            <NotificationBell />
          </div>
        </header>

        {/* A div, not a <main>: SidebarInset already is the <main> landmark.
            16px gutter on a phone, 24px from `sm`, 32px once the rail is
            beside the page. The inner max width keeps a 2560px monitor from
            stretching a table row into one line the eye has to cross. */}
        <div className="min-w-0 flex-1 px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 xl:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
