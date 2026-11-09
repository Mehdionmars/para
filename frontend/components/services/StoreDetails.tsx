import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Store } from "@/data/stores";

/** The address, hours and contact lines of one shop. */
export function StoreDetails({ store, className }: { store: Store; className?: string }) {
  return (
    <ul className={className} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
      <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <MapPin aria-hidden="true" size={16} strokeWidth={1.6} style={{ flex: "none", marginTop: 3 }} />
        <span>{store.address}</span>
      </li>
      {store.hours.map((h) => (
        <li key={h.days} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Clock aria-hidden="true" size={16} strokeWidth={1.6} style={{ flex: "none", marginTop: 3 }} />
          <span>
            {h.days} · {h.hours}
          </span>
        </li>
      ))}
      {store.phone && (
        <li style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Phone aria-hidden="true" size={16} strokeWidth={1.6} style={{ flex: "none" }} />
          <a href={`tel:${store.phone.replace(/\s+/g, "")}`} style={{ color: "inherit" }}>
            {store.phone}
          </a>
        </li>
      )}
      {store.email && (
        <li style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <Mail aria-hidden="true" size={16} strokeWidth={1.6} style={{ flex: "none" }} />
          <a href={`mailto:${store.email}`} style={{ color: "inherit", overflowWrap: "anywhere" }}>
            {store.email}
          </a>
        </li>
      )}
    </ul>
  );
}
