"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * The header's search field.
 *
 * This file used to hold the account menu too — an avatar button with a
 * hand-rolled dropdown: a `menuOpen` boolean, a full-screen invisible
 * `<button>` as the click-outside catcher, no Escape handling and no focus
 * return. That moved to the sidebar footer as DashboardUserMenu, on Radix's
 * DropdownMenu, which is where shadcn's dashboards put an account and what
 * freed this bar for the breadcrumb. The `email` prop went with it.
 *
 * A plain container, not a <header>: DashboardShell owns the bar itself — its
 * height, border and background — and nesting a second <header> inside it
 * duplicated all three.
 */
export function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/dashboard/products?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    // min-w-0 on the wrapper and on the form is what actually lets them
    // shrink: a flex child defaults to min-width:auto and refuses to go below
    // its content, which is why the bar pushed the whole dashboard sideways on
    // a phone.
    //
    // justify-end, because the breadcrumb now sits to the left of this field
    // and the two should not drift apart as the trail grows; the search stays
    // anchored to the right of the space it is given.
    <div className="flex min-w-0 flex-1 items-center justify-end">
      {/* max-w steps up: at 390px the header also carries the sidebar
          trigger, the breadcrumb, the theme toggle and the bell, and a
          20rem-wide field pushed the last two off the edge. */}
      {/* Widths in three steps. Below `sm` the header is crowded, so the
          field is capped tight. From `md` the parent stops flexing (the
          ticker took the slack), so `w-full` has nothing to resolve against
          and the field needs a real width. */}
      <form
        onSubmit={handleSearch}
        className="relative w-full min-w-0 max-w-[9rem] sm:max-w-xs md:w-72 md:max-w-none"
      >
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          aria-label="Rechercher un produit"
          className="h-9 bg-muted/50 pl-8 transition-colors focus-visible:bg-card"
        />
      </form>
    </div>
  );
}
