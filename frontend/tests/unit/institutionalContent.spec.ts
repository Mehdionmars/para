import { describe, expect, it } from "vitest";

import { sectionAnchor } from "@/components/institutional/InstitutionalDocument";
import { isRichTextEmpty, plainText, type LexicalRoot } from "@/lib/storefront/richText";

/**
 * The two decisions that keep an unwritten legal page honest.
 *
 * `isRichTextEmpty`/`plainText` are what `isPageEmpty` and the FAQ's
 * structured data rest on: a page with an untouched editor must read as
 * empty, so the route sets noindex and the sitemap leaves it out. A document
 * that looked non-empty because it carried one blank paragraph would be
 * indexed as a published CGV containing nothing.
 *
 * `sectionAnchor` is the #link a table of contents points at. It has to
 * survive the accents and numbering a French legal document is full of.
 */

function doc(...texts: string[]): LexicalRoot {
  return {
    root: {
      children: texts.map((text) => ({
        type: "paragraph",
        children: [{ type: "text", text }],
      })),
    },
  };
}

describe("sectionAnchor", () => {
  it("strips accents, punctuation and numbering", () => {
    expect(sectionAnchor("1. Objet du contrat")).toBe("1-objet-du-contrat");
    expect(sectionAnchor("Données personnelles")).toBe("donnees-personnelles");
    expect(sectionAnchor("Responsabilité & garanties")).toBe("responsabilite-garanties");
  });

  it("leaves no leading or trailing dash", () => {
    expect(sectionAnchor("— Livraison —")).toBe("livraison");
    expect(sectionAnchor("Prix ?")).toBe("prix");
  });

  it("keeps distinct headings distinct", () => {
    expect(sectionAnchor("Article 3")).not.toBe(sectionAnchor("Article 4"));
  });
});

describe("plainText", () => {
  it("flattens nested nodes into one readable string", () => {
    const value: LexicalRoot = {
      root: {
        children: [
          {
            type: "paragraph",
            children: [
              { type: "text", text: "Livraison offerte" },
              { type: "link", fields: { url: "/livraison" }, children: [{ type: "text", text: "voir les tarifs" }] },
            ],
          },
        ],
      },
    };
    expect(plainText(value)).toBe("Livraison offerte voir les tarifs");
  });

  it("collapses whitespace so a meta description is not ragged", () => {
    expect(plainText(doc("  Para   d'Hiver  "))).toBe("Para d'Hiver");
  });
});

describe("isRichTextEmpty", () => {
  it("treats a missing or untouched document as empty", () => {
    expect(isRichTextEmpty(null)).toBe(true);
    expect(isRichTextEmpty(undefined)).toBe(true);
    expect(isRichTextEmpty({ root: { children: [] } })).toBe(true);
  });

  it("treats a document of blank paragraphs as empty", () => {
    // What an editor leaves behind after opening the field and pressing
    // enter a few times. Counting it as content would publish — and index —
    // a legal page with nothing in it.
    expect(isRichTextEmpty(doc("", "   ", ""))).toBe(true);
  });

  it("is not empty once a single word is written", () => {
    expect(isRichTextEmpty(doc("", "Objet"))).toBe(false);
  });
});
