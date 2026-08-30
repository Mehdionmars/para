"use client";

import { Loader2, PackageSearch } from "lucide-react";
import { useState } from "react";
import { usePersistedFields } from "@/lib/usePersistedFields";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/dashboard/orders-types";

type TrackedOrder = {
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  createdAt: string;
  items: { name: string; price: number; quantity: number; variantLabel?: string | null; variantType?: string | null; sku?: string | null }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  timeline: { status: OrderStatus; at: string }[];
};

const money = (n: number) => `${new Intl.NumberFormat("fr-MA").format(Math.round(n))} MAD`;

export function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Both fields, remembered across a reload: this page is checked repeatedly
  // over the days a parcel takes to arrive, and retyping an order number from
  // an email each time is the whole friction. The pair is also what authorises
  // the lookup, so it is left in place only until the shopper clears it — see
  // the note in usePersistedFields about shared machines.
  usePersistedFields("pdh-tracking-v1", { orderNumber, email }, (saved) => {
    if (saved.orderNumber) setOrderNumber(saved.orderNumber);
    if (saved.email) setEmail(saved.email);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch("/api/orders/track", {
        body: JSON.stringify({ email, orderNumber }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Commande introuvable.");
        return;
      }
      setOrder(data);
    } catch {
      setError("Impossible de contacter le service. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "clamp(24px,3vw,36px)" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          border: "1px solid rgba(94,64,116,.12)",
          borderRadius: 18,
          padding: "clamp(20px,2.6vw,28px)",
        }}
      >
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div>
            <label htmlFor="track-number" style={labelStyle}>
              Numéro de commande
            </label>
            <input
              id="track-number"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="PDH-260819-XXXX"
              autoComplete="off"
              style={{ ...inputStyle, textTransform: "uppercase" }}
            />
          </div>
          <div>
            <label htmlFor="track-email" style={labelStyle}>
              Email de la commande
            </label>
            <input
              id="track-email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.ma"
              autoComplete="email"
              style={inputStyle}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-plum"
          style={{
            marginTop: 16,
            width: "100%",
            maxWidth: 260,
            padding: 15,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            cursor: loading ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          Suivre ma commande
        </button>

        {error && (
          <p role="alert" style={{ marginTop: 12, fontSize: 13, color: "var(--pdh-error)" }}>
            {error}
          </p>
        )}
      </form>

      {order && (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(94,64,116,.12)",
            borderRadius: 18,
            padding: "clamp(20px,2.6vw,28px)",
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          }}
        >
          <div>
            <p style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.5 }}>
              Commande {order.orderNumber}
            </p>
            <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 300, fontSize: 26, margin: "6px 0 4px" }}>
              {ORDER_STATUS_LABELS[order.status]}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.65, margin: 0 }}>
              Passée le {new Date(order.createdAt).toLocaleDateString("fr-FR")} · {order.customerName}
            </p>

            <div style={{ marginTop: 22 }}>
              <OrderTimeline status={order.status} entries={order.timeline} />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 12px" }}>
              Détail
            </h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {order.items.map((item, i) => (
                <li key={`${item.name}-${item.variantLabel ?? ""}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5 }}>
                  <span style={{ minWidth: 0 }}>
                    {item.name} <span style={{ color: "var(--pdh-muted-text)" }}>× {item.quantity}</span>
                    {/* Without this, two sizes of one product read as the
                        same line twice on the customer's own order. */}
                    {!!item.variantLabel && (
                      <span style={{ color: "var(--pdh-muted-text)", display: "block", fontSize: 12, marginTop: 2 }}>
                        {item.variantType ? `${item.variantType} : ` : ""}
                        {item.variantLabel}
                        {item.sku ? ` · SKU ${item.sku}` : ""}
                      </span>
                    )}
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>{money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(94,64,116,.12)", display: "grid", gap: 6, fontSize: 13 }}>
              <Row label="Sous-total" value={money(order.subtotal)} />
              {order.discount > 0 && <Row label="Réduction" value={`−${money(order.discount)}`} accent="var(--pdh-success)" />}
              <Row label="Livraison" value={order.shipping ? money(order.shipping) : "Offerte"} />
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, fontSize: 16, fontWeight: 600 }}>
                <span>Total</span>
                <span style={{ color: "var(--pdh-plum)" }}>{money(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!order && !error && (
        <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.6, margin: 0 }}>
          <PackageSearch size={16} aria-hidden="true" />
          Le numéro de commande figure dans l&apos;email de confirmation.
        </p>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: accent, opacity: accent ? 1 : 0.7 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  opacity: 0.55,
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(94,64,116,.22)",
  fontSize: 13.5,
  background: "#fff",
};
