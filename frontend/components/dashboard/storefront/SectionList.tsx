"use client";

import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { CONTENT_LESS_SECTIONS } from "@/components/dashboard/storefront/sectionEditors";
import { cn } from "@/lib/dashboard/cn";
import {
  SECTION_GROUP_LABELS,
  SECTION_GROUPS,
  SECTION_LABELS,
  type Rail,
  type SectionEntry,
  type SectionEntryKey,
} from "@/lib/dashboard/storefront-mapping";

function labelFor(key: SectionEntryKey, rails: Rail[]): string {
  if (key.startsWith("rail:")) {
    const railKey = key.slice("rail:".length);
    return rails.find((r) => r.key === railKey)?.title || "Rail produits";
  }
  return SECTION_LABELS[key as keyof typeof SECTION_LABELS] || key;
}

// Rails are dynamic (not one of the fixed SECTION_KEYS) but belong in the
// same "Produits" library group as the other product blocks.
function groupFor(key: SectionEntryKey): string {
  if (key.startsWith("rail:")) return "products";
  return SECTION_GROUPS[key as keyof typeof SECTION_GROUPS] || "content";
}

export function SectionList({
  sections,
  onChange,
  selectedKey,
  onSelect,
  rails,
  onAddRail,
  onDeleteRail,
}: {
  sections: SectionEntry[];
  onChange: (next: SectionEntry[]) => void;
  selectedKey: SectionEntryKey | null;
  onSelect: (key: SectionEntryKey) => void;
  rails: Rail[];
  onAddRail: () => void;
  onDeleteRail: (railKey: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<SectionEntryKey | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function toggleVisible(index: number) {
    const next = [...sections];
    next[index] = { ...next[index], visible: !next[index].visible };
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-1">
      {sections.map((s, index) => {
        const isRail = s.key.startsWith("rail:");
        const group = groupFor(s.key);
        const showGroupHeader = group !== groupFor(sections[index - 1]?.key ?? s.key) || index === 0;
        return (
          <div key={s.key}>
            {showGroupHeader && (
              <div className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 first:mt-1">
                {SECTION_GROUP_LABELS[group] || group}
              </div>
            )}
            <div
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2 py-2 text-sm",
                selectedKey === s.key ? "border-violet-300 bg-violet-50" : "border-transparent hover:bg-gray-50",
              )}
            >
              <span className="cursor-grab text-gray-300" aria-hidden="true">
                <GripVertical className="h-4 w-4" />
              </span>
              <button
                type="button"
                onClick={() => onSelect(s.key)}
                className={cn("flex-1 truncate text-left font-medium", s.visible ? "text-gray-800" : "text-gray-400 line-through")}
              >
                {labelFor(s.key, rails)}
                {!isRail && CONTENT_LESS_SECTIONS.includes(s.key as never) && (
                  <span className="ml-1 text-[10px] font-normal text-gray-400">(non éditable)</span>
                )}
              </button>
              {isRail && (
                <button
                  type="button"
                  aria-label="Supprimer ce rail"
                  onClick={() => setConfirmDeleteKey(s.key)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                aria-label={s.visible ? "Masquer" : "Afficher"}
                onClick={() => toggleVisible(index)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                {s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAddRail}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2 py-2 text-xs font-medium text-gray-500 hover:border-violet-300 hover:text-violet-700"
      >
        <Plus className="h-3.5 w-3.5" /> Ajouter un rail produits
      </button>

      {confirmDeleteKey && (
        <Modal title="Supprimer ce rail ?" onClose={() => setConfirmDeleteKey(null)}>
          <p className="text-sm text-gray-600">Cette action supprimera ce rail produits de la page d&apos;accueil, avec tout son contenu.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmDeleteKey(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteRail(confirmDeleteKey.slice("rail:".length));
                setConfirmDeleteKey(null);
              }}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
