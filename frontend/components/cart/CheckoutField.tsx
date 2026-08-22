"use client";

import { useId } from "react";

/**
 * A labelled checkout field.
 *
 * The four fields it replaces carried only a `placeholder`. A placeholder
 * vanishes on the first keystroke, so someone who scrolls back to check what
 * they typed has nothing left to read, and a screen reader announces the
 * input as an unnamed edit box. On the last screen before payment — where
 * the visitor is typing their own address — that is the most expensive place
 * on the site to be ambiguous.
 *
 * Errors are wired the same way the coupon field already does it:
 * `aria-invalid` marks the control, `aria-describedby` points at the message,
 * and the message itself is a live region so it is announced rather than
 * silently painted.
 */
export function CheckoutField({
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  autoComplete,
  placeholder,
  multiline = false,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  // The hint is hidden while an error is showing, so it must drop out of
  // aria-describedby too — pointing at a missing id leaves assistive tech
  // with a dangling reference and no description at all.
  const showHint = !!hint && !error;
  const describedBy = [error ? errorId : null, showHint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const shared = {
    "aria-describedby": describedBy,
    "aria-invalid": error ? (true as const) : undefined,
    autoComplete,
    className: "field-input",
    id,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder,
    required,
    value,
  };

  const border = error ? { borderColor: "#9A3B3B" } : undefined;

  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 5, opacity: 0.8 }}>
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden="true" style={{ color: "#9A3B3B" }}>
              *
            </span>
            <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
              (obligatoire)
            </span>
          </>
        )}
      </label>

      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          style={{ width: "100%", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, resize: "vertical", ...border }}
        />
      ) : (
        <input
          {...shared}
          type={type}
          style={{ width: "100%", height: 44, borderRadius: 10, padding: "0 14px", fontSize: 13.5, ...border }}
        />
      )}

      {showHint && (
        <p id={hintId} style={{ margin: "5px 0 0", fontSize: 11.5, opacity: 0.6 }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" style={{ margin: "5px 0 0", fontSize: 12, color: "#9A3B3B" }}>
          {error}
        </p>
      )}
    </div>
  );
}
