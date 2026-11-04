import type { Metadata } from "next";
import Link from "next/link";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import { Snowflakes } from "@/components/Snowflakes";
import { PriceList } from "@/components/services/PriceList";
import { ServiceRail } from "@/components/services/ServiceRail";
import { StoreDetails } from "@/components/services/StoreDetails";
import { servicePriceLabel } from "@/data/services";
import { fetchServices } from "@/lib/storefront/services";
import { fetchStores } from "@/lib/storefront/stores";
import s from "./services.module.css";

export const metadata: Metadata = {
  title: "Services — Para d'Hiver",
};

export default async function ServicesPage() {
  const [SERVICES, STORES] = await Promise.all([fetchServices(), fetchStores()]);
  return (
    <>
      <div className={s.dark}>
        <Snowflakes opacity={0.22} />
        <nav aria-label="Fil d'Ariane" className={s.crumbs}>
          <Link href="/">Accueil</Link> / Services
        </nav>
        <header className={s.head}>
          <h1 className={s.title}>L&apos;institut</h1>
          <p className={s.lead}>Coiffure, soins du visage, ongles, regard, maquillage et épilation, par nos coiffeuses et esthéticiennes.</p>
        </header>

        <ServiceRail className={s.rail} controlsClassName={s.railControls} buttonClassName={s.railButton}>
          {SERVICES.map((service) => (
            <li key={service.id} className={s.cardItem}>
              <Link href={`/services/${service.id}`} className={s.card} style={{ background: service.bg }}>
                <CloudinaryImage preset="editorial" src={service.img} alt="" fill sizes="(max-width: 560px) 78vw, 300px" style={{ objectFit: "cover" }} />
                <span className={s.cardShade} />
                <span className={s.cardBody}>
                  <span className={s.cardTitle}>{service.title}</span>
                  <span className={s.cardRow}>
                    <span>{servicePriceLabel(service)}</span>
                    <span className={s.cardDuration}>{service.duration}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ServiceRail>

        {/* The whole tariff in one place, as on the printed price list: a
            visitor comparing two prestations should not have to open a page
            per family. */}
        <section id="tarifs" aria-labelledby="tarifs-title" className={s.tariffs}>
          <h2 id="tarifs-title" className={s.h2}>
            Tarifs
          </h2>
          <p className={s.note}>En dirhams, TTC. Un tarif « dès » est confirmé avant de commencer.</p>
          <div className={s.grid}>
            {SERVICES.filter((x) => x.prices.length > 0).map((service) => (
              <section key={service.id} aria-labelledby={`tarifs-${service.id}`} className={s.group}>
                <h3 id={`tarifs-${service.id}`} className={s.groupTitle}>
                  {service.title}
                </h3>
                <PriceList prices={service.prices} />
                <Link href={`/services/${service.id}/reserver`} className={s.groupBook}>
                  Réserver <span className="sr-only">{service.title}</span> →
                </Link>
              </section>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="stores-title" className={s.stores}>
        <div className={s.storesInner}>
          <h2 id="stores-title" className={s.storesTitle}>
            Nos magasins
          </h2>
          <div className={s.storesGrid}>
            {STORES.map((store) => (
              <div key={store.name} className={s.store}>
                <h3 className={s.storeName}>{store.name}</h3>
                <StoreDetails store={store} className={s.storeLines} />
                <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className={`btn-plum ${s.storeMap}`}>
                  Itinéraire
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
