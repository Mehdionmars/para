"use client";

import { Boxes, MoreHorizontal, Star, StarOff, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/dashboard/ui/Button";
import { MenuItem, MenuSeparator, Popover } from "@/components/dashboard/ui/Popover";

export type BulkAction =
  | "stock"
  | "price"
  | "status"
  | "promotion"
  | "category"
  | "brand"
  | "feature"
  | "unfeature"
  | "delete";

/**
 * Sticky action bar, shown only when something is selected.
 *
 * Desktop: pinned under the toolbar. Mobile: pinned to the bottom of the
 * viewport, inside the safe area, where a thumb can reach it — the same bar
 * floating at the top of a long scrolled list would be unusable on a phone.
 */
export function ProductBulkToolbar({
  count,
  totalMatching,
  allMatchingSelected,
  canEdit,
  canDelete,
  busy,
  onAction,
  onSelectAllMatching,
  onClear,
}: {
  count: number;
  totalMatching: number;
  allMatchingSelected: boolean;
  canEdit: boolean;
  canDelete: boolean;
  busy: boolean;
  onAction: (action: BulkAction) => void;
  onSelectAllMatching: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;

  const primary: { action: BulkAction; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { action: "stock", icon: Boxes, label: "Stock" },
    { action: "price", icon: Tag, label: "Prix" },
    { action: "status", icon: Tag, label: "Statut" },
  ];

  return (
    <div
      role="region"
      aria-label="Actions groupées"
      className="sticky bottom-0 z-40 -mx-4 border-t border-violet-200 bg-violet-50 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] sm:bottom-auto sm:top-2 sm:mx-0 sm:rounded-xl sm:border sm:shadow-sm"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-violet-900" aria-live="polite">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>

        {/* Only offered when the page is a strict subset of the results —
            otherwise "tout sélectionner" would be a no-op that looks broken. */}
        {!allMatchingSelected && count < totalMatching && (
          <button
            type="button"
            onClick={onSelectAllMatching}
            disabled={busy}
            className="text-xs font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900 disabled:opacity-50"
          >
            Tout sélectionner dans les résultats ({totalMatching})
          </button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {canEdit &&
            primary.map(({ action, label, icon: Icon }) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onAction(action)}
                className="bg-white"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </Button>
            ))}

          {canEdit && (
            <Popover
              label="Plus d'actions groupées"
              trigger={({ toggle, ...aria }) => (
                <Button variant="outline" size="sm" disabled={busy} onClick={toggle} className="bg-white" {...aria}>
                  <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Plus</span>
                </Button>
              )}
            >
              {(close) => (
                <>
                  <MenuItem icon={Tag} onClick={() => { close(); onAction("promotion"); }}>
                    Promotion
                  </MenuItem>
                  <MenuItem icon={Tag} onClick={() => { close(); onAction("category"); }}>
                    Changer la catégorie
                  </MenuItem>
                  <MenuItem icon={Tag} onClick={() => { close(); onAction("brand"); }}>
                    Changer la marque
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem icon={Star} onClick={() => { close(); onAction("feature"); }}>
                    Ajouter à la vitrine
                  </MenuItem>
                  <MenuItem icon={StarOff} onClick={() => { close(); onAction("unfeature"); }}>
                    Retirer de la vitrine
                  </MenuItem>
                </>
              )}
            </Popover>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onAction("delete")}
              className="border-red-200 bg-white text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Supprimer</span>
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onClear} disabled={busy} aria-label="Annuler la sélection">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
