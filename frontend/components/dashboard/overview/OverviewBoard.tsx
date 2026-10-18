"use client";

import { Check, EyeOff, Pencil, Plus, RotateCcw } from "lucide-react";
import { type ReactNode, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { DraggableWidgetGrid, type WidgetItem, type WidgetSize } from "@/components/ui/draggable-widget-grid";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type BoardWidget = { id: string; size: WidgetSize; label: string; node: ReactNode };

/** What the operator changed: order, size and visibility of each widget. */
type Entry = { id: string; size: WidgetSize; hidden?: boolean };

const STORAGE_KEY = "pdh-overview-layout";
/** The first version kept the order only, as a list of ids. Still read. */
const LEGACY_KEY = "pdh-overview-order";
const CHANGED = "pdh-overview-layout-changed";
const SIZES: WidgetSize[] = ["sm", "wide", "tall", "lg"];

const SIZE_OPTIONS: { size: WidgetSize; label: string; w: number; h: number }[] = [
  { h: 1, label: "Petit", size: "sm", w: 1 },
  { h: 1, label: "Large", size: "wide", w: 2 },
  { h: 2, label: "Haut", size: "tall", w: 1 },
  { h: 2, label: "Grand", size: "lg", w: 2 },
];

/** Per browser, a viewer's own arrangement: nothing here is shared or needs
 * to survive cleared storage. */
function readSaved(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
}

function writeSaved(entries: Entry[] | null) {
  try {
    if (entries) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    else window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Private mode or blocked storage: the arrangement simply is not kept.
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const subscribeNever = () => () => {};

/**
 * The saved layout applied to today's widgets: saved ones first in their
 * saved order, size and visibility (an id string from the first version is
 * an order with default sizes), then any widget added since, at the end.
 * Ids that no longer exist are dropped.
 */
function resolve(widgets: BoardWidget[], saved: string | null): Entry[] {
  const defaults: Entry[] = widgets.map((w) => ({ id: w.id, size: w.size }));
  let raw: unknown;
  try {
    raw = saved ? JSON.parse(saved) : null;
  } catch {
    raw = null;
  }
  if (!Array.isArray(raw)) return defaults;
  const known = new Map(widgets.map((w) => [w.id, w]));
  const first: Entry[] = [];
  for (const e of raw) {
    const id = typeof e === "string" ? e : e?.id;
    if (typeof id !== "string" || !known.has(id) || first.some((f) => f.id === id)) continue;
    const size = typeof e === "object" && SIZES.includes(e.size) ? (e.size as WidgetSize) : known.get(id)!.size;
    first.push({ hidden: typeof e === "object" && e.hidden === true, id, size });
  }
  return [...first, ...defaults.filter((d) => !first.some((f) => f.id === d.id))];
}

/** A size choice, drawn as its own shape. */
function SizeGlyph({ w, h }: { w: number; h: number }) {
  return (
    <span className="grid grid-cols-2 grid-rows-2 gap-px" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => {
        const on = i % 2 < w && Math.floor(i / 2) < h;
        return <span key={i} className={`size-1.5 rounded-[1px] ${on ? "bg-current" : "bg-current/20"}`} />;
      })}
    </span>
  );
}

/**
 * The overview as a board the operator arranges freely.
 *
 * Read-only by default, so links inside the widgets work as links. The
 * pencil turns on editing: widgets can be dragged (long press on a phone,
 * Alt + arrows on a keyboard), each one gets a size picker and a hide
 * button, and hidden ones come back from "Ajouter un bloc". Everything is
 * kept in this browser; "Par défaut" puts the original board back.
 *
 * The widgets are rendered on the server and handed in as nodes; each one's
 * own card frame is flattened so the grid's card is the only frame, and a
 * widget taller than its cell scrolls inside it.
 */
export function OverviewBoard({ widgets }: { widgets: BoardWidget[] }) {
  const [editing, setEditing] = useState(false);
  const [resets, setResets] = useState(0);
  // Null on the server and during hydration, the saved layout after it.
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  // False on the server, true once hydrated: the grid reads its items on
  // mount, so it is mounted again once the saved layout is known.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  const layout = useMemo(() => resolve(widgets, saved), [widgets, saved]);
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const items: WidgetItem[] = useMemo(
    () => layout.filter((e) => !e.hidden).map((e) => ({ id: e.id, label: byId.get(e.id)?.label, size: e.size })),
    [layout, byId],
  );
  const hidden = layout.filter((e) => e.hidden);

  /** A drop reorders the visible widgets; the hidden ones keep their place
   * at the end, so showing one again does not shuffle the rest. */
  const onChange = useCallback(
    (next: WidgetItem[]) => {
      const sizes = new Map(layout.map((e) => [e.id, e.size]));
      writeSaved([...next.map((w) => ({ id: w.id, size: sizes.get(w.id) ?? w.size })), ...layout.filter((e) => e.hidden)]);
    },
    [layout],
  );

  const setSize = (id: string, size: WidgetSize) => writeSaved(layout.map((e) => (e.id === id ? { ...e, size } : e)));
  const setHidden = (id: string, isHidden: boolean) => {
    const rest = layout.filter((e) => e.id !== id);
    const entry = { ...layout.find((e) => e.id === id)!, hidden: isHidden };
    // A widget shown again comes back last among the visible ones.
    writeSaved(isHidden ? [...rest, entry] : [...rest.filter((e) => !e.hidden), entry, ...rest.filter((e) => e.hidden)]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {editing && (
          <p className="mr-auto text-sm text-muted-foreground">
            Glissez pour déplacer, choisissez une taille, masquez ce qui ne vous sert pas. Sur téléphone, appuyez longuement puis glissez.
          </p>
        )}
        {editing && hidden.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="size-4" aria-hidden="true" /> Ajouter un bloc ({hidden.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hidden.map((e) => (
                <DropdownMenuItem key={e.id} onSelect={() => setHidden(e.id, false)}>
                  {byId.get(e.id)?.label ?? e.id}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {editing && saved && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              writeSaved(null);
              setResets((n) => n + 1);
            }}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Par défaut
          </Button>
        )}
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          onClick={() => setEditing((v) => !v)}
          aria-pressed={editing}
          aria-label={editing ? "Terminer la modification" : "Modifier la disposition"}
          title={editing ? "Terminer" : "Modifier la disposition"}
        >
          {editing ? <Check className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
          {editing ? "Terminé" : "Modifier"}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Tous les blocs sont masqués. Utilisez « Ajouter un bloc » pour en afficher.
        </p>
      ) : (
        <DraggableWidgetGrid
          // Mounted again only once the saved layout is known and on reset;
          // a resize, hide or drop reaches the mounted grid through `items`.
          key={`${hydrated ? "client" : "server"}-${resets}`}
          items={items}
          onChange={onChange}
          editable={editing}
          // Three columns of landscape cells: 24 cells make four bands.
          maxColumns={3}
          cellSize={420}
          rowRatio={0.45}
          // 24px, not the grid's 12: at 12 the cards read as one welded slab.
          gap={24}
          radius={16}
          renderItem={(item) => (
            <>
              <div
                className={`h-full overflow-auto [&>*]:h-full [&>*]:min-h-full [&>*]:rounded-none! [&>*]:border-0! [&>*]:shadow-none! [&>*]:ring-0! ${
                  editing ? "pointer-events-none" : ""
                }`}
              >
                {byId.get(item.id)?.node}
              </div>
              {editing && (
                // The controls sit above the widget and keep their pointer
                // events to themselves, so a click on them never starts a drag.
                <div
                  className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-card/95 p-0.5 shadow-sm backdrop-blur"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {SIZE_OPTIONS.map((o) => (
                    <button
                      key={o.size}
                      type="button"
                      onClick={() => setSize(item.id, o.size)}
                      aria-pressed={item.size === o.size}
                      aria-label={`${o.label} — ${item.label}`}
                      title={o.label}
                      className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                        item.size === o.size ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <SizeGlyph w={o.w} h={o.h} />
                    </button>
                  ))}
                  <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setHidden(item.id, true)}
                    aria-label={`Masquer ${item.label}`}
                    title="Masquer"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <EyeOff className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          )}
        />
      )}
    </div>
  );
}
