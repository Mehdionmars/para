import { Baby, Droplet, Feather, Palette, ScanFace, Scissors, type LucideIcon } from "lucide-react";
import { SERVICES, type Service, type ServiceStep } from "@/data/services";
import { resolveMediaUrl, type PayloadMediaRef } from "@/lib/storefront/products";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when a service is saved. */
export const SERVICES_TAG = "services";

/**
 * Payload stores the icon as a name; the page needs a component.
 *
 * The generated snapshot resolves this with its own copy of the same map. It
 * is repeated rather than imported because `data/services.ts` is regenerated
 * by `sync-cms` and its private `ICONS` const is not exported — importing it
 * would be a dependency on a file that is rewritten wholesale.
 */
export const SERVICE_ICONS: Record<string, LucideIcon> = { Baby, Droplet, Feather, Palette, ScanFace, Scissors };
const ICONS = SERVICE_ICONS;

type RawService = {
  id?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  price?: number;
  duration?: string;
  expert?: string;
  bg?: string;
  icon?: string;
  image?: PayloadMediaRef;
  benefits?: { text?: string }[];
  steps?: { title?: string; sub?: string }[];
};

function toService(raw: RawService, i: number): Service {
  return {
    id: raw.id ?? i,
    img: resolveMediaUrl(raw.image) || "",
    title: raw.title?.trim() || "",
    sub: raw.subtitle?.trim() || "",
    // 0 is the "Offert" case the page already knows how to render, so an
    // unset price stays 0 rather than becoming a missing value.
    price: typeof raw.price === "number" ? raw.price : 0,
    duration: raw.duration?.trim() || "",
    expert: raw.expert?.trim() || "",
    bg: raw.bg?.trim() || "#F2E9F2",
    icon: (raw.icon && ICONS[raw.icon]) || Feather,
    desc: raw.description?.trim() || "",
    benefits: (raw.benefits || []).map((b) => b.text?.trim() || "").filter(Boolean),
    steps: (raw.steps || [])
      .map((s, n): ServiceStep => ({ n: String(n + 1).padStart(2, "0"), title: s.title?.trim() || "", sub: s.sub?.trim() || "" }))
      .filter((s) => s.title),
  };
}

/**
 * The in-store services, live.
 *
 * These three pages (`/services`, `/services/[id]`, and its booking step) read
 * `data/services.ts`, so a price, a duration or a whole new service only
 * reached visitors after a `sync-cms` and a redeploy.
 *
 * The snapshot remains the fallback: a services page that renders nothing
 * because the CMS blinked is worse than one showing last-known-good copy.
 */
export async function fetchServices(): Promise<Service[]> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/services?limit=50&depth=1&sort=order`, {
      next: { revalidate: 3600, tags: [SERVICES_TAG] },
    });
  } catch {
    return SERVICES;
  }
  if (!res.ok) return SERVICES;

  const data = await res.json();
  const docs = (data.docs || []) as RawService[];
  const services = docs.map(toService).filter((s) => s.title);
  return services.length > 0 ? services : SERVICES;
}

/** One service by id, live — same fallback contract as `fetchServices`. */
export async function fetchServiceById(id: number): Promise<Service | undefined> {
  const all = await fetchServices();
  return all.find((s) => s.id === id);
}
