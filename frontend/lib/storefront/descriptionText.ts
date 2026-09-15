/**
 * A product description as it should be displayed: its line breaks kept,
 * except the ones that were never meant to be there.
 *
 * Descriptions are written in sections — "Indications :", "Conseils
 * d'utilisation :", one benefit per line — and the product page renders them
 * with `white-space: pre-line` so those sections survive. But some were pasted
 * from a PDF or a supplier sheet that hard-wrapped every ~50 characters, so the
 * break lands mid-sentence: "gel à base d'un⏎complexe spécifique". Shown as
 * is, those read as a broken poem.
 *
 * A break is a hard wrap when the line before it does not end a sentence or
 * introduce a list (no . : ! ? ; …) and the line after it starts in lower case
 * — a new section, item or sentence starts with a capital, a digit or a
 * bullet. On the live catalogue (September 2026) this joins 72 breaks in 26
 * products and keeps all 973 structural ones; none of the joined lines is a
 * short list-like fragment.
 */

const ENDS_A_UNIT = /[.:!?;…]$/;
const CONTINUES_A_SENTENCE = /^[a-zà-öø-ÿœ’'(]/;

export function reflowDescription(raw: string | null | undefined): string {
  if (!raw) return "";
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const current = line.trimEnd();
    const previous = out.length ? out[out.length - 1] : undefined;
    const next = current.trimStart();
    if (previous && next && !ENDS_A_UNIT.test(previous) && CONTINUES_A_SENTENCE.test(next)) {
      out[out.length - 1] = `${previous} ${next}`;
    } else {
      out.push(current);
    }
  }

  return out.join("\n").trim();
}
