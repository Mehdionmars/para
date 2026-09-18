"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { hasRole, ROLE_LABELS, type Role } from "@/lib/dashboard/roles";

/**
 * The account menu, in the sidebar footer.
 *
 * It used to sit in the top bar as a bare button with a hand-rolled dropdown:
 * a `menuOpen` boolean, a full-screen invisible `<button>` acting as the
 * click-outside catcher, and no Escape handling or focus return. Radix's
 * DropdownMenu covers all of that, and the footer is where shadcn's own
 * dashboards put it — which also frees the top bar for the breadcrumb.
 *
 * Deliberately not built on the `nav-user.tsx` block that shipped with the
 * sidebar-08 demo: that one carried "Upgrade to Pro", "Billing", an
 * AvatarImage pointing at a URL this app has no field for, a hardcoded "CN"
 * fallback, and a Log out item wired to nothing.
 */
export function DashboardUserMenu({ email, roles }: { email: string; roles: Role[] }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // The highest-privilege role the account holds, since several are additive
  // and listing all of them overflows the footer at sidebar width.
  const primaryRole = ([
    "admin",
    "manager",
    "editor",
    "sales",
    "stockManager",
  ] as const satisfies readonly Role[]).find((role) => hasRole({ roles }, role));

  async function handleLogout() {
    // Guarded because the request is not instant and the item stays clickable
    // while it is in flight; a double click would fire two logouts and two
    // navigations.
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/dashboard-auth/logout", { method: "POST" });
      router.push("/dashboard/login");
      router.refresh();
    } catch {
      // The cookie may well be gone even if the response never arrived, so the
      // honest move is to send them to the login screen either way rather than
      // leave them in a dashboard they may no longer be authenticated for.
      setLoggingOut(false);
      router.push("/dashboard/login");
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                  {email.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{email}</span>
                {primaryRole && (
                  <span className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[primaryRole]}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            // Matching the trigger's width keeps the panel from jumping out
            // past the rail; min-w-56 stops it collapsing when the sidebar is
            // in its icon state.
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm font-medium">{email}</span>
              {primaryRole && (
                <span className="block truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[primaryRole]}
                </span>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Settings is admin-only, matching the nav rule for the same page
                — offering a link that redirects straight back is worse than
                not offering it. */}
            {hasRole({ roles }, "admin") && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="gap-2">
                  <Settings className="size-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              {loggingOut ? "Déconnexion…" : "Se déconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
