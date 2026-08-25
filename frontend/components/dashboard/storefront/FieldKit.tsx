"use client";

import type { ReactNode } from "react";

const labelCls = "text-xs font-medium text-gray-600";
const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Optional, and the same idea as TextField's: where a blank field falls
   *  back to a default, showing that default is how an editor knows what
   *  they are replacing. */
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <textarea
        className={`${inputCls} min-h-16 resize-y`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <input
        type="number"
        className={inputCls}
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Payload stores dates as full ISO timestamps; <input type="date"> needs
  // just the yyyy-mm-dd slice, and writes back midnight UTC for that date.
  const dateOnly = value ? value.slice(0, 10) : "";
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <input
        type="date"
        className={inputCls}
        value={dateOnly}
        onChange={(e) => onChange(e.target.value ? new Date(`${e.target.value}T00:00:00.000Z`).toISOString() : "")}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { label: string; value: string }[] | readonly string[];
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}


// Re-exported, not reimplemented. The theme editor, the per-nav-item styling
// and the three chrome panels all edit a colour, and three near-identical
// controls is how they drift: one grows a palette, another grows a contrast
// warning, and an operator learns two sets of manners for one job.
export { ColorField } from "@/components/dashboard/appearance/ColorField";

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
      {label}
    </label>
  );
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

export function EditorHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
    </div>
  );
}
