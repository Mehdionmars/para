/**
 * The shop's WhatsApp line.
 *
 * `NEXT_PUBLIC_WHATSAPP_PHONE` still overrides it, but it is not the only
 * source any more. A `NEXT_PUBLIC_` variable is inlined when the storefront is
 * *built*, and the Docker build never saw it: `.dockerignore` excludes every
 * `.env*` file from the build context and the Dockerfile passes no build
 * argument. The bundle shipped `wa.me/` with no number, so the floating button
 * — which hides itself rather than link nowhere — silently disappeared, along
 * with the WhatsApp card on /contact.
 *
 * The number is the shop's public contact line, printed on the site, so a
 * default in code is not a secret leaking; it is the value that survives a
 * build that forgot its environment.
 */
const DEFAULT_WHATSAPP = "0642076638";

/**
 * wa.me wants the international number, digits only: "06 42 07 66 38",
 * "+212 6 42 07 66 38" and "00212642076638" all become "212642076638".
 * Returns "" for anything that is not a plausible phone number.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `212${digits.slice(1)}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : "";
}

export const WHATSAPP_PHONE =
  toWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_PHONE) || toWhatsAppNumber(DEFAULT_WHATSAPP);
