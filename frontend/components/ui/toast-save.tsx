"use client";

import { AlertCircle, Check, Info, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SaveToastState = "idle" | "dirty" | "saving" | "saved" | "error";

type Action = { label: string; onClick: () => void; disabled?: boolean };

/**
 * The floating save pill, after yadwinder's "toast-save" (21st.dev): one
 * capsule at the bottom of the screen that says whether the page holds
 * unsaved changes and offers to keep or drop them, then shows the save
 * running and landing.
 *
 *   dirty  → "Modifications non enregistrées · Annuler · Enregistrer"
 *   saving → spinner, "Enregistrement…"
 *   saved  → check, "Modifications enregistrées" (hide it with useSavedFlash)
 *   error  → the error, and the save offered again
 *   idle   → nothing on screen
 *
 * The capsule springs in from below and morphs between states (motion
 * `layout`). It is dark in both themes, as in the original. Status changes
 * are announced (role="status").
 */
export function SaveToast({
  state,
  onSave,
  onReset,
  saveLabel = "Enregistrer",
  resetLabel = "Annuler",
  secondary,
  message,
  errorMessage,
  className,
}: {
  state: SaveToastState;
  /** Omit for a page that saves by itself: the pill then only reports. */
  onSave?: () => void;
  onReset?: () => void;
  saveLabel?: string;
  resetLabel?: string;
  /** A second save action, before the primary one (e.g. a draft save). */
  secondary?: Action;
  /** Overrides the "unsaved changes" wording. */
  message?: ReactNode;
  errorMessage?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const visible = state !== "idle";

  return (
    <div className={cn("pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4", className)}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="save-toast"
            layout
            role="status"
            aria-live="polite"
            initial={reduced ? false : { opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, transition: { duration: 0.18 }, y: 16 }}
            transition={{ damping: 26, stiffness: 380, type: "spring" }}
            className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full bg-neutral-950 py-2 pr-2 pl-4 text-sm text-white shadow-2xl ring-1 ring-white/10"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={state}
                layout
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1 }, y: -6 }}
                className="flex min-w-0 items-center gap-2"
              >
                {state === "saving" ? (
                  <Loader2 className="size-4 flex-none animate-spin text-white/80" aria-hidden="true" />
                ) : state === "saved" ? (
                  <span className="flex size-5 flex-none items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                ) : state === "error" ? (
                  <AlertCircle className="size-4 flex-none text-red-400" aria-hidden="true" />
                ) : (
                  <Info className="size-4 flex-none text-white/70" aria-hidden="true" />
                )}
                <span className="truncate whitespace-nowrap">
                  {state === "saving"
                    ? "Enregistrement…"
                    : state === "saved"
                      ? "Modifications enregistrées"
                      : state === "error"
                        ? errorMessage || "L'enregistrement a échoué"
                        : message || "Modifications non enregistrées"}
                </span>
              </motion.span>
            </AnimatePresence>

            {(state === "dirty" || state === "error") && (onSave || onReset || secondary) && (
              <motion.span layout className="flex flex-none items-center gap-1">
                {onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="rounded-full px-3 py-1.5 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {resetLabel}
                  </button>
                )}
                {secondary && (
                  <button
                    type="button"
                    onClick={secondary.onClick}
                    disabled={secondary.disabled}
                    className="rounded-full px-3 py-1.5 font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    {secondary.label}
                  </button>
                )}
                {onSave && (
                  <button
                    type="button"
                    onClick={onSave}
                    className="rounded-full bg-gradient-to-b from-violet-500 to-violet-600 px-4 py-1.5 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-transform hover:brightness-110 active:scale-95"
                  >
                    {state === "error" ? "Réessayer" : saveLabel}
                  </button>
                )}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * "Modifications enregistrées" for a moment, then gone. Returns whether the
 * flash is showing and the function that starts it.
 */
export function useSavedFlash(ms = 2200): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [on, flash];
}
