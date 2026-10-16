import { ArrowRight, CalendarClock, CircleCheck, ShoppingCart, TriangleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";

export type TodoItem = { label: string; count: number; href: string; icon: "booking" | "order" | "stock" };
export type SnapshotItem = { label: string; value: string; caption?: string; href?: string };

const ICONS: Record<TodoItem["icon"], LucideIcon> = {
  booking: CalendarClock,
  order: ShoppingCart,
  stock: TriangleAlert,
};

/**
 * The right-hand column of the overview: what needs doing, then the state of
 * the catalogue.
 *
 * The worklist used to be full-width bars above the figures, one per task,
 * which turned a single "180 produits à réapprovisionner" into the widest
 * element on the page. Here every task has a fixed, small row; a task with
 * nothing to do drops out, and an empty list says so in one line.
 *
 * The catalogue figures were three more KPI cards, the same size as revenue.
 * They are a snapshot rather than a trend, so they read as a list.
 */
export function TodoPanel({ todos, snapshot }: { todos: TodoItem[]; snapshot: SnapshotItem[] }) {
  const open = todos.filter((t) => t.count > 0);

  return (
    <section className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card shadow-xs">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">À traiter</h2>
      </header>

      {open.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
          <CircleCheck className="size-4 text-success" aria-hidden="true" /> Rien en attente.
        </p>
      ) : (
        <ul className="flex flex-col px-2 py-1">
          {open.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent/60">
                  <Icon className={`size-4 flex-none ${t.icon === "order" ? "text-muted-foreground" : "text-warning"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-foreground">{t.label}</span>
                  <strong className="font-semibold tabular-nums text-foreground">{t.count}</strong>
                  <ArrowRight className="size-3.5 flex-none text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-auto border-t border-border px-5 py-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Catalogue</h3>
        <ul className="flex flex-col gap-1">
          {snapshot.map((s) => {
            const row = (
              <>
                <span className="text-sm text-muted-foreground">
                  {s.label}
                  {s.caption && <span className="block text-xs">{s.caption}</span>}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{s.value}</span>
              </>
            );
            return (
              <li key={s.label}>
                {s.href ? (
                  <Link href={s.href} className="-mx-2 flex items-start justify-between gap-3 rounded-md px-2 py-1 hover:bg-accent/60">
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-start justify-between gap-3 py-1">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
