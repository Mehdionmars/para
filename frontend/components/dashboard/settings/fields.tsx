"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Form controls for the settings editors, on the dashboard's tokens.
 *
 * The storefront builder's FieldKit predates the tokens (gray-200 borders, a
 * violet-400 focus) and is left to its own sweep; these are what new forms
 * use. Every control is labelled through its own id, so a click on the label
 * focuses it and a screen reader announces it.
 */

export const controlCls =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive";

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
      {required && (
        <span className="ml-0.5 text-destructive-strong" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function Hint({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {children}
    </p>
  );
}

type Common = { label: string; hint?: React.ReactNode; required?: boolean; className?: string };

export function TextInput({
  label,
  hint,
  required,
  className,
  value,
  onChange,
  ...rest
}: Common & { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(controlCls, "h-10")}
        {...rest}
      />
      <Hint id={`${id}-hint`}>{hint}</Hint>
    </div>
  );
}

export function TextArea({
  label,
  hint,
  required,
  className,
  value,
  onChange,
  rows = 3,
}: Common & { value: string; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(controlCls, "resize-y py-2 leading-relaxed")}
      />
      <Hint id={`${id}-hint`}>{hint}</Hint>
    </div>
  );
}

/**
 * A money or count field that can also be empty (`null`) — "Vide = jamais
 * offerte" is a real state, and a number input that turns a cleared field into
 * 0 would silently make delivery free from 0 MAD.
 */
export function NumberInput({
  label,
  hint,
  required,
  className,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
  placeholder,
}: Common & {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onChange(raw === "" ? null : Number(raw));
          }}
          required={required}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(controlCls, "h-10 tabular-nums", suffix && "pr-14")}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
      <Hint id={`${id}-hint`}>{hint}</Hint>
    </div>
  );
}

export function SelectInput<T extends string>({
  label,
  hint,
  required,
  className,
  value,
  onChange,
  options,
}: Common & { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(controlCls, "h-10")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Hint id={`${id}-hint`}>{hint}</Hint>
    </div>
  );
}

/** A labelled switch-like checkbox with a line of explanation under it. */
export function CheckRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-4 flex-none rounded border-input accent-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/** A form's inline error, announced when it appears. */
export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-strong">
      {message}
    </p>
  );
}
