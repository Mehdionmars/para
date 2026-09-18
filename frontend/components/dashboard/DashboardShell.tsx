"use client";

import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Separator } from "@/components/ui/separator";
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
 *
 * Surfaces here are tokens (`bg-background`, `bg-card`, `border-border`), not
 * the `bg-gray-50` / `border-gray-100` they were: those are fixed light-mode
 * values, and the header is the one element on every admin page, so hardcoding
 * it was what made a dark theme impossible to add anywhere.
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
      <DashboardSidebar roles={roles} email={email} />

      <SidebarInset className="min-w-0 bg-background">
        {/* sticky, because the scroll container changed. The old shell was
            `h-screen` with the main pane scrolling inside it, which held this
            bar in place; SidebarProvider is `min-h-svh`, so the window scrolls
            and an unpinned bar would ride away on the storefront builder and
            the long product tables.

            The backdrop blur is what keeps it legible over content scrolling
            beneath it without going fully opaque, which at this height reads
            as a second, heavier header. */}
        <header className="sticky top-0 z-10 flex h-14 flex-none items-center gap-2 border-b border-border bg-card/80 px-2 backdrop-blur supports-[backdrop-filter]:bg-card/60 sm:px-4">
          <SidebarTrigger className="text-muted-foreground transition-colors hover:text-foreground" />

          {/* Fixed height rather than inherited, so the rule does not stretch
              to the full 64px of the bar. */}
          <Separator orientation="vertical" className="mr-1 !h-4" />

          <DashboardBreadcrumb />

          {/* The space in the middle of the bar is deliberately empty. A
              scrolling greeting-date-clock marquee lived here: 32s of motion
              on every page, `aria-hidden` by its own admission, stating
              nothing the operator cannot read on their own screen. */}
          <div className="hidden flex-1 md:block" />

          {/* min-w-0 is what lets the search field shrink: a flex child
              defaults to min-width:auto and refuses to go below its content,
              which is what pushed the whole dashboard sideways on a phone.
              flex-1 below `md` (where the ticker is gone and the search should
              take the room), fixed from `md` up so the ticker keeps its
              space instead of the two fighting over it. */}
          <div className="min-w-0 flex-1 md:flex-none">
            <Topbar />
          </div>

          {/* The theme toggle is withdrawn until the dark sweep is done:
              ~450 hardcoded light utilities remain in the dashboard, so
              choosing dark produced white panels on a near-black shell.
              ThemeToggle.tsx and the provider stay — putting it back is one
              line once the sweep lands. */}
          <div className="flex flex-none items-center gap-0.5">
            <NotificationBell />
          </div>
        </header>

        {/* A div, not a <main>. SidebarInset *is* the <main> element, so this
            was a second main landmark nested inside the first — invalid HTML,
            and two "main" landmarks for a screen reader to choose between.
            The padding is the page's own gutter: 20px on a phone, 24px from
            `sm`, tighter than the 16/24 it replaced so the content starts
            closer to the chrome. */}
        <div className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
