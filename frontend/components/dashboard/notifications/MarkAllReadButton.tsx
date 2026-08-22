"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { markAllRead } from "@/app/dashboard/(app)/notifications/actions";
import { Button } from "@/components/dashboard/ui/Button";
import { useToast } from "@/components/dashboard/ui/Toast";

export function MarkAllReadButton({ count }: { count: number }) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAllRead();
          if (result.ok) toast.success(`${result.updated ?? count} notification(s) marquée(s) comme lue(s)`);
          else toast.error("Impossible de tout marquer comme lu", result.error);
        })
      }
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      Tout marquer comme lu
    </Button>
  );
}
