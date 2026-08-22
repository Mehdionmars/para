"use client";

import { ChevronDown, ChevronUp, Copy, GripVertical, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/dashboard/ui/Button";
import { Modal } from "@/components/dashboard/ui/Modal";

/** Generic reorderable/duplicable/deletable array editor — backs every
 * multi-item section in the Storefront Builder (hero slides, rails, CTA
 * tiles, coffrets, trust badges, service cards, dermo picks). Reordering
 * works via native HTML5 drag as well as the up/down buttons, so it stays
 * keyboard-usable. */
export function ArrayField<T>({
  items,
  onChange,
  renderItem,
  renderLabel,
  onAdd,
  addLabel = "Ajouter",
  minItems = 0,
  itemName = "cet élément",
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  renderLabel?: (item: T, index: number) => string;
  onAdd?: () => T;
  addLabel?: string;
  minItems?: number;
  itemName?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    if (openIndex === from) setOpenIndex(to);
  }

  function update(index: number, patch: Partial<T>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
    setConfirmDelete(null);
    if (openIndex === index) setOpenIndex(null);
  }

  function duplicate(index: number) {
    const copy = JSON.parse(JSON.stringify(items[index])) as T;
    const next = [...items];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
            setDragIndex(null);
          }}
          className="rounded-lg border border-gray-200 bg-white"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-2">
            <span className="cursor-grab text-gray-300" aria-hidden="true">
              <GripVertical className="h-4 w-4" />
            </span>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex-1 truncate px-1 text-left text-sm font-medium text-gray-800"
            >
              {renderLabel ? renderLabel(item, index) || `Élément ${index + 1}` : `Élément ${index + 1}`}
            </button>
            <button
              type="button"
              aria-label="Monter"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Descendre"
              disabled={index === items.length - 1}
              onClick={() => move(index, index + 1)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Dupliquer" onClick={() => duplicate(index)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Supprimer"
              disabled={items.length <= minItems}
              onClick={() => setConfirmDelete(index)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {openIndex === index && (
            <div className="border-t border-gray-100 px-3 py-3">{renderItem(item, index, (patch) => update(index, patch))}</div>
          )}
        </div>
      ))}

      {onAdd && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, onAdd()])}>
          + {addLabel}
        </Button>
      )}

      {confirmDelete !== null && (
        <Modal title="Supprimer cette section ?" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-gray-600">Cette action supprimera {itemName} de cette page.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(confirmDelete)}>
              Supprimer
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
