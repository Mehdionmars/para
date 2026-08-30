"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

export type AppliedCoupon = { code: string; discount: number };

/**
 * Promo-code entry for the cart summary.
 *
 * The discount it displays is whatever the server returned — this component
 * never computes one. It is a *preview*: the binding calculation runs again
 * inside the checkout endpoint, so a code that lapses between here and
 * submit is still caught.
 */
export function CouponField({
  lines,
  email,
  city,
  applied,
  onApply,
  onRemove,
}: {
  /** Same shape the checkout sends: which product, which option, how many.
   * The option matters — two contenances can carry two different prices. */
  lines: { id: number; variantId: string | null; qty: number }[];
  email?: string;
  city?: string;
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking">("idle");
  const [error, setError] = useState("");

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || status === "checking") return;

    setStatus("checking");
    setError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        body: JSON.stringify({ city, code: trimmed, email, lines }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!data.ok) {
        // The server's own wording is shown verbatim: it knows *why* the code
        // failed (expired, minimum, already used) and a generic "code
        // invalide" would send the shopper hunting for a typo that isn't there.
        setError(data.error || "Code promo invalide.");
        return;
      }
      onApply({ code: data.code, discount: data.discount });
      setCode("");
    } catch {
      setError("Impossible de vérifier le code. Réessayez.");
    } finally {
      setStatus("idle");
    }
  }

  if (applied) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          borderRadius: 12,
          background: "rgba(31,138,92,.08)",
          border: "1px solid rgba(31,138,92,.22)",
          marginBottom: 16,
        }}
      >
        <Check aria-hidden="true" size={15} style={{ color: "var(--pdh-success)", flex: "none" }} />
        <span style={{ fontSize: 12.5, flex: 1, minWidth: 0 }}>
          Code <strong>{applied.code}</strong> appliqué
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer le code promo ${applied.code}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.6,
            flex: "none",
          }}
        >
          <X aria-hidden="true" size={14} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} style={{ marginBottom: 16 }}>
      <label
        htmlFor="coupon-code"
        style={{ display: "block", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.55, marginBottom: 8 }}
      >
        Code promo
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError("");
          }}
          placeholder="WELCOME10"
          autoComplete="off"
          // Codes are stored uppercase; showing them that way as the shopper
          // types avoids a mismatch between what they see and what is sent.
          style={{
            flex: 1,
            minWidth: 0,
            height: 42,
            padding: "0 14px",
            borderRadius: 12,
            border: `1px solid ${error ? "rgba(154,59,59,.5)" : "rgba(94,64,116,.22)"}`,
            fontSize: 13,
            textTransform: "uppercase",
            background: "#fff",
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "coupon-error" : undefined}
        />
        <button
          type="submit"
          disabled={!code.trim() || status === "checking"}
          className="btn-outline-plum"
          style={{
            minWidth: 108,
            height: 42,
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            cursor: !code.trim() || status === "checking" ? "not-allowed" : "pointer",
            opacity: !code.trim() ? 0.5 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {status === "checking" ? <Loader2 aria-hidden="true" size={14} className="spin" /> : null}
          {status === "checking" ? "…" : "Appliquer"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" style={{ fontSize: 12, color: "var(--pdh-error)", margin: "8px 0 0", lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </form>
  );
}
