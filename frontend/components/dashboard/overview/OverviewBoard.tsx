"use client";

import { Check, Pencil, RotateCcw } from "lucide-react";
import { type ReactNode, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { DraggableWidgetGrid, type WidgetItem, type WidgetSize } from "@/components/ui/draggable-widget-grid";
import { Button } from "@/components/ui/button";

export type BoardWidget = { id: string; size: WidgetSize; label: string; node: ReactNode };

const STORAGE_KEY = "pdh-overview-order";
const CHANGED = "pdh-overview-order-changed";

/** The saved order, as a list of widget ids. Per browser, a viewer's own
 * arrangement: nothing here is shared or needs to survive cleared storage. */
function readSaved(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeSaved(ids: string[] | null) {
  try {
    if (ids) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    else window.localStorage.removeItem(STORAGE_KEY);
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

/** Applies a saved id order: known ids first in their saved order, then any
 * widget added since, in its default place at the end. */
function ordered(widgets: BoardWidget[], saved: string | null): BoardWidget[] {
  let ids: unknown;
  try {
    ids = saved ? JSON.parse(saved) : null;
  } catch {
    ids = null;
  }
  if (!Array.isArray(ids)) return widgets;
  const byId = new Map(widgets.map((w) => [w.id, w]));
  const first = ids.flatMap((id) => (typeof id === "string" && byId.has(id) ? [byId.get(id)!] : []));
  return [...first, ...widgets.filter((w) => !first.includes(w))];
}

/**
 * The overview as a board of widgets the operator can rearrange.
 *
 * Read-only by default, so links inside the widgets work as links. The
 * pencil turns on editing: widgets lift and can be dragged (long press on a
 * phone, Alt + arrows on a keyboard), and "Terminé" turns it off again. The
 * order is kept in this browser; "Par défaut" puts it back.
 *
 * The widgets are rendered on the server and handed in as nodes; each one's
 * own card frame is flattened (border, radius, shadow) so the grid's card is
 * the only frame, and a widget taller than its cell scrolls inside it.
 */
export function OverviewBoard({ widgets }: { widgets: BoardWidget[] }) {
  const [editing, setEditing] = useState(false);
  const [resets, setResets] = useState(0);
  // Null on the server and during hydration, the saved order after it, so
  // the first client render matches the server's.
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  const items = useMemo(() => ordered(widgets, saved), [widgets, saved]);
  const nodes = useMemo(() => new Map(widgets.map((w) => [w.id, w.node])), [widgets]);

  const onChange = useCallback((next: WidgetItem[]) => writeSaved(next.map((w) => w.id)), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {editing && (
          <p className="mr-auto text-sm text-muted-foreground">
            Glissez les blocs pour les réorganiser. Sur téléphone, appuyez longuement puis glissez.
          </p>
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
          aria-label={editing ? "Terminer la réorganisation" : "Réorganiser les blocs"}
          title={editing ? "Terminer" : "Réorganiser les blocs"}
        >
          {editing ? <Check className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
          {editing ? "Terminé" : "Modifier"}
        </Button>
      </div>

      <DraggableWidgetGrid
        // The grid reads its items once, on mount. It is re-mounted twice at
        // most: when the saved order arrives after hydration, and on reset —
        // never on a drag, whose own write leaves the key unchanged.
        key={`${saved === null ? "default" : "saved"}-${resets}`}
        items={items}
        onChange={onChange}
        editable={editing}
        maxColumns={6}
        cellSize={210}
        // 24px, not the grid's 12: at 12 the cards read as one welded slab.
        gap={24}
        radius={16}
        renderItem={(item) => (
          <div
            className={`h-full overflow-auto [&>*]:h-full [&>*]:min-h-full [&>*]:rounded-none! [&>*]:border-0! [&>*]:shadow-none! [&>*]:ring-0! ${
              editing ? "pointer-events-none" : ""
            }`}
          >
            {nodes.get(item.id)}
          </div>
        )}
      />
    </div>
  );
}
