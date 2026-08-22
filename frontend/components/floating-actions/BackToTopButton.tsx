"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 400;

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fab-back-to-top"
      aria-label="Retour en haut"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.85)",
        pointerEvents: visible ? "auto" : "none",
        transitionProperty: "opacity, transform, box-shadow",
        transitionDuration: "0.25s",
        transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
      }}
    >
      <ArrowUp aria-hidden="true" size={20} strokeWidth={2} />
    </button>
  );
}
