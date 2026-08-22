"use client";

import { Check } from "lucide-react";
import { useToast } from "@/context/toast-context";

export function Toast() {
  const { message, isVisible } = useToast();

  return (
    <div aria-live="polite" role="status" style={{ position: "fixed", left: "50%", bottom: 34, transform: "translateX(-50%)", zIndex: 120 }}>
      {isVisible && (
        <div
          style={{
            background: "var(--pdh-ink)",
            color: "var(--pdh-cream)",
            padding: "15px 26px",
            borderRadius: 999,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 20px 34px -18px rgba(0,0,0,.6)",
            animation: "rise .3s both",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--pdh-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Check size={12} color="#fff" strokeWidth={2.5} />
          </span>
          {message}
        </div>
      )}
    </div>
  );
}
