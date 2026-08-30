"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/context/toast-context";
import { Baby, Droplet, Feather, Palette, ScanFace, Scissors, type LucideIcon } from "lucide-react";
import { type Service, servicePriceLabel } from "@/data/services";

/**
 * The icon arrives as a name, not as a component.
 *
 * `Service.icon` is a React function component, and a server component cannot
 * hand a function to a client one — this page answered 500 on every visit
 * ("Functions cannot be passed directly to Client Components"), on the
 * committed code as well. A name crosses that boundary fine and is resolved
 * back into a component here.
 */
const ICONS: Record<string, LucideIcon> = { Baby, Droplet, Feather, Palette, ScanFace, Scissors };

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_NAMES = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const TIME_SLOTS = ["09:30", "10:00", "11:00", "12:00", "14:00", "15:30", "16:30", "17:30"];
const TAKEN_SLOTS = new Set(["10:00", "15:30"]);

function buildUpcomingDates(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDateLabel(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function ReservationView({ service, iconName }: { service: Omit<Service, "icon">; iconName?: string }) {
  const Icon = (iconName && ICONS[iconName]) || Feather;
  const router = useRouter();
  const toast = useToast();
  const dates = buildUpcomingDates(7);

  const [dateIndex, setDateIndex] = useState(0);
  const [slot, setSlot] = useState("11:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    toast.fire(`Réservation confirmée — ${service.title} le ${formatDateLabel(dates[dateIndex])} à ${slot}`);
    router.push("/services");
  }

  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 11.5, letterSpacing: ".1em", opacity: 0.55, marginBottom: 20 }}>
        <Link href="/services" className="link-hover" style={{ color: "inherit" }}>
          Services
        </Link>{" "}
        /{" "}
        <Link href={`/services/${service.id}`} className="link-hover" style={{ color: "inherit" }}>
          {service.title}
        </Link>{" "}
        / Réservation
      </nav>
      <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(28px,4vw,46px)", margin: "0 0 28px" }}>Réserver un créneau</h1>

      <form onSubmit={handleConfirm} style={{ display: "flex", flexWrap: "wrap-reverse", gap: "clamp(18px,2.4vw,34px)", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, flex: "2 1 480px" }}>
          <div style={{ border: "1px solid rgba(94,64,116,.14)", borderRadius: 20, padding: 26 }}>
            <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 16 }}>1 · Choisir une date</div>
            <div role="radiogroup" aria-label="Date du rendez-vous" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {dates.map((d, i) => {
                const isActive = dateIndex === i;
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setDateIndex(i)}
                    style={{
                      width: 78,
                      padding: "12px 0",
                      borderRadius: 14,
                      textAlign: "center",
                      cursor: "pointer",
                      background: isActive ? "var(--pdh-plum)" : "#fff",
                      color: isActive ? "var(--pdh-cream)" : "var(--pdh-ink)",
                      border: `1.5px solid ${isActive ? "var(--pdh-plum)" : "rgba(94,64,116,.2)"}`,
                      transition: "all .2s",
                    }}
                  >
                    <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.7 }}>{DAY_NAMES[d.getDay()]}</div>
                    <div style={{ fontFamily: "var(--font-alta)", fontSize: 22, marginTop: 2 }}>{d.getDate()}</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>{MONTH_NAMES[d.getMonth()]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ border: "1px solid rgba(94,64,116,.14)", borderRadius: 20, padding: 26 }}>
            <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 16 }}>2 · Choisir un horaire</div>
            <div role="radiogroup" aria-label="Horaire du rendez-vous" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {TIME_SLOTS.map((t) => {
                const isTaken = TAKEN_SLOTS.has(t);
                const isActive = slot === t && !isTaken;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-disabled={isTaken}
                    disabled={isTaken}
                    onClick={() => setSlot(t)}
                    style={{
                      padding: "11px 20px",
                      borderRadius: 999,
                      fontSize: 13,
                      cursor: isTaken ? "not-allowed" : "pointer",
                      background: isActive ? "var(--pdh-plum)" : "#fff",
                      color: isActive ? "var(--pdh-cream)" : "var(--pdh-ink)",
                      border: `1.5px solid ${isActive ? "var(--pdh-plum)" : "rgba(94,64,116,.2)"}`,
                      opacity: isTaken ? 0.38 : 1,
                      transition: "all .2s",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ border: "1px solid rgba(94,64,116,.14)", borderRadius: 20, padding: 26 }}>
            <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 16 }}>3 · Vos coordonnées</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 14 }}>
              <Field label="Nom complet" placeholder="Sarah Benkirane" value={name} onChange={setName} required />
              <Field label="Téléphone" placeholder="06 12 34 56 78" value={phone} onChange={setPhone} type="tel" required />
              <Field label="Email" placeholder="vous@exemple.ma" value={email} onChange={setEmail} type="email" required />
              <Field label="Précision (optionnel)" placeholder="Peau réactive, allergie…" value={note} onChange={setNote} />
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid rgba(94,64,116,.14)", borderRadius: 20, padding: 26, position: "sticky", top: 150, background: "var(--pdh-sand)", flex: "1 1 300px" }}>
          <div style={{ fontFamily: "var(--font-alta)", fontSize: 24, fontWeight: 300, marginBottom: 18 }}>Récapitulatif</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 18, borderBottom: "1px solid rgba(94,64,116,.14)" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: service.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pdh-plum)", flex: "none" }}>
              <Icon aria-hidden="true" size={26} strokeWidth={1.4} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{service.title}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                {service.duration} · {service.expert}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "18px 0", borderBottom: "1px solid rgba(94,64,116,.14)", fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Date</span>
              <span>{formatDateLabel(dates[dateIndex])}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Horaire</span>
              <span>{slot}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Lieu</span>
              <span>Institut Maarif, Casablanca</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0 20px" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Total</span>
            <span style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(22px,2.6vw,30px)", color: "var(--pdh-plum)", whiteSpace: "nowrap" }}>
              {servicePriceLabel(service as Service)}
            </span>
          </div>
          <button
            type="submit"
            className="btn-plum"
            style={{ width: "100%", textAlign: "center", padding: 16, borderRadius: 999, fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Confirmer la réservation
          </button>
          <div style={{ fontSize: 11.5, opacity: 0.55, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
            Annulation gratuite jusqu&apos;à 24h avant le rendez-vous.
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = `field-${label}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 11.5, opacity: 0.6 }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
        style={{ height: 46, borderRadius: 12, padding: "0 16px", fontSize: 13.5 }}
      />
    </div>
  );
}
