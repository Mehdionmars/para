"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// "Système" is gone along with ThemeProvider's `enableSystem`. Offering it
// while the provider cannot resolve it would leave the item selectable and
// inert; more importantly, following the OS is the one path that applied the
// half-finished dark theme to someone who never asked for it. Restore both
// together once the remaining hardcoded utilities are on tokens.
const OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
] as const;

/**
 * Light / dark, as a dropdown rather than a two-state switch.
 *
 * It stays a dropdown even at two options so the current choice is stated
 * rather than inferred from an icon, and so "Système" can return without a
 * change of control once the dark theme is finished everywhere.
 *
 * The trigger's icon is swapped by CSS, not by JavaScript, which is what lets
 * this component skip the usual next-themes `mounted` dance. `resolvedTheme`
 * is undefined during SSR — the theme lives in localStorage, which the server
 * cannot read — so branching on it in render means either a hydration
 * mismatch or a `useState`/`useEffect` pair that paints an empty button for
 * one frame. Rendering both glyphs and letting `dark:` decide which is
 * visible has neither problem: next-themes sets `class="dark"` on <html> from
 * a blocking inline script, so the correct icon is already the visible one in
 * the very first paint.
 *
 * `theme` is still read below, but only inside DropdownMenuContent, which
 * Radix mounts on open — by then the client owns the tree and there is
 * nothing for the server to disagree with.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Changer de thème"
        >
          <Sun className="size-4 dark:hidden" aria-hidden="true" />
          <Moon className="hidden size-4 dark:block" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-36">
        {OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          const active = theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn("gap-2", active && "text-sidebar-accent-foreground")}
            >
              <OptionIcon className="size-4" />
              {option.label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
