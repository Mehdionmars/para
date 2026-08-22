"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Customer } from "@/lib/dashboard/customers-types";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom ou email…"
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <span className="text-sm text-gray-500">{rows.length} client(s)</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Client", "Téléphone", "Commandes", "Total dépensé", "Dernière commande"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/customers/${encodeURIComponent(c.email)}`} className="font-medium text-violet-700 hover:underline">
                    {c.name}
                  </Link>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.orderCount}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{money(c.totalSpent)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.lastOrderAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  {customers.length === 0
                    ? "Aucun client pour le moment — les clients apparaissent ici après leur première commande."
                    : "Aucun client ne correspond à cette recherche."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
