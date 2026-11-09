"use client";

import { ChevronRight, X } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { type NavItem, visibleNavGroups } from "@/lib/dashboard/nav";
import type { Role } from "@/lib/dashboard/roles";
import { DashboardUserMenu } from "@/components/dashboard/DashboardUserMenu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";


function matches(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// Motion, after shadcnblocks' Application Shell 1: a press that gives a
// little, and the active background drawn by ActivePill — one element that
// slides from link to link — instead of the primitive's static fill.
const buttonMotion =
  "relative isolate overflow-visible max-lg:h-10 transition-[width,height,padding,background-color,color,transform] duration-200 ease-out group-data-[collapsible=icon]:overflow-hidden active:scale-[0.98] data-[active=true]:bg-transparent data-[active=true]:hover:bg-sidebar-accent/60 motion-reduce:transition-none motion-reduce:active:scale-100";

const ActivePill = () => (
  <motion.span
    layoutId="sidebar-active-pill"
    transition={{ bounce: 0.18, duration: 0.45, type: "spring" }}
    className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent shadow-xs ring-1 ring-sidebar-border/60"
  />
);

/**
 * The dashboard navigation, on shadcn's Sidebar primitives.
 *
 * SidebarProvider owns the responsive behaviour: a Sheet below `md`,
 * cookie-persisted collapse that survives the server render, ⌘B, and
 * tooltips for the icon rail through the `tooltip` prop.
 *
 * What stays here, because shadcn has no opinion on it: which items a role
 * may see, and which one counts as active.
 */
export function DashboardSidebar({ roles, email }: { roles: Role[]; email: string }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  // Below `lg` the sidebar is a drawer over the page: choosing a destination
  // closes it, or the operator lands on the new page still behind the menu.
  const closeDrawer = () => {
    if (isMobile) setOpenMobile(false);
  };

  // Filtered per group, then empty groups dropped — a stockManager sees no
  // Boutique destinations at all, and a group label with nothing under it is
  // a promise the sidebar does not keep.
  const groups = visibleNavGroups({ roles });
  // Groups the operator folded. Everything starts open.
  const [folded, setFolded] = useState<Record<string, boolean>>({});

  // Longest-href match wins, so a page never lights up two nav items at once
  // (e.g. /dashboard/products/new is a path-prefix of /dashboard/products).
  // Computed across every group, not within one, because the winner and the
  // loser can now live in different sections.
  const activeHref = groups
    .flatMap((group) => group.items)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => matches(pathname, item))?.href;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="relative max-lg:pr-12">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* h-14 overrides size="lg"'s h-12: a 44px mark plus the button's
                own p-2 needs 60px, and at h-12 the logo was being squeezed.
                The rail is unaffected — the primitive forces `size-8!` there,
                and `!` outranks this. */}
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-14 hover:bg-transparent active:bg-transparent"
            >
              <Link href="/dashboard" onClick={closeDrawer}>
                {/* Shrinks back to 32px when collapsed, because the icon rail
                    is 3rem wide and a 44px mark would overflow it. sizes
                    matches the larger of the two so the rail is not served a
                    separate, smaller file. */}
                <span className="relative flex aspect-square size-11 shrink-0 items-center justify-center group-data-[collapsible=icon]:size-8">
                  <Image src="/assets/logo.png" alt="" fill sizes="44px" className="object-contain" priority />
                </span>
                <span className="grid flex-1 leading-tight">
                  {/* Italic: PRODUCT.md records the wordmark as set in italic, as a
                      user decision. It is the one place the admin carries the
                      brand's own voice rather than the interface's. */}
                  <span className="truncate text-lg font-semibold italic tracking-tight text-foreground">
                    Para d&apos;Hiver
                  </span>
                  <span className="truncate text-xs text-muted-foreground">Administration</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* The drawer's own close button. The Sheet's built-in one is hidden
            by the primitive, which left Escape and a tap on the backdrop as the
            only ways out — neither discoverable on a phone. */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            aria-label="Fermer le menu"
            className="absolute top-3 right-2 inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </SidebarHeader>

      {/* scrollbar-none: the rail scrolls on a short viewport, but its
          scrollbar sat directly beside the page's own, so the admin showed two
          parallel grey gutters. Wheel and keyboard scrolling are unaffected. */}
      <SidebarContent className="scrollbar-none">
        <MotionConfig reducedMotion="user">
          {groups.map((group) => {
            // The group holding the current page always opens with it; the
            // others are open too unless the operator folded them.
            const holdsActive = group.items.some((item) => item.href === activeHref);
            return (
              <Collapsible
                key={group.label}
                open={holdsActive || !folded[group.label]}
                onOpenChange={(open) => setFolded((f) => ({ ...f, [group.label]: !open }))}
                className="group/collapsible"
              >
                {/* No entrance animation: the groups used to fade in 60ms
                    apart over half a second, so the navigation was not
                    readable for the first ~800ms of every full page load. */}
                <SidebarGroup>
                  {/* text-muted-foreground, overriding the primitive's
                      text-sidebar-foreground/70 which measured 3.63:1 against
                      the white sidebar — a fail for 12px text. The label is
                      hidden by the sidebar's own CSS on the icon rail. */}
                  <SidebarGroupLabel asChild className="text-muted-foreground hover:text-foreground">
                    <CollapsibleTrigger className="flex w-full items-center">
                      {group.label}
                      <ChevronRight className="ml-auto size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = item.href === activeHref;
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} className={buttonMotion}>
                                <Link href={item.href} onClick={closeDrawer}>
                                  {isActive && <ActivePill />}
                                  <Icon />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
        </MotionConfig>
      </SidebarContent>

      <SidebarSeparator />

      {/* The home-indicator inset, so the account menu is not under it on a
          phone held in the drawer. */}
      <SidebarFooter className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <DashboardUserMenu email={email} roles={roles} />
      </SidebarFooter>

      {/* The thin drag handle on the sidebar's edge: click to collapse. */}
      <SidebarRail />
    </Sidebar>
  );
}
