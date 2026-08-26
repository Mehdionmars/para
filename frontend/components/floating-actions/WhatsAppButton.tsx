"use client";

import { useEffect, useState } from "react";

const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
const PREFILLED_MESSAGE = "Bonjour Para d'Hiver, j'ai besoin d'un conseil concernant un produit.";

export function WhatsAppButton() {
  // A fixed button sits over whatever happens to be at the bottom-right, and
  // in the footer that is a column of links — the button covered them and ate
  // the tap. It steps aside once the footer is on screen; there is a WhatsApp
  // link in the footer itself, so nothing is lost.
  const [overFooter, setOverFooter] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOverFooter(entry.isIntersecting), { threshold: 0 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // No number configured: don't render a dead/broken CTA.
  if (!PHONE) return null;

  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fab-whatsapp"
      data-hidden={overFooter ? "true" : "false"}
      aria-hidden={overFooter}
      tabIndex={overFooter ? -1 : undefined}
      aria-label="Contacter Para d'Hiver sur WhatsApp"
    >
      <svg aria-hidden="true" viewBox="0 0 32 32" width="28" height="28" fill="#fff">
        <path d="M16.004 3C9.373 3 4 8.373 4 15.004c0 2.386.652 4.62 1.786 6.533L4 29l7.646-1.762a11.94 11.94 0 0 0 4.358.822h.005C22.64 28.06 28 22.687 28 16.056 28 9.425 22.635 3 16.004 3Zm0 21.906h-.004a9.9 9.9 0 0 1-5.043-1.383l-.362-.215-3.75.864.9-3.665-.236-.376a9.88 9.88 0 0 1-1.512-5.284c0-5.467 4.45-9.917 9.925-9.917 2.65 0 5.14 1.033 7.014 2.909a9.86 9.86 0 0 1 2.906 7.02c0 5.468-4.45 9.947-9.838 9.947Zm5.437-7.42c-.298-.15-1.76-.868-2.033-.967-.273-.1-.472-.15-.671.149-.199.298-.771.966-.945 1.165-.174.199-.348.224-.646.075-.298-.15-1.258-.463-2.396-1.478-.886-.79-1.484-1.767-1.658-2.065-.174-.298-.019-.46.13-.608.134-.133.298-.348.447-.522.15-.174.199-.298.298-.497.1-.199.05-.373-.025-.522-.075-.15-.671-1.616-.92-2.213-.242-.582-.488-.503-.671-.512l-.572-.01c-.199 0-.522.075-.796.373-.273.298-1.045 1.02-1.045 2.487 0 1.467 1.07 2.884 1.22 3.083.149.199 2.107 3.216 5.106 4.51.713.308 1.27.492 1.704.63.716.228 1.368.196 1.883.119.574-.086 1.76-.72 2.008-1.415.249-.696.249-1.292.174-1.415-.075-.124-.273-.199-.571-.348Z" />
      </svg>
    </a>
  );
}
