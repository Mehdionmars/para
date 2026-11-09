"use client";

import { Pencil, Plus, Search, TicketPercent } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CouponFormModal } from "@/components/dashboard/coupons/CouponFormModal";
import { couponState, COUPON_TYPE_LABELS, type Coupon } from "@/lib/dashboard/coupons-types";
import { money, shortDate } from "@/lib/dashboard/format";

type StateFilter = "all" | "active" | "inactive";

export function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  // null = closed; { coupon: null } = creating. Two states in one so the
  // modal is mounted once and cannot be open in both modes at the same time.
  const [editing, setEditing] = useState<{ coupon: Coupon | null } | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter((c) => {
      if (q && !c.code.toLowerCase().includes(q)) return false;
      if (state === "all") return true;
      const live = couponState(c).label === "Actif";
      return state === "active" ? live : !live;
    });
  }, [coupons, query, state]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code promo…"
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <select
          value={state}
          onChange={(e) => setState(e.target.value as StateFilter)}
          aria-label="Filtrer par état"
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          <option value="all">Tous les états</option>
          <option value="active">Actifs uniquement</option>
          <option value="inactive">Inactifs, expirés ou épuisés</option>
        </select>

        <span className="text-sm text-muted-foreground">{rows.length} code(s)</span>

        <Button className="ml-auto" onClick={() => setEditing({ coupon: null })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau coupon
        </Button>
      </div>

      {/* Phones: one row per code, the essentials on two lines. */}
      {rows.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs md:hidden">
          {rows.map((c) => {
            const s = couponState(c);
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold tracking-wide text-foreground">{c.code}</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.type === "percentage" ? `-${c.value} %` : `-${money(c.value)}`}
                    {typeof c.minimumAmount === "number" && c.minimumAmount > 0 && ` · dès ${money(c.minimumAmount)}`}
                    {` · ${c.usageCount ?? 0}${typeof c.usageLimit === "number" && c.usageLimit > 0 ? `/${c.usageLimit}` : ""} util.`}
                    {c.endDate && ` · jusqu'au ${shortDate(c.endDate)}`}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing({ coupon: c })} aria-label={`Modifier ${c.code}`}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className={`relative overflow-x-auto rounded-xl border border-border bg-card shadow-xs ${rows.length > 0 ? "hidden md:block" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Code", "Type", "Remise", "Minimum", "Période", "Utilisations", "État"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const s = couponState(c);
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono font-semibold tracking-wide text-foreground">{c.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{COUPON_TYPE_LABELS[c.type]}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.type === "percentage" ? `-${c.value} %` : `-${money(c.value)}`}
                    {c.type === "percentage" && typeof c.maximumDiscount === "number" && c.maximumDiscount > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (max {money(c.maximumDiscount)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof c.minimumAmount === "number" && c.minimumAmount > 0 ? money(c.minimumAmount) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.startDate || c.endDate ? (
                      <>
                        {c.startDate ? shortDate(c.startDate) : "…"} → {c.endDate ? shortDate(c.endDate) : "…"}
                      </>
                    ) : (
                      "Sans limite"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.usageCount ?? 0}
                    {typeof c.usageLimit === "number" && c.usageLimit > 0 ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing({ coupon: c })}
                      aria-label={`Modifier ${c.code}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modifier
                    </Button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                    <TicketPercent className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {coupons.length === 0
                      ? "Aucun code promo n'a encore été créé."
                      : "Aucun code ne correspond à ces filtres."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <CouponFormModal coupon={editing.coupon} onClose={() => setEditing(null)} />}
    </div>
  );
}
