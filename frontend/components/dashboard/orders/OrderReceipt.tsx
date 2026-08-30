"use client";

import Image from "next/image";
import { Printer } from "lucide-react";
import { useEffect } from "react";
import { paymentMethodLabel, orderItemVariantLabel } from "@/lib/dashboard/orders-types";
import type { Order } from "@/lib/dashboard/orders-types";
import { Button } from "@/components/dashboard/ui/Button";

/**
 * A branded receipt / invoice for a customer.
 *
 * Distinct from OrderTicket, which is the 58-80mm thermal ticket the counter
 * prints: that one is monochrome, column-starved and deliberately has no
 * logo. This is the A4 document a customer keeps — it can afford a logo,
 * whitespace and thousands separators, and it is read on screen at least as
 * often as it is printed.
 *
 * Both read the same `Order` and the same `orderItemVariantLabel`, so a line
 * cannot describe itself differently on the ticket and on the invoice.
 */

/** An invoice is not thermal paper: it has room for a separator. */
function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function OrderReceipt({
  order,
  logoSrc,
  autoPrint = false,
}: {
  order: Order;
  /** The storefront logo, passed in from the server so the CMS stays the
   * source of truth. Falls back to the bundled asset. */
  logoSrc?: string;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [autoPrint]);

  const discount = Math.max(0, order.subtotal + (order.shipping || 0) - order.total);
  const paymentLabel =
    (order.paymentMethod ? paymentMethodLabel(order.paymentMethod) : null) ||
    "Paiement à la livraison";

  return (
    <div className="receipt-scope">
      {/* Screen-only: an action bar has no business on the printed page. */}
      <div className="receipt-toolbar print:hidden">
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimer le reçu
        </Button>
      </div>

      <article className="receipt" aria-label={`Reçu de la commande ${order.orderNumber}`}>
        <header className="receipt-head">
          <div className="receipt-brand">
            <Image
              src={logoSrc || "/assets/logo.png"}
              alt="Para d'Hiver"
              width={48}
              height={48}
              className="receipt-logo"
              // Optimised, not raw: the CMS logo is a 7465px PNG and this
              // renders it at 48px. res.cloudinary.com is already an allowed
              // remote host in next.config.ts.
              sizes="48px"
            />
            <div>
              <p className="receipt-wordmark">PARA D&apos;HIVER</p>
              <p className="receipt-tagline">Parapharmacie · Casablanca, Maroc</p>
            </div>
          </div>

          <dl className="receipt-meta">
            <div>
              <dt>Reçu</dt>
              <dd className="receipt-meta-strong">{order.orderNumber}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt>Paiement</dt>
              <dd>{paymentLabel}</dd>
            </div>
          </dl>
        </header>

        <section className="receipt-party" aria-label="Client">
          <h2 className="receipt-section-title">Facturé à</h2>
          <p className="receipt-party-name">{order.customerName}</p>
          {order.customerEmail && <p>{order.customerEmail}</p>}
          {order.customerPhone && <p>{order.customerPhone}</p>}
          {order.shippingAddress && <p className="receipt-address">{order.shippingAddress}</p>}
        </section>

        <table className="receipt-table">
          <caption className="sr-only">Articles de la commande {order.orderNumber}</caption>
          <thead>
            <tr>
              <th scope="col">Article</th>
              <th scope="col" className="receipt-num">Qté</th>
              <th scope="col" className="receipt-num">P.U.</th>
              <th scope="col" className="receipt-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const variant = orderItemVariantLabel(item);
              return (
                <tr key={`${item.name}-${i}`}>
                  <td>
                    <span className="receipt-item-name">{item.name}</span>
                    {variant && <span className="receipt-item-variant">{variant}</span>}
                  </td>
                  {/* Repeating the header on each cell is what lets a phone
                      stack the row and still say which number is which. */}
                  <td className="receipt-num" data-label="Qté">{item.quantity}</td>
                  <td className="receipt-num" data-label="P.U.">{money(item.price)}</td>
                  <td className="receipt-num" data-label="Total">{money(item.price * item.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="receipt-totals">
          <dl>
            <div>
              <dt>Sous-total</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="receipt-discount">
                <dt>Remise{order.couponCode ? ` · ${order.couponCode}` : ""}</dt>
                <dd>−{money(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Livraison</dt>
              <dd>{order.shipping ? money(order.shipping) : "Offerte"}</dd>
            </div>
            <div className="receipt-total-row">
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
        </div>

        {order.notes && (
          <section className="receipt-notes" aria-label="Note">
            <h2 className="receipt-section-title">Note</h2>
            <p>{order.notes}</p>
          </section>
        )}

        <footer className="receipt-foot">
          <p>Merci de votre confiance.</p>
          <p className="receipt-foot-fine">
            Produits authentiques du circuit pharmaceutique · Conseil pharmacien · paradhiver@gmail.com
          </p>
        </footer>
      </article>
    </div>
  );
}
