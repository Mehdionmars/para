"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { type Service, servicePriceLabel } from "@/data/services";

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_NAMES = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** One bookable day, as the CMS reports it: the calendar (open days, slots,
 * Casablanca time) and who already holds what are decided there, not here. */
type Day = { date: string; slots: { time: string; available: boolean }[] };

/** "2026-10-17" read as a calendar day, never shifted by the browser's zone. */
function parseDay(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateLabel(date: string): string {
  const d = parseDay(date);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

/** The first free slot of a day, keeping `current` when it is still free. */
function freeSlot(day: Day | undefined, current: string): string {
  const free = day?.slots.filter((s) => s.available) ?? [];
  return free.some((s) => s.time === current) ? current : (free[0]?.time ?? "");
}

export function ReservationView({ service }: { service: Omit<Service, "icon"> }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState<{ date: string; time: string } | null>(null);

  // Keeps the chosen day and slot when they are still free and otherwise
  // moves to the first free ones, so a refresh after "déjà pris" never
  // leaves a taken slot selected.
  const loadAvailability = useCallback(
    async (keepDate: string, keepSlot: string) => {
      try {
        const res = await fetch(`/api/bookings/availability?serviceId=${service.id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.days)) throw new Error(data.error || "");
        const next: Day[] = data.days;
        const hasFree = (d: Day) => d.slots.some((s) => s.available);
        const chosen = next.find((d) => d.date === keepDate && hasFree(d)) ?? next.find(hasFree) ?? next[0];
        setDays(next);
        setLoadError("");
        setDate(chosen?.date ?? "");
        setSlot(freeSlot(chosen, keepSlot));
      } catch {
        setLoadError("Impossible de charger les créneaux. Rechargez la page ou appelez-nous au 06 19 96 90 07.");
      }
    },
    [service.id],
  );

  useEffect(() => {
    // Fetched on mount, never at build time: availability changes by the minute.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAvailability("", "");
  }, [loadAvailability]);

  const day = days?.find((d) => d.date === date);

  function pickDate(next: Day) {
    setDate(next.date);
    setSlot(freeSlot(next, slot));
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !slot) {
      setSubmitError("Choisissez une date et un horaire disponibles.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        body: JSON.stringify({ date, email, name, note, phone, serviceId: service.id, time: slot }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone({ date, time: slot });
        return;
      }
      setSubmitError(data.error || "La réservation n'a pas pu être enregistrée. Réessayez.");
      // Someone took the slot first: show the calendar as it now stands.
      if (res.status === 409) await loadAvailability(date, slot);
    } catch {
      setSubmitError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(14px,3.4vw,32px)", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 14 }}>Demande envoyée</div>
        <h1 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(28px,4vw,42px)", margin: "0 0 18px" }}>Merci, {name.trim().split(" ")[0]}</h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.7, margin: "0 0 10px" }}>
          Votre demande de rendez-vous <strong>{service.title}</strong> le{" "}
          <strong>
            {formatDateLabel(done.date)} à {done.time}
          </strong>{" "}
          est bien enregistrée.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.7, margin: "0 0 30px" }}>
          Nous vous appelons au {phone} pour la confirmer. Le créneau vous est réservé en attendant.
        </p>
        <Link
          href="/services"
          className="btn-plum"
          style={{ display: "inline-block", padding: "14px 30px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}
        >
          Retour aux services
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px) clamp(8px,1.2vw,16px)" }}>
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

      {/* Layout lives in globals.css (.booking-form): the single/two-column
          switch and the summary's sticky behaviour have to agree, and an
          inline style cannot hold a media query. */}
      <form onSubmit={handleConfirm} className="booking-form">
        <div className="booking-form__steps">
          <div style={{ border: "1px solid rgba(94,64,116,.14)", borderRadius: 20, padding: 26 }}>
            <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 16 }}>1 · Choisir une date</div>
            {loadError && (
              <p role="alert" style={{ fontSize: 13, color: "#B3261E", margin: "0 0 12px" }}>
                {loadError}
              </p>
            )}
            {!days && !loadError && <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>Chargement des disponibilités…</p>}
            <div role="radiogroup" aria-label="Date du rendez-vous" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(days ?? []).map((d) => {
                const isActive = date === d.date;
                const full = !d.slots.some((s) => s.available);
                const cal = parseDay(d.date);
                return (
                  <button
                    key={d.date}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`${formatDateLabel(d.date)}${full ? ", complet" : ""}`}
                    disabled={full}
                    onClick={() => pickDate(d)}
                    style={{
                      width: 78,
                      padding: "12px 0",
                      borderRadius: 14,
                      textAlign: "center",
                      cursor: full ? "not-allowed" : "pointer",
                      background: isActive ? "var(--pdh-plum)" : "#fff",
                      color: isActive ? "var(--pdh-cream)" : "var(--pdh-ink)",
                      border: `1.5px solid ${isActive ? "var(--pdh-plum)" : "rgba(94,64,116,.2)"}`,
                      opacity: full ? 0.38 : 1,
                      transition: "all .2s",
                    }}
                  >
                    <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.7 }}>{DAY_NAMES[cal.getDay()]}</div>
                    <div style={{ fontFamily: "var(--font-alta)", fontSize: 22, marginTop: 2 }}>{cal.getDate()}</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>{full ? "complet" : MONTH_NAMES[cal.getMonth()]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ border: "1px solid rgba(94,64,116,.14)", borderRadius: 20, padding: 26 }}>
            <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pdh-plum)", marginBottom: 16 }}>2 · Choisir un horaire</div>
            <div role="radiogroup" aria-label="Horaire du rendez-vous" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(day?.slots ?? []).map(({ time: t, available }) => {
                const isTaken = !available;
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
              <Field label="Email (optionnel)" placeholder="vous@exemple.ma" value={email} onChange={setEmail} type="email" />
              <Field label="Précision (optionnel)" placeholder="Peau réactive, allergie…" value={note} onChange={setNote} />
            </div>
          </div>
        </div>

        <div className="booking-form__summary" style={{ border: "1px solid rgba(94,64,116,.14)", borderRadius: 20, padding: 26, background: "var(--pdh-sand)" }}>
          <div style={{ fontFamily: "var(--font-alta)", fontSize: 24, fontWeight: 300, marginBottom: 18 }}>Récapitulatif</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 18, borderBottom: "1px solid rgba(94,64,116,.14)" }}>
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
              <span>{date ? formatDateLabel(date) : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Horaire</span>
              <span>{slot || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Lieu</span>
              <span>Para d&apos;Hiver, Aïn Sebaâ</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0 20px" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Total</span>
            <span style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(22px,2.6vw,30px)", color: "var(--pdh-plum)", whiteSpace: "nowrap" }}>
              {servicePriceLabel(service as Service)}
            </span>
          </div>
          {submitError && (
            <p role="alert" style={{ fontSize: 13, color: "#B3261E", margin: "0 0 12px", lineHeight: 1.5 }}>
              {submitError}
            </p>
          )}
          <button
            type="submit"
            className="btn-plum"
            disabled={submitting || !slot}
            style={{
              width: "100%",
              textAlign: "center",
              padding: 16,
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              cursor: submitting || !slot ? "not-allowed" : "pointer",
              opacity: submitting || !slot ? 0.6 : 1,
            }}
          >
            {submitting ? "Envoi…" : "Demander ce rendez-vous"}
          </button>
          <div style={{ fontSize: 11.5, opacity: 0.55, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
            Nous vous appelons pour confirmer le rendez-vous.
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
