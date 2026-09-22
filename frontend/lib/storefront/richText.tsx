import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Lexical rich text, rendered without pulling Payload into the storefront.
 *
 * The shop has no `payload` or `@payloadcms/*` dependency and talks to the CMS
 * over REST only — `fetchServices`, `fetchStores` and the rest all go through
 * `${CMS_URL}/api/...`. Importing `@payloadcms/richtext-lexical/react` just to
 * print a paragraph would drag the editor's React runtime into the storefront
 * bundle and make the two apps share a version they currently do not.
 *
 * So this walks the serialised tree instead. It covers what the editor can
 * actually produce in these documents — paragraphs, headings, lists, quotes,
 * links, line breaks and the four inline formats — and renders nothing for a
 * node type it does not know rather than throwing: an unrecognised block in a
 * CGV must not take the page down.
 *
 * Internal links go through next/link so they are client-side navigations and
 * are seen by Next's prefetcher; external ones get rel="noopener noreferrer".
 */

export type LexicalNode = {
  type?: string;
  tag?: string;
  text?: string;
  format?: number | string;
  listType?: string;
  fields?: { url?: string; newTab?: boolean; linkType?: string; doc?: unknown };
  children?: LexicalNode[];
};

export type LexicalRoot = { root?: { children?: LexicalNode[] } };

/** Lexical's inline format bitmask. */
const BOLD = 1;
const ITALIC = 1 << 1;
const STRIKETHROUGH = 1 << 2;
const UNDERLINE = 1 << 3;
const CODE = 1 << 4;

function renderText(node: LexicalNode, key: string): ReactNode {
  const text = node.text ?? "";
  if (!text) return null;

  const format = typeof node.format === "number" ? node.format : 0;
  let out: ReactNode = text;

  if (format & CODE) out = <code key={`${key}-c`}>{out}</code>;
  if (format & STRIKETHROUGH) out = <s key={`${key}-s`}>{out}</s>;
  if (format & UNDERLINE) out = <u key={`${key}-u`}>{out}</u>;
  if (format & ITALIC) out = <em key={`${key}-i`}>{out}</em>;
  if (format & BOLD) out = <strong key={`${key}-b`}>{out}</strong>;

  return <span key={key}>{out}</span>;
}

function renderChildren(nodes: LexicalNode[] | undefined, keyPrefix: string): ReactNode[] {
  return (nodes ?? []).map((child, i) => renderNode(child, `${keyPrefix}-${i}`)).filter(Boolean);
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);

    case "linebreak":
      return <br key={key} />;

    case "paragraph": {
      const children = renderChildren(node.children, key);
      // An empty paragraph is how an editor spaces things out in Lexical;
      // rendering <p></p> for it would collapse to nothing anyway, so it is
      // dropped rather than left as an invisible node in the markup.
      if (children.length === 0) return null;
      return (
        <p key={key} style={{ margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.8 }}>
          {children}
        </p>
      );
    }

    case "heading": {
      // The page itself owns the H1 and the section titles own the H2s, so a
      // heading typed inside a section body starts at H3. Demoting here keeps
      // the document outline valid no matter what the editor picked.
      const level = node.tag === "h1" || node.tag === "h2" ? "h3" : node.tag === "h3" ? "h3" : "h4";
      const Tag = level as "h3" | "h4";
      return (
        <Tag
          key={key}
          style={{
            fontFamily: "var(--font-alta)",
            fontWeight: 400,
            fontSize: level === "h3" ? 18 : 15.5,
            color: "var(--pdh-ink)",
            margin: "22px 0 10px",
          }}
        >
          {renderChildren(node.children, key)}
        </Tag>
      );
    }

    case "list": {
      const ordered = node.listType === "number";
      const Tag = ordered ? "ol" : "ul";
      return (
        <Tag key={key} style={{ margin: "0 0 14px", paddingInlineStart: 22, fontSize: 14.5, lineHeight: 1.8 }}>
          {renderChildren(node.children, key)}
        </Tag>
      );
    }

    case "listitem":
      return (
        <li key={key} style={{ margin: "0 0 6px" }}>
          {renderChildren(node.children, key)}
        </li>
      );

    case "quote":
      return (
        <blockquote
          key={key}
          style={{
            margin: "0 0 14px",
            paddingInlineStart: 16,
            borderInlineStart: "2px solid var(--pdh-plum-border)",
            fontSize: 14.5,
            lineHeight: 1.8,
            opacity: 0.85,
          }}
        >
          {renderChildren(node.children, key)}
        </blockquote>
      );

    case "link": {
      const url = node.fields?.url ?? "";
      const children = renderChildren(node.children, key);
      if (!url) return <span key={key}>{children}</span>;

      const external = /^https?:\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:");
      if (external) {
        return (
          <a
            key={key}
            className="link-hover"
            href={url}
            rel="noopener noreferrer"
            style={{ color: "var(--pdh-plum)", textDecoration: "underline" }}
            target={node.fields?.newTab ? "_blank" : undefined}
          >
            {children}
          </a>
        );
      }
      return (
        <Link key={key} className="link-hover" href={url} style={{ color: "var(--pdh-plum)", textDecoration: "underline" }}>
          {children}
        </Link>
      );
    }

    default:
      // Unknown node: render its children if it has any, so a wrapper type
      // this function has never heard of does not silently swallow the text
      // inside it.
      return node.children ? <span key={key}>{renderChildren(node.children, key)}</span> : null;
  }
}

/** True when the document has no renderable text — an untouched editor. */
export function isRichTextEmpty(value: LexicalRoot | null | undefined): boolean {
  const children = value?.root?.children;
  if (!children || children.length === 0) return true;
  return plainText(value).trim().length === 0;
}

/** The document as plain text — used for meta descriptions and excerpts. */
export function plainText(value: LexicalRoot | null | undefined): string {
  const out: string[] = [];
  const walk = (nodes: LexicalNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === "text" && node.text) out.push(node.text);
      if (node.children) walk(node.children);
    }
  };
  walk(value?.root?.children);
  return out.join(" ").replace(/\s+/g, " ").trim();
}

export function RichText({ value }: { value: LexicalRoot | null | undefined }) {
  const children = value?.root?.children;
  if (!children?.length) return null;
  return <>{renderChildren(children, "rt")}</>;
}
