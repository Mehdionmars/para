"use client";

import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Topbar({ email }: { email: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/dashboard/products?q=${encodeURIComponent(query.trim())}`);
  }

  async function handleLogout() {
    await fetch("/api/dashboard-auth/logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  }

  return (
    // A plain container, not a <header>: DashboardShell owns the bar itself
    // — its height, border and background — and nesting a second <header>
    // inside it duplicated all three.
    //
    // min-w-0 on this element and on the form is what actually lets them
    // shrink: a flex child defaults to min-width:auto and refuses to go below
    // its content, which is why the bar pushed the whole dashboard sideways
    // on a phone.
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:gap-4">
      <form onSubmit={handleSearch} className="relative w-full min-w-0 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
      </form>

      <div className="relative flex-none">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Compte : ${email}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:pr-3"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
            {email.slice(0, 1).toUpperCase()}
          </span>
          {/* The avatar initial already identifies the account; the full
              address only earns its space once there is room for it. */}
          <span className="hidden max-w-[160px] truncate text-gray-700 sm:inline">{email}</span>
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
