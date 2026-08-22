"use client";

import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { cn } from "@/lib/dashboard/cn";
import type { NavItemDraft } from "@/lib/dashboard/storefront-mapping";

/** Main navigation items — same drag/reorder/visibility/delete conventions
 * as SectionList.tsx (Home tab), applied to the "navigation" global's
 * items[] instead of Home's sections[]. */
export function NavigationList({
  items,
  onChange,
  selectedIndex,
  onSelect,
  onAdd,
}: {
  items: NavItemDraft[];
  onChange: (next: NavItemDraft[]) => void;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onAdd: () => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function toggleVisible(index: number) {
    const next = [...items];
    next[index] = { ...next[index], visible: !next[index].visible };
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
    setConfirmDeleteIndex(null);
    if (selectedIndex === index) onSelect(-1);
  }

  return (
    <div className="flex flex-col gap-1">
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
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2 py-2 text-sm",
            selectedIndex === index ? "border-violet-300 bg-violet-50" : "border-transparent hover:bg-gray-50",
          )}
        >
          <span className="cursor-grab text-gray-300" aria-hidden="true">
            <GripVertical className="h-4 w-4" />
          </span>
          <button
            type="button"
            onClick={() => onSelect(index)}
            className={cn("flex-1 truncate text-left font-medium", item.visible ? "text-gray-800" : "text-gray-400 line-through")}
          >
            {item.label || "Nouveau lien"}
            {item.megaMenuEnabled && <span className="ml-1 text-[10px] font-normal text-violet-500">(mega menu)</span>}
          </button>
          <button
            type="button"
            aria-label="Supprimer ce lien"
            onClick={() => setConfirmDeleteIndex(index)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={item.visible ? "Masquer" : "Afficher"}
            onClick={() => toggleVisible(index)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
          >
            {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2 py-2 text-xs font-medium text-gray-500 hover:border-violet-300 hover:text-violet-700"
      >
        <Plus className="h-3.5 w-3.5" /> Ajouter un lien
      </button>

      {confirmDeleteIndex !== null && (
        <Modal title="Supprimer ce lien ?" onClose={() => setConfirmDeleteIndex(null)}>
          <p className="text-sm text-gray-600">Cette action supprimera ce lien de la navigation, avec son mega menu s&apos;il en a un.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmDeleteIndex(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="button" onClick={() => remove(confirmDeleteIndex)} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
