"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const TOAST_DURATION_MS = 2600;

type ToastContextValue = {
  message: string;
  isVisible: boolean;
  fire: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fire = useCallback((next: string) => {
    clearTimeout(timeoutRef.current);
    setMessage(next);
    timeoutRef.current = setTimeout(() => setMessage(""), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <ToastContext.Provider value={{ message, isVisible: !!message, fire }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
