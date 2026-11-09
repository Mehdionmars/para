/**
 * One settings section's surface: a titled card, with an optional action at
 * the top right (e.g. "Ajouter un tarif"). Server-safe, no state.
 */
export function SettingsPanel({
  title,
  description,
  action,
  children,
  flush = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** No inner padding, for a list that runs edge to edge. */
  flush?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card shadow-xs">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex flex-none flex-wrap gap-2">{action}</div>}
      </header>
      <div className={flush ? "" : "px-4 py-4 sm:px-5"}>{children}</div>
    </section>
  );
}
