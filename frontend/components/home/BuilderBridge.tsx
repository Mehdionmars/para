"use client";

import { useEffect } from "react";

/**
 * Makes the homepage editable from inside the Storefront Builder's preview.
 *
 * Rendered only in Draft Mode, and inert unless the page sits in a frame: the
 * builder's iframe. Every CMS section is wrapped in `[data-builder-key]` by the
 * page; this script draws a hover outline over them, and a click selects the
 * block instead of following its links. The selected block gets a small
 * toolbar (move up, move down, hide, delete). Nothing is changed here: each
 * action is posted to the builder, which edits its draft exactly as the list
 * on the left would — so undo, autosave and publish all behave as usual.
 *
 * Messages, both ways, are same-origin only:
 *   frame -> builder  { type: "builder:select", key }
 *                     { type: "builder:action", key, action: "up" | "down" | "hide" | "delete" }
 *   builder -> frame  { type: "builder:selected", key, label, canDelete }
 */

type Action = "up" | "down" | "hide" | "delete";

const ACCENT = "#7c3aed";

export function BuilderBridge() {
  useEffect(() => {
    if (window.parent === window) return;

    const post = (message: Record<string, unknown>) => window.parent.postMessage(message, window.location.origin);

    const hoverBox = document.createElement("div");
    const selectBox = document.createElement("div");
    const toolbar = document.createElement("div");
    for (const box of [hoverBox, selectBox]) {
      Object.assign(box.style, {
        position: "fixed",
        pointerEvents: "none",
        zIndex: "2147483000",
        borderRadius: "6px",
        display: "none",
      });
    }
    hoverBox.style.outline = `2px dashed ${ACCENT}80`;
    selectBox.style.outline = `2px solid ${ACCENT}`;
    Object.assign(toolbar.style, {
      position: "fixed",
      zIndex: "2147483001",
      display: "none",
      alignItems: "center",
      gap: "2px",
      padding: "3px",
      borderRadius: "8px",
      background: ACCENT,
      color: "#fff",
      font: "500 12px/1 system-ui, sans-serif",
      boxShadow: "0 4px 14px rgba(0,0,0,.18)",
    });
    toolbar.dataset.builderToolbar = "";
    document.body.append(hoverBox, selectBox, toolbar);

    let hovered: HTMLElement | null = null;
    let selectedKey: string | null = null;

    const elementFor = (key: string | null) =>
      key ? document.querySelector<HTMLElement>(`[data-builder-key="${CSS.escape(key)}"]`) : null;

    function place(box: HTMLElement, el: HTMLElement | null) {
      const rect = el?.getBoundingClientRect();
      if (!el || !rect || rect.height === 0) {
        box.style.display = "none";
        return null;
      }
      Object.assign(box.style, {
        display: "block",
        top: `${rect.top + 2}px`,
        left: `${rect.left + 2}px`,
        width: `${rect.width - 4}px`,
        height: `${rect.height - 4}px`,
      });
      return rect;
    }

    function layout() {
      place(hoverBox, hovered && hovered.dataset.builderKey !== selectedKey ? hovered : null);
      const rect = place(selectBox, elementFor(selectedKey));
      if (!rect) {
        toolbar.style.display = "none";
        return;
      }
      toolbar.style.display = "flex";
      toolbar.style.top = `${Math.max(8, rect.top + 8)}px`;
      toolbar.style.left = `${Math.max(8, rect.right - toolbar.offsetWidth - 10)}px`;
    }

    function button(label: string, title: string, action: Action) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.title = title;
      b.setAttribute("aria-label", title);
      Object.assign(b.style, {
        all: "unset",
        cursor: "pointer",
        padding: "6px 9px",
        borderRadius: "5px",
      });
      b.addEventListener("mouseenter", () => (b.style.background = "rgba(255,255,255,.18)"));
      b.addEventListener("mouseleave", () => (b.style.background = "transparent"));
      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedKey) post({ type: "builder:action", key: selectedKey, action });
      });
      return b;
    }

    function renderToolbar(label: string, canDelete: boolean) {
      const name = document.createElement("span");
      name.textContent = label;
      Object.assign(name.style, { padding: "0 8px 0 6px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
      toolbar.replaceChildren(
        name,
        button("↑", "Monter", "up"),
        button("↓", "Descendre", "down"),
        button("Masquer", "Masquer ce bloc", "hide"),
        ...(canDelete ? [button("Supprimer", "Supprimer ce bloc", "delete")] : []),
      );
    }

    const sectionFrom = (target: EventTarget | null) =>
      target instanceof Element && !target.closest("[data-builder-toolbar]")
        ? target.closest<HTMLElement>("[data-builder-key]")
        : null;

    function onMove(e: MouseEvent) {
      const next = sectionFrom(e.target);
      if (next !== hovered) {
        hovered = next;
        layout();
      }
    }

    // Capture phase: a click on a block selects it, and never reaches the
    // links, carousels and add-to-cart buttons inside it.
    function onClick(e: MouseEvent) {
      const section = sectionFrom(e.target);
      if (!section) return;
      e.preventDefault();
      e.stopPropagation();
      post({ type: "builder:select", key: section.dataset.builderKey });
    }

    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const data = e.data as { type?: string; key?: string | null; label?: string; canDelete?: boolean };
      if (data?.type !== "builder:selected") return;
      const changed = data.key !== selectedKey;
      selectedKey = data.key ?? null;
      renderToolbar(data.label || "", Boolean(data.canDelete));
      layout();
      const el = elementFor(selectedKey);
      if (changed && el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    let frame = 0;
    const relayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", relayout, { passive: true });
    window.addEventListener("resize", relayout);
    post({ type: "builder:ready" });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", relayout);
      window.removeEventListener("resize", relayout);
      hoverBox.remove();
      selectBox.remove();
      toolbar.remove();
    };
  }, []);

  return null;
}
