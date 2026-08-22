"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; title: string; description?: string };

type ToastApi = {
  toast: (t: { kind?: ToastKind; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Throws rather than returning a no-op: a silently swallowed toast is a
 * failure the operator never sees, which is exactly what this system exists
 * to prevent. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé à l'intérieur de <ToastProvider>.");
  return ctx;
}

const ICONS = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
} as const;

const STYLES = {
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-gray-200 bg-white text-gray-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

const ICON_COLOR = {
  error: "text-red-600",
  info: "text-gray-500",
  success: "text-emerald-600",
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  // Kept in a ref so unmounting clears pending dismissals rather than firing
  // setState on a gone component.
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const api = useMemo<ToastApi>(() => {
    const push = ({ kind = "info", title, description }: { kind?: ToastKind; title: string; description?: string }) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { description, id, kind, title }]);
      // Errors stay long enough to be read and acted on; confirmations don't
      // need to linger.
      const ttl = kind === "error" ? 8000 : 4000;
      timers.current.set(
        id,
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
          timers.current.delete(id);
        }, ttl),
      );
    };

    return {
      error: (title, description) => push({ description, kind: "error", title }),
      success: (title, description) => push({ description, kind: "success", title }),
      toast: push,
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* No `mounted` flag needed: the list is empty on the server and during
          hydration, so the portal can only ever be created after a user
          action — by which point document.body certainly exists. */}
      {toasts.length > 0 &&
        createPortal(
          <div
            // polite, not assertive: these announce completed work, they don't
            // interrupt what the operator is doing.
            aria-live="polite"
            aria-atomic="false"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:items-end"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {toasts.map((t) => {
              const Icon = ICONS[t.kind];
              return (
                <div
                  key={t.id}
                  role={t.kind === "error" ? "alert" : "status"}
                  className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${STYLES[t.kind]}`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ICON_COLOR[t.kind]}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.description && <p className="mt-0.5 text-xs opacity-80">{t.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Fermer la notification"
                    className="-mr-1 shrink-0 rounded p-1 opacity-50 transition-opacity hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
