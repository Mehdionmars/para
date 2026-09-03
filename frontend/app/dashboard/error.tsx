"use client";

import { RotateCw, ServerCrash } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/dashboard/ui/Button";

/**
 * The outer net: errors thrown by (app)/layout.tsx and by the login page.
 *
 * (app)/error.tsx cannot catch these — a boundary never catches the layout
 * it lives inside — and the layout is where `getSessionUser()` runs, so a
 * backend that is down takes out the session lookup before any page renders.
 * That is precisely when the operator most needs to be told what happened
 * rather than shown a blank screen.
 *
 * It paints its own full-height background because there is no shell at this
 * depth: dashboard/layout.tsx supplies <html> and <body>, nothing more.
 */
export default function DashboardRootError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Next 16 hands both to an error boundary. `reset()` only re-renders the
   * children; `unstable_retry()` re-fetches them first, which is the whole
   * point here — every error this catches is a failed request, and clearing
   * the error state without going back to the server would redraw the same
   * failure. Falls back to `reset` so the button still does something if the
   * unstable API is withdrawn. */
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error("Erreur du tableau de bord (racine) :", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 text-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ServerCrash className="h-5 w-5" aria-hidden="true" />
        </span>

        <h1 className="mt-4 text-base font-semibold text-gray-900">Le tableau de bord est indisponible</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Votre session n&apos;a pas pu être vérifiée. C&apos;est en général le signe que le backend ne répond pas.
          Réessayez dans un instant, ou reconnectez-vous.
        </p>

        {error.message && (
          <p className="mt-4 break-words rounded-lg bg-gray-50 px-3 py-2 text-left font-mono text-xs text-gray-600">
            {error.message}
          </p>
        )}
        {error.digest && <p className="mt-2 text-xs text-gray-400">Référence : {error.digest}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => (unstable_retry ?? reset)()}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </Button>
          <Link href="/dashboard/login" className={buttonVariants({ variant: "outline" })}>
            Se reconnecter
          </Link>
        </div>
      </div>
    </div>
  );
}
