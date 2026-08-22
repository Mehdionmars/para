import { ChevronDown } from "lucide-react";

/**
 * Secondary information, collapsed by default.
 *
 * Built on native <details>/<summary> rather than a state-driven panel: it is
 * keyboard-operable and screen-reader-announced with no JavaScript, it works
 * before hydration, and it can be rendered from a Server Component — which
 * matters here because the order workspace has no other reason to be a
 * client component.
 *
 * The chevron rotates via the `open` attribute, so the visual state can never
 * drift from the real one.
 */
export function Collapsible({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-gray-100 last:border-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm text-gray-800 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-violet-300 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 font-medium">{title}</span>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}
