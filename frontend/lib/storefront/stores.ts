import { STORES, type Store } from "@/data/stores";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when a store is saved. */
export const STORES_TAG = "stores";

type RawStore = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: { days?: string; hours?: string }[];
  mapUrl?: string;
};

/** Payload leaves `mapUrl` empty when the editor wants one built from the
 * address — the same convention the sync script follows. */
function mapUrlFor(store: RawStore): string {
  if (store.mapUrl?.trim()) return store.mapUrl.trim();
  if (!store.address?.trim()) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address.trim())}`;
}

function toStore(raw: RawStore): Store {
  return {
    name: raw.name?.trim() || "",
    address: raw.address?.trim() || "",
    phone: raw.phone?.trim() || "",
    email: raw.email?.trim() || "",
    hours: (raw.hours || [])
      .filter((h) => h.days?.trim())
      .map((h) => ({ days: h.days!.trim(), hours: h.hours?.trim() || "" })),
    mapUrl: mapUrlFor(raw),
  };
}

/**
 * The shops, live.
 *
 * The contact and services pages read `data/stores.ts`, so a phone number
 * corrected in the admin only reached visitors after a `sync-cms` and a
 * redeploy — for the one page whose entire job is telling people how to reach
 * the pharmacy.
 *
 * Revalidated on a tag rather than `no-store`: opening hours are not stock.
 * The snapshot stays the fallback for an unreachable CMS, so the page never
 * loses its address.
 */
export async function fetchStores(): Promise<Store[]> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/stores?limit=50&depth=0&sort=order`, {
      next: { revalidate: 3600, tags: [STORES_TAG] },
    });
  } catch {
    return STORES;
  }
  if (!res.ok) return STORES;

  const data = await res.json();
  const docs = (data.docs || []) as RawStore[];
  const stores = docs.map(toStore).filter((s) => s.name);
  // An empty collection is far more likely to be a misconfigured query than a
  // pharmacy with no address, and a contact page with no shop on it is worse
  // than one showing the last known good copy.
  return stores.length > 0 ? stores : STORES;
}
