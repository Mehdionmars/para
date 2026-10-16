"use client";

import { ArrowRight, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A search field with a rotating, letter-by-letter animated placeholder.
 *
 * Adapted from HextaUI's AI chat input: the animated placeholder and the
 * spring on focus are kept; the attach, voice, "Think" and "Deep Search"
 * controls are not, since nothing here would answer them. Colours come from
 * the theme tokens, so it sits in the dashboard (and its dark mode) as is.
 *
 * Controlled: the parent owns the value and decides what Enter does.
 */
export function AIChatInput({
  value,
  onChange,
  onSubmit,
  placeholders,
  label = "Rechercher",
  className,
  autoFocus = false,
  onKeyDown,
  onFocusChange,
  inputProps,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** Cycled every 3s while the field is empty and unfocused. */
  placeholders: string[];
  /** Accessible name of the field. */
  label?: string;
  className?: string;
  autoFocus?: boolean;
  /** Keys on the field, before Enter submits — for a results list below. */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocusChange?: (focused: boolean) => void;
  /** Extra attributes for the input (aria-* for a combobox). */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const [index, setIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  const active = focused || value.length > 0;

  // Rotate the placeholder only while it is visible and there is no
  // reduced-motion preference: a moving hint under a reader's cursor is noise.
  useEffect(() => {
    if (active || reducedMotion || placeholders.length < 2) return;
    let swap: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);
    return () => {
      clearInterval(interval);
      if (swap) clearTimeout(swap);
    };
  }, [active, reducedMotion, placeholders.length]);

  const letters: Variants = {
    animate: {
      filter: "blur(0px)",
      opacity: 1,
      transition: { filter: { duration: 0.4 }, opacity: { duration: 0.25 }, y: { damping: 20, stiffness: 80, type: "spring" } },
      y: 0,
    },
    exit: {
      filter: "blur(12px)",
      opacity: 0,
      transition: { filter: { duration: 0.3 }, opacity: { duration: 0.2 }, y: { damping: 20, stiffness: 80, type: "spring" } },
      y: -10,
    },
    initial: { filter: "blur(12px)", opacity: 0, y: 10 },
  };

  return (
    <motion.form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      onClick={() => inputRef.current?.focus()}
      initial={false}
      animate={active ? "expanded" : "collapsed"}
      variants={{
        collapsed: { boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)", scale: 1 },
        expanded: { boxShadow: "0 10px 32px -8px rgba(94,64,116,0.28)", scale: 1.01 },
      }}
      transition={{ damping: 18, stiffness: 160, type: "spring" }}
      className={cn(
        "flex w-full cursor-text items-center gap-2 rounded-full border border-border bg-card p-2 pl-5 text-foreground",
        active && "border-primary/40",
        className,
      )}
    >
      <Search className="size-5 flex-none text-muted-foreground" aria-hidden="true" />

      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setFocused(false);
            onFocusChange?.(false);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          {...inputProps}
          autoFocus={autoFocus}
          aria-label={label}
          className="relative z-10 w-full border-0 bg-transparent py-2 text-base outline-0 [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center" aria-hidden="true">
          <AnimatePresence mode="wait">
            {showPlaceholder && !active && placeholders.length > 0 && (
              <motion.span
                key={index}
                className="absolute inset-x-0 truncate whitespace-nowrap text-muted-foreground select-none"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={{
                  animate: { transition: { staggerChildren: 0.025 } },
                  exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
                  initial: {},
                }}
              >
                {placeholders[index].split("").map((char, i) => (
                  <motion.span key={i} variants={letters} className="inline-block">
                    {char === " " ? " " : char}
                  </motion.span>
                ))}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="submit"
        aria-label="Lancer la recherche"
        className="flex size-10 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <ArrowRight className="size-4.5" aria-hidden="true" />
      </button>
    </motion.form>
  );
}
