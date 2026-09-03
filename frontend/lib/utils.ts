import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The `cn` helper shadcn/ui components import from `@/lib/utils`.
 *
 * Identical to lib/dashboard/cn.ts, which predates it and is what the
 * dashboard's own component kit imports. Both are kept because they serve
 * different consumers — this path is a shadcn convention that `shadcn add`
 * writes into every generated component — but they are one function, and
 * collapsing them is worth doing if the two kits ever converge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
