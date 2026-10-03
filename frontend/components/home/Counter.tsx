import { STORES } from "@/data/stores";
import { WHATSAPP_PHONE } from "@/lib/contact";

/**
 * "Au comptoir" — the physical pharmacy, said plainly.
 *
 * Only facts the shop has actually published: address, phone, WhatsApp, email.
 * No opening hours (the store record says "à compléter"), no named staff, no
 * photographs of people, no reviews. If the address is still a placeholder the
 * block does not render at all.
 */
export function Counter() {
  const store = STORES[0];
  if (!store || !store.address || /compléter/i.test(store.address)) return null;

  const phoneDigits = store.phone.replace(/[^\d+]/g, "");
  const hasPhone = phoneDigits.length >= 8 && !/compléter/i.test(store.phone);
  const [street, ...rest] = store.address.split(",");
  const locality = rest.join(",").trim();

  return (
    <section aria-labelledby="counter-title" className="pdh-counter">
      <div className="pdh-counter-inner">
        <div className="pdh-counter-lead">
          <h2 className="sec-title" id="counter-title">
            Au comptoir, Aïn&nbsp;Sebaâ
          </h2>
          <p className="sec-deck">
            Une question avant de commander&nbsp;? Les pharmaciens répondent, au téléphone, sur WhatsApp ou sur place.
          </p>
        </div>

        <address className="pdh-counter-address">
          <span className="pdh-counter-street">{street}</span>
          {locality ? <span className="pdh-counter-locality">{locality}</span> : null}
        </address>

        <ul className="pdh-counter-actions">
          {hasPhone ? (
            <li>
              <a href={`tel:${phoneDigits}`}>
                <span className="pdh-counter-label">Appeler</span>
                <span className="pdh-counter-value">{store.phone}</span>
              </a>
            </li>
          ) : null}
          {WHATSAPP_PHONE ? (
            <li>
              <a href={`https://wa.me/${WHATSAPP_PHONE}`} rel="noopener noreferrer" target="_blank">
                <span className="pdh-counter-label">WhatsApp</span>
                <span className="pdh-counter-value">Écrire au comptoir</span>
              </a>
            </li>
          ) : null}
          {store.mapUrl ? (
            <li>
              <a href={store.mapUrl} rel="noopener noreferrer" target="_blank">
                <span className="pdh-counter-label">Itinéraire</span>
                <span className="pdh-counter-value">Ouvrir dans Maps</span>
              </a>
            </li>
          ) : null}
          {store.email ? (
            <li>
              <a href={`mailto:${store.email}`}>
                <span className="pdh-counter-label">Écrire</span>
                <span className="pdh-counter-value">{store.email}</span>
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
