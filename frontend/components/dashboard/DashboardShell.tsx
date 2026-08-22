"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { Role } from "@/lib/dashboard/roles";

/**
 * Dashboard chrome, with an off-canvas sidebar below `lg`.
 *
 * The sidebar used to be a fixed 220px flex child at every width. On a 375px
 * screen that left ~150px for the page, which did not overflow — it simply
 * crushed the content until text wrapped one character per line. Absence of
 * horizontal overflow is not evidence of a usable layout.
 *
 * Desktop behaviour is untouched: at `lg` and above the sidebar is static in
 * the flex row exactly as before, and this component only owns the drawer
 * state that the burger and the backdrop share.
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
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Navigating is the whole point of the drawer, so it closes itself on
  // arrival rather than covering the page the operator just asked for.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Below lg the aside is taken out of the flow and slid in; above it,
          the wrapper is inert and the sidebar sits in the row as before. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar roles={roles} />
      </div>

      {navOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-none items-center gap-1 border-b border-gray-100 bg-white lg:border-b-0">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
            className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <Topbar email={email} />
          </div>
          {/* Sits outside Topbar so the bell is reachable on every dashboard
              page without threading props through it. */}
          <div className="mr-2 flex-none">
            <NotificationBell />
          </div>
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
