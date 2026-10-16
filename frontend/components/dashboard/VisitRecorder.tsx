"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pageLabel } from "@/components/dashboard/DashboardBreadcrumb";
import { recordVisit } from "@/lib/dashboard/recent";

/** Records each dashboard page opened, for the launcher's "Récemment
 * visités". Renders nothing. The home itself is not recorded: it is where
 * the list is shown. */
export function VisitRecorder() {
  const pathname = usePathname();
  useEffect(() => {
    const label = pageLabel(pathname);
    if (label) recordVisit(pathname, label);
  }, [pathname]);
  return null;
}
