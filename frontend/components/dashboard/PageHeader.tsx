import { cn } from "@/lib/utils";

/**
 * The title block at the top of a dashboard page.
 *
 * Every page had its own copy of `text-xl font-semibold text-gray-900` over
 * `mt-1 text-sm text-gray-500`, which is fine until one of them says
 * `text-lg` or `text-gray-600` and the dashboard quietly stops having one
 * voice. Centralising it also means the token migration touches the heading
 * of fifteen pages once rather than fifteen times.
 *
 * A Server Component on purpose — it holds no state, and pages that render it
 * are themselves server-rendered, so there is no reason to ship it.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  /** Primary actions for the page, right-aligned on one line from `sm` up. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          // max-w-2xl, because a description running the full width of a
          // 2560px monitor is one line the eye has to track across the whole
          // screen before it finds the start of the next.
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </div>
  );
}
