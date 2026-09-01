"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/dashboard/ui/Button";

/**
 * Catches anything thrown while rendering a dashboard page.
 *
 * Because it sits inside (app)/layout.tsx, the sidebar and topbar survive the
 * failure: a data fetch that throws costs the operator the page they asked
 * for, not the whole application and their way out of it. Before this file
 * existed, `listOrders()` rejecting on a CMS hiccup dropped them onto Next's
 * unstyled error screen with no navigation at all — and no way back short of
 * retyping the URL.
 *
 * Errors thrown by (app)/layout.tsx itself are deliberately *not* caught
 * here; a boundary cannot catch its own layout. dashboard/error.tsx is the
 * one that covers the session lookup.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Nothing reports errors off this box, so the console is the only trail
  // left for whoever gets called about it.
  useEffect(() => {
    console.error("Erreur du tableau de bord :", error);
  }, [error]);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>

        <h1 className="mt-4 text-base font-semibold text-gray-900">Cette page n&apos;a pas pu se charger</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Le serveur n&apos;a pas répondu comme prévu. Réessayez — si le problème persiste, le catalogue ou les
          commandes sont probablement injoignables.
        </p>

        {/* Both are rendered because they are useful at different times: in
            production Next replaces a server-side message with a generic one
            and hands over `digest` instead, so the message is what makes this
            screen worth reading in development, and the digest is what ties a
            phone call to a line in the server log. */}
        {error.message && (
          <p className="mt-4 break-words rounded-lg bg-gray-50 px-3 py-2 text-left font-mono text-xs text-gray-600">
            {error.message}
          </p>
        )}
        {error.digest && <p className="mt-2 text-xs text-gray-400">Référence : {error.digest}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
