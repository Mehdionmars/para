"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const TOAST_DURATION_MS = 2600;
/** Long enough to read the message *and* reach for the button. At 2.6s an
 * "Annuler" is gone before a thumb gets there. */
const TOAST_WITH_ACTION_DURATION_MS = 5000;

/** One follow-up the shopper can take from the toast: go somewhere, or undo. */
export type ToastAction = { label: string; href?: string; onClick?: () => void };

type ToastContextValue = {
  message: string;
  isVisible: boolean;
  action: ToastAction | null;
  fire: (message: string, action?: ToastAction) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<ToastAction | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setMessage("");
    setAction(null);
  }, []);

  const fire = useCallback(
    (next: string, nextAction?: ToastAction) => {
      clearTimeout(timeoutRef.current);
      setMessage(next);
      setAction(nextAction ?? null);
      timeoutRef.current = setTimeout(dismiss, nextAction ? TOAST_WITH_ACTION_DURATION_MS : TOAST_DURATION_MS);
    },
    [dismiss],
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <ToastContext.Provider value={{ action, dismiss, fire, isVisible: !!message, message }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
