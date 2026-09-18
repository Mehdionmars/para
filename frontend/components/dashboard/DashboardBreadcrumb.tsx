"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Segment labels, in French, matching the sidebar's wording exactly.
 *
 * A segment missing from this map is treated as a record identifier rather
 * than a page name — see `labelFor`. That is the common case: /orders/[id],
 * /customers/[email], /products/[id] and /inventory/[product] all end in a
 * value, not a noun.
 */
const SEGMENT_LABELS: Record<string, string> = {
  analytics: "Analytics",
  clients: "Clients",
  coupons: "Coupons",
  customers: "Clients",
  dashboard: "Tableau de bord",
  import: "Importer",
  inventory: "Inventaire",
  invoices: "Factures",
  movements: "Mouvements",
  new: "Nouveau",
  notifications: "Notifications",
  orders: "Commandes",
  print: "Impression",
  products: "Produits",
  recu: "Reçu",
  settings: "Paramètres",
  storefront: "Storefront",
};

function labelFor(segment: string) {
  const known = SEGMENT_LABELS[segment];
  if (known) return known;

  // An identifier, then. A customer route carries the email address in the
  // path; printing it into the header puts it in every screenshot and screen
  // share of that page, so the crumb names the kind of thing instead. Opaque
  // ids are truncated, because a 24-character id pushes the real trail off a
  // narrow screen and tells the reader nothing either way.
  const decoded = safeDecode(segment);
  if (decoded.includes("@")) return "Client";
  return decoded.length > 12 ? `${decoded.slice(0, 8)}…` : decoded;
}

function safeDecode(segment: string) {
  // A stray "%" in a path throws from decodeURIComponent rather than
  // returning the input, which would take down the whole shell over a
  // cosmetic label.
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Where you are, derived from the path.
 *
 * Hidden on the overview itself: a one-item breadcrumb reading "Tableau de
 * bord" directly under a page titled "Vue d'ensemble" is furniture, not
 * orientation. It appears from the second level down, where it earns its
 * place — /dashboard/orders/6f2a is three clicks from anywhere and the trail
 * is the way back.
 */
export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          // The separator is a sibling of the item, never a child of it:
          // both render an <li>, and an <li> inside an <li> is invalid HTML
          // — React said so on every dashboard page load.
          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="max-w-[40vw] truncate sm:max-w-none">
                    {labelFor(segment)}
                  </BreadcrumbPage>
                ) : (
                  /* Intermediate crumbs below `sm` are dropped rather than
                     wrapped: on a phone the bar has room for the current
                     page and one ancestor, and a breadcrumb that wraps to a
                     second line pushes the search field out of the header. */
                  <BreadcrumbLink asChild className="hidden sm:inline-flex">
                    <Link href={href}>{labelFor(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden sm:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
