import { linePriceLabel, type ServicePrice } from "@/data/services";

/**
 * One service's tariff, laid out like the institute's printed price list:
 * the prestation on the left, its price on the right, a dotted leader between
 * them so the eye can follow a long line across. Styles in globals.css
 * (.price-list*).
 */
export function PriceList({ prices }: { prices: ServicePrice[] }) {
  if (prices.length === 0) return null;

  return (
    <ul className="price-list">
      {prices.map((line) => (
        <li key={line.label} className="price-list-line">
          <span className="price-list-label">{line.label}</span>
          <span aria-hidden="true" className="price-list-leader" />
          <span className="price-list-price">{linePriceLabel(line)}</span>
        </li>
      ))}
    </ul>
  );
}
