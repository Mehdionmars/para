import Link from "next/link";

export type BreadcrumbItem = { label: string; href?: string };

/** Shared breadcrumb trail for every catalogue-adjacent page (product, brand,
 * category, collections). The last item is always the current page — plain
 * text, not a link, regardless of whether an `href` was passed for it. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ fontSize: 11.5, letterSpacing: ".04em", marginBottom: 22 }}>
      <ol style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {i > 0 && (
                <span aria-hidden="true" style={{ opacity: 0.4 }}>
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  style={{ opacity: isLast ? 0.85 : 0.55, fontWeight: isLast ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="link-hover" style={{ color: "inherit", opacity: 0.55 }}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
