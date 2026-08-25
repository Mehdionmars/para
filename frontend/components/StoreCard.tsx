import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import type { Store, StoreHours } from "@/data/stores";

function formatHoursLabel(hour: StoreHours): string {
  if (!hour.hours || hour.hours === "—") return hour.days;
  return `${hour.days} · ${hour.hours}`;
}

function isMissingHours(hour: StoreHours): boolean {
  return !hour.hours || hour.hours === "—" || /à compléter/i.test(hour.days);
}

export function StoreCard({ store }: { store: Store }) {
  return (
    <article className="store-card">
      <div className="store-card-head">
        <div>
          <h3 className="store-card-title">{store.name}</h3>
          <p className="store-card-subtitle">Boutique Para d&apos;Hiver</p>
        </div>
      </div>

      <div className="store-card-lines">
        <a className="store-card-line store-card-line--action" href={store.mapUrl} target="_blank" rel="noopener noreferrer">
          <span className="store-card-icon" aria-hidden="true">
            <MapPin size={22} strokeWidth={1.8} />
          </span>
          <span className="store-card-text">{store.address}</span>
        </a>

        {store.hours.map((h) => (
          <div className="store-card-line" key={`${h.days}-${h.hours}`}>
            <span className="store-card-icon" aria-hidden="true">
              <Clock size={22} strokeWidth={1.8} />
            </span>
            <span className={isMissingHours(h) ? "store-card-text store-card-text--muted" : "store-card-text"}>
              {isMissingHours(h) ? "Horaires d'ouverture bientôt disponibles" : formatHoursLabel(h)}
            </span>
          </div>
        ))}

        {store.phone && (
          <a className="store-card-line store-card-line--action" href={`tel:${store.phone.replace(/\s+/g, "")}`}>
            <span className="store-card-icon" aria-hidden="true">
              <Phone size={22} strokeWidth={1.8} />
            </span>
            <span className="store-card-text">{store.phone}</span>
          </a>
        )}

        {store.email && (
          <a className="store-card-line store-card-line--action" href={`mailto:${store.email}`}>
            <span className="store-card-icon" aria-hidden="true">
              <Mail size={22} strokeWidth={1.8} />
            </span>
            <span className="store-card-text">{store.email}</span>
          </a>
        )}
      </div>

      <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-plum store-card-cta">
        <Navigation aria-hidden="true" size={17} strokeWidth={1.8} />
        Itinéraire
      </a>
    </article>
  );
}
