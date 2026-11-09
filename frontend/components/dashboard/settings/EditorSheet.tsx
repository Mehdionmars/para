"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormError } from "./fields";

/**
 * The side panel every settings record is edited in: a title, a scrolling
 * form, and a footer that stays in reach with the save button — on a phone the
 * panel is full width and the footer sits above the home indicator.
 *
 * Radix's Sheet brings the focus trap, Escape, the scroll lock and focus
 * return. Deleting asks for a second, explicit click in the footer itself
 * rather than a dialog over the dialog, which would fight the sheet's focus
 * trap.
 */
export function EditorSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  saving,
  error,
  onSubmit,
  onDelete,
  deleteLabel = "Supprimer",
  deleting = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  saving: boolean;
  error: string;
  onSubmit: () => void;
  /** Omitted for a new record, or when the role may not delete. */
  onDelete?: () => void;
  deleteLabel?: string;
  deleting?: boolean;
  children: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const busy = saving || deleting;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Closing mid-save would drop the answer on the floor.
        if (busy) return;
        setConfirming(false);
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        <form
          className="flex h-full min-h-0 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) onSubmit();
          }}
        >
          <SheetHeader className="border-b border-border px-5 py-4 pr-14">
            <SheetTitle className="text-base">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <div className="flex flex-col gap-5">{children}</div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border bg-card px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <FormError message={error} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {onDelete &&
                  (confirming ? (
                    <>
                      <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={busy}>
                        {deleting && <Loader2 className="animate-spin" aria-hidden="true" />}
                        Confirmer la suppression
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                        Non
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive-strong hover:bg-destructive/10 hover:text-destructive-strong"
                      onClick={() => setConfirming(true)}
                      disabled={busy}
                    >
                      <Trash2 aria-hidden="true" />
                      {deleteLabel}
                    </Button>
                  ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                  Annuler
                </Button>
                <Button type="submit" disabled={busy}>
                  {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {saving ? "Enregistrement…" : submitLabel}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
