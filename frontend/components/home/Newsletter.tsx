"use client";

import Image from "next/image";
import { useState } from "react";
import { Snowflakes } from "@/components/Snowflakes";
import { useToast } from "@/context/toast-context";
import { NEWSLETTER_COPY } from "@/data/home";

type NewsletterCopy = typeof NEWSLETTER_COPY;

export function Newsletter({ copy: copyProp }: { copy?: NewsletterCopy } = {}) {
  const [email, setEmail] = useState("");
  const toast = useToast();
  const copy = copyProp ?? NEWSLETTER_COPY;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.fire(copy.successMessage || "Merci ! Votre code −10% arrive par email");
    setEmail("");
  }

  const logoEnabled = copy.logoEnabled !== false;
  const logoSize = copy.logoSize || 76;
  const logoPosition = copy.logoPosition === "top" ? "top" : "left";
  const backgroundColor = copy.backgroundColor || "var(--pdh-plum)";
  const textColor = copy.textColor || "#FFFFFF";
  const ctaColor = copy.ctaColor || "#008AA5";
  const borderRadius = copy.borderRadius ?? 26;
  const particlesEnabled = copy.particlesEnabled !== false;
  const particlesOpacity = copy.particlesOpacity ?? 0.18;

  return (
    <div
      style={{
        maxWidth: "min(1280px,100%)",
        margin: "0 auto var(--sec-y)",
        borderRadius,
        background: backgroundColor,
        padding: "clamp(18px,2.6vw,28px) clamp(22px,3.2vw,36px)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
        gap: "clamp(16px,2.4vw,32px)",
        alignItems: "center",
        color: textColor,
        position: "relative",
        overflow: "hidden",
        minHeight: "clamp(220px,26vw,280px)",
      }}
    >
      {particlesEnabled && <Snowflakes opacity={particlesOpacity} scale={0.75} />}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: logoPosition === "top" ? "column" : "row",
          alignItems: logoPosition === "top" ? "flex-start" : "center",
          gap: "clamp(12px,2vw,18px)",
          flexWrap: "wrap",
        }}
      >
        {logoEnabled && (
          <span aria-hidden="true" style={{ position: "relative", flex: "none", width: logoSize, height: logoSize, opacity: 0.92 }}>
            <Image src="/assets/logo.png" alt="" fill sizes={`${logoSize}px`} style={{ objectFit: "contain" }} />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(23px,2.8vw,32px)", lineHeight: 1.08, margin: "0 0 8px" }}>
            {copy.title || "Recevez nos conseils & nouveautés"}
          </h2>
          <p style={{ fontSize: 13.5, opacity: 0.75, margin: 0, maxWidth: 760 }}>
            {copy.subtitle || "Inscrivez-vous pour découvrir nos conseils pharmaceutiques, nouveautés et offres exclusives."}
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ position: "relative", display: "flex", gap: 10, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.28)", padding: 7, borderRadius: 999 }}
      >
        <label htmlFor="newsletter-email" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
          Votre adresse email
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder || "Votre adresse email"}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: textColor, fontSize: 14, padding: "0 20px", minWidth: 0 }}
        />
        <button
          type="submit"
          style={{ background: ctaColor, color: "#fff", padding: "13px 26px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", transition: "transform .2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          {copy.buttonLabel || "S'inscrire"}
        </button>
      </form>
    </div>
  );
}
