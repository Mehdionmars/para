"use client";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Role } from "@/lib/dashboard/roles";

/**
 * Dashboard chrome.
 *
 * This used to own the responsive behaviour itself: an off-canvas wrapper, the
 * open/closed state, a body scroll lock, an Escape handler, a backdrop, and a
 * burger — plus a separate collapse toggle living inside the sidebar. That
 * arrangement produced three defects worth naming, since they are the reason
 * for the rewrite rather than a preference for shadcn:
 *
 *  - the collapse toggle, offset to straddle the sidebar's edge, stayed ~11px
 *    inside the viewport while the drawer itself was off-canvas;
 *  - the closed drawer was only translated away, so all twelve nav links kept
 *    their place in the tab order;
 *  - a collapsed desktop preference was replayed on mobile, opening the drawer
 *    as a 68px icon strip with no way to widen it.
 *
 * SidebarProvider answers all of it — a Sheet below `md`, cookie-persisted
 * collapse that survives the server render, ⌘B, and a TooltipProvider for the
 * icon rail's labels — so the shell is now layout and nothing else.
 */
export function DashboardShell({
  roles,
  email,
  children,
}: {
  roles: Role[];
  email: string;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar roles={roles} />

      <SidebarInset className="min-w-0 bg-gray-50">
        {/* sticky, because the scroll container changed. The old shell was
            `h-screen` with the main pane scrolling inside it, which held this
            bar in place; SidebarProvider is `min-h-svh`, so the window scrolls
            and an unpinned bar would ride away on the storefront builder and
            the long product tables. */}
        <header className="sticky top-0 z-10 flex h-16 flex-none items-center gap-1 border-b border-gray-100 bg-white px-2 sm:px-4">
          <SidebarTrigger className="text-gray-600" />
          {/* min-w-0 is what lets the search field shrink: a flex child
              defaults to min-width:auto and refuses to go below its content,
              which is what pushed the whole dashboard sideways on a phone. */}
          <div className="min-w-0 flex-1">
            <Topbar email={email} />
          </div>
          <div className="flex-none">
            <NotificationBell />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
