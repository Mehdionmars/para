import type { MegaColumn, MegaMenuContent } from "@/data/nav";
import { routes } from "@/lib/routes";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Purged with the navigation: a new sub-category changes the mega menu. */
export const CATEGORY_TREE_TAG = "navigation";

/**
 * The Categories tree, for mega menus nobody filled in by hand.
 *
 * ## Why this exists
 *
 * The mega menu reads `navigation.items[].megaMenu.columns` — a list an
 * editor types per nav entry. The Navigation global is decoupled from the
 * Categories collection on purpose ("adding a category no longer auto-adds a
 * nav entry"), and that decision stands for the *navbar*. But it left the
 * menus themselves empty: hovering Visage, Cheveux or Corps opened nothing,
 * because `MegaMenu` returns null when a key has no columns.
 *
 * Meanwhile the shape the menu needs was already in the database. The
 * Categories collection describes itself as exactly that:
 *
 *   "Level 0 (no parent) = navbar entries. Level 1 = mega-menu columns.
 *    Level 2 = items inside a column."
 *
 * So this reads that tree and builds the columns from it. The CMS still wins
 * wherever an editor has written something — this only fills a menu that
 * would otherwise not open at all.
 *
 * ## Why the links are safe
 *
 * Every level resolves to /shop/<slug>, and that route already recognises
 * sub-category slugs: verified against preprod, /shop/nettoyants,
 * /shop/serums, /shop/cremes, /shop/eaux-micellaires, /shop/anti-taches and
 * /shop/contour-des-yeux all answer 200. A slug with no product filter yet
 * renders the "bientôt disponible" state with the aisle selector, which is a
 * page — not the 404 a made-up slug would give.
 */

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  order: number;
  children: CategoryNode[];
};

export type CategoryTree = {
  /** Level-0 nodes, keyed by slug. */
  roots: Map<string, CategoryNode>;
};

type RawCategory = {
  id?: number;
  name?: string;
  slug?: string;
  parent?: number | { id?: number } | null;
  order?: number;
  isActive?: boolean;
};

function parentId(parent: RawCategory["parent"]): number | null {
  if (typeof parent === "number") return parent;
  if (parent && typeof parent === "object" && typeof parent.id === "number") return parent.id;
  return null;
}

/** An empty tree — the shape every failure path returns. */
export const EMPTY_CATEGORY_TREE: CategoryTree = { roots: new Map() };

export async function fetchCategoryTree(): Promise<CategoryTree> {
  let res: Response;
  try {
    // depth=0 keeps `parent` a bare id, which is all the tree needs and
    // avoids Payload expanding every ancestor on every row.
    res = await fetch(`${CMS_URL}/api/categories?limit=500&depth=0&sort=order`, {
      next: { revalidate: 3600, tags: [CATEGORY_TREE_TAG] },
    });
  } catch {
    return EMPTY_CATEGORY_TREE;
  }
  if (!res.ok) return EMPTY_CATEGORY_TREE;

  const data = await res.json().catch(() => null);
  const docs = (data?.docs ?? []) as RawCategory[];

  const nodes = new Map<number, CategoryNode>();
  for (const doc of docs) {
    // isActive is opt-out: a row saved before the field existed has it
    // undefined and must still appear.
    if (doc.isActive === false) continue;
    if (typeof doc.id !== "number") continue;
    const name = doc.name?.trim();
    const slug = doc.slug?.trim();
    if (!name || !slug) continue;

    nodes.set(doc.id, {
      id: doc.id,
      name,
      slug,
      parent: parentId(doc.parent),
      order: typeof doc.order === "number" ? doc.order : 0,
      children: [],
    });
  }

  // Second pass: a child can appear before its parent in the response.
  for (const node of nodes.values()) {
    if (node.parent === null) continue;
    // A parent that was filtered out (inactive, malformed) leaves its
    // children orphaned rather than promoting them to the navbar: they would
    // otherwise surface as top-level entries nobody asked for.
    nodes.get(node.parent)?.children.push(node);
  }

  const byOrder = (a: CategoryNode, b: CategoryNode) => a.order - b.order || a.name.localeCompare(b.name, "fr");
  for (const node of nodes.values()) node.children.sort(byOrder);

  const roots = new Map<string, CategoryNode>();
  for (const node of nodes.values()) {
    if (node.parent === null) roots.set(node.slug, node);
  }

  return { roots };
}

const MAX_COLUMNS = 5;
const MAX_LINKS_PER_COLUMN = 15;

function toLink(node: CategoryNode) {
  return { href: routes.category(node.slug), label: node.name };
}

/**
 * Builds a menu for one navbar slug, or null when the tree has nothing to
 * show for it.
 *
 * Two shapes, decided by the data rather than by a setting:
 *
 * - Level 1 nodes that have children of their own become columns, with their
 *   children as the links (Visage > Nettoyants > Eaux micellaires...).
 * - Level 1 nodes with no children are themselves the links, gathered under
 *   a single column. That is the flat case, and it is what a shop whose
 *   taxonomy stops at two levels actually has.
 *
 * Mixed trees get both: the branches become columns and the leaves are
 * collected into one "Tout <catégorie>" column, so nothing is dropped for
 * being shaped differently from its siblings.
 */
export function megaMenuFromCategoryTree(tree: CategoryTree, slug: string): MegaMenuContent | null {
  const root = tree.roots.get(slug);
  if (!root || root.children.length === 0) return null;

  const branches = root.children.filter((c) => c.children.length > 0);
  const leaves = root.children.filter((c) => c.children.length === 0);

  const columns: MegaColumn[] = branches.slice(0, MAX_COLUMNS).map((branch) => ({
    title: branch.name,
    links: branch.children.slice(0, MAX_LINKS_PER_COLUMN).map(toLink),
  }));

  if (leaves.length > 0 && columns.length < MAX_COLUMNS) {
    columns.push({
      // Named after the category when it is the only column, so the panel
      // does not repeat a generic heading over a list that is self-evident.
      title: branches.length === 0 ? root.name : `Autres ${root.name.toLowerCase()}`,
      links: leaves.slice(0, MAX_LINKS_PER_COLUMN).map(toLink),
    });
  }

  if (columns.length === 0) return null;

  return { subtitle: "", columns, promo: null };
}
