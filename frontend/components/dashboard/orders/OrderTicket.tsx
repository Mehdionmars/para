"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";
import { orderItemVariantLabel } from "@/lib/dashboard/orders-types";
import type { Order } from "@/lib/dashboard/orders-types";

/**
 * Printable order ticket, sized for thermal receipt printers.
 *
 * Deliberately not a PDF: a thermal printer takes a plain HTML page through
 * the browser's own print pipeline, and generating a PDF would add a
 * dependency, a server round-trip and a download step for something the
 * browser already does. `window.print()` is the whole mechanism.
 *
 * Width comes from a CSS variable so 80mm (default), 58mm and A4 share one
 * layout instead of three near-identical components.
 */

function money(n: number) {
  // Thermal paper is narrow — no thousands separator, it wastes columns and
  // the amounts here never reach five figures.
  return `${Math.round(n)} MAD`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Paiement à la livraison",
  cmi: "Carte bancaire (CMI)",
};

export function OrderTicket({ order, autoPrint = false }: { order: Order; autoPrint?: boolean }) {
  // Opening the print view from the order page should land straight in the
  // print dialog — the operator's next action is always "print".
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [autoPrint]);

  // The discount line only appears when there is one: subtotal + shipping
  // that doesn't reach the total means something was taken off.
  const discount = Math.max(0, order.subtotal + (order.shipping || 0) - order.total);
  const paymentLabel =
    (order.paymentMethod && (PAYMENT_LABELS[order.paymentMethod.toLowerCase()] || order.paymentMethod)) ||
    "Paiement à la livraison";

  return (
    <>
      <div className="ticket-toolbar">
        <button type="button" onClick={() => window.print()} className="ticket-print-btn">
          <Printer className="h-4 w-4" />
          Imprimer le ticket
        </button>
        <label className="ticket-width-picker">
          Largeur
          <select
            defaultValue="80"
            onChange={(e) => {
              document.documentElement.style.setProperty("--ticket-width", `${e.target.value}mm`);
            }}
          >
            <option value="80">80 mm (thermique)</option>
            <option value="58">58 mm (thermique)</option>
            <option value="190">A4</option>
          </select>
        </label>
      </div>

      <div className="ticket">
        <header className="ticket-head">
          <div className="ticket-brand">PARA D&apos;HIVER</div>
          <div className="ticket-sub">Parapharmacie</div>
        </header>

        <hr className="ticket-rule" />

        <section className="ticket-meta">
          <div>
            <span>Commande</span>
            <strong>#{order.orderNumber}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{formatDate(order.createdAt)}</strong>
          </div>
        </section>

        <hr className="ticket-rule" />

        <section className="ticket-block">
          <div className="ticket-block-title">Client</div>
          <div>{order.customerName}</div>
          {order.customerPhone && <div>{order.customerPhone}</div>}
          {order.customerEmail && <div className="ticket-muted">{order.customerEmail}</div>}
        </section>

        {order.shippingAddress && (
          <section className="ticket-block">
            <div className="ticket-block-title">Livraison</div>
            {/* Address is a free-text area — preserve the operator's own line breaks. */}
            <div className="ticket-address">{order.shippingAddress}</div>
          </section>
        )}

        <hr className="ticket-rule" />

        <section className="ticket-block">
          <div className="ticket-block-title">Produits</div>
          <ul className="ticket-items">
            {order.items.map((item) => {
              const variantLabel = orderItemVariantLabel(item);
              return (
                <li key={item.id}>
                  <div className="ticket-item-name">{item.name}</div>
                  {/* The picker works from this slip, so it has to name the
                      exact option — a ticket saying only "Sunscreen Hydro"
                      cannot be filled when the product comes in two sizes. */}
                  {(variantLabel || item.sku) && (
                    <div className="ticket-item-variant">
                      {variantLabel}
                      {variantLabel && item.sku ? " · " : ""}
                      {item.sku ? `SKU ${item.sku}` : ""}
                    </div>
                  )}
                  <div className="ticket-item-line">
                    <span>
                      {item.quantity} x {money(item.price)}
                    </span>
                    <span>{money(item.price * item.quantity)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <hr className="ticket-rule" />

        <section className="ticket-totals">
          <div>
            <span>Sous-total</span>
            <span>{money(order.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div>
              <span>Réduction</span>
              <span>-{money(discount)}</span>
            </div>
          )}
          <div>
            <span>Livraison</span>
            <span>{order.shipping ? money(order.shipping) : "Offerte"}</span>
          </div>
          <div className="ticket-total">
            <span>TOTAL</span>
            <span>{money(order.total)}</span>
          </div>
        </section>

        <hr className="ticket-rule" />

        <section className="ticket-block">
          <div className="ticket-block-title">Mode de paiement</div>
          <div>{paymentLabel}</div>
        </section>

        <hr className="ticket-rule" />

        <footer className="ticket-foot">
          <div>Merci pour votre commande.</div>
          <div className="ticket-brand-small">PARA D&apos;HIVER</div>
        </footer>
      </div>
    </>
  );
}
