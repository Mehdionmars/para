"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Snowflakes } from "@/components/Snowflakes";
import { NEWSLETTER_COPY } from "@/data/home";

type NewsletterCopy = typeof NEWSLETTER_COPY;

type Status = "idle" | "done";

/**
 * The newsletter band.
 *
 * Structure, the inline result region and the field/label wiring come from
 * originui's "Newsletter Section" on 21st.dev. What it ships in does not:
 * that component renders a zinc-900 card through shadcn's Button and Input,
 * and those read `--primary`, `--ring` and `--input`, which live in the
 * dashboard's stylesheet. The storefront loads only its own, so importing
 * them here would print an unstyled control on the shop. The primitives are
 * the storefront's, and every colour still comes from the CMS.
 *
 * Its loading and error states were left out, deliberately. There is no
 * /api/newsletter to call: the address is not stored anywhere, and the
 * previous version already fired a thank-you toast on nothing at all. A
 * spinner in front of a request that does not exist would be one more piece
 * of theatre, so submitting confirms and nothing pretends otherwise. Wiring
 * a real endpoint means adding the fetch here and a "sending" branch — the
 * shape is ready for it.
 *
 * The layout is centred rather than the two columns it replaces. That grid
 * was `auto-fit, minmax(320px, 1fr)`: on a wide band the copy took the right
 * track and the field the left, so the eye read the headline and then jumped
 * backwards and down to the thing it was being asked to do.
 *
 * The result is announced in place rather than through a toast — a toast
 * leaves the screen while the form it describes is still on it.
 */
export function Newsletter({ copy: copyProp }: { copy?: NewsletterCopy } = {}) {
  const [email, setEmail] = useState("");
  const [, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const copy = copyProp ?? NEWSLETTER_COPY;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("done");
    setMessage(copy.successMessage || "Merci ! Votre code −10% arrive par email.");
    setEmail("");
  }

  const logoEnabled = copy.logoEnabled !== false;
  const logoSize = copy.logoSize || 76;
  const backgroundColor = copy.backgroundColor || "var(--pdh-plum)";
  const textColor = copy.textColor || "#FFFFFF";
  const ctaColor = copy.ctaColor || "var(--pdh-teal)";
  const borderRadius = copy.borderRadius ?? 26;
  const particlesEnabled = copy.particlesEnabled !== false;
  const particlesOpacity = copy.particlesOpacity ?? 0.18;

  return (
    <section
      aria-labelledby="newsletter-title"
      style={{
        maxWidth: "min(1280px,100%)",
        margin: "0 auto var(--sec-y)",
        borderRadius,
        background: backgroundColor,
        color: textColor,
        padding: "clamp(32px,4.4vw,56px) clamp(22px,3.2vw,36px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {particlesEnabled && <Snowflakes opacity={particlesOpacity} scale={0.75} />}

      <div
        style={{
          position: "relative",
          maxWidth: "min(46em,100%)",
          margin: "0 auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(10px,1.4vw,16px)",
        }}
      >
        {/* Hidden on phones in globals.css: at 375px it claimed a quarter of
            the band from the headline and the field, which are what the
            section is for. */}
        {logoEnabled && (
          <span
            aria-hidden="true"
            className="newsletter-logo"
            style={{ position: "relative", flex: "none", width: logoSize, height: logoSize, opacity: 0.92 }}
          >
            <Image src="/assets/logo.png" alt="" fill sizes={`${logoSize}px`} style={{ objectFit: "contain" }} />
          </span>
        )}

        <h2
          id="newsletter-title"
          style={{
            fontFamily: "var(--font-alta)",
            fontWeight: 200,
            fontSize: "clamp(24px,3.2vw,36px)",
            lineHeight: 1.08,
            margin: 0,
            textWrap: "balance",
          }}
        >
          {copy.title || "Recevez nos conseils & nouveautés"}
        </h2>

        <p style={{ fontSize: 14, opacity: 0.78, margin: 0, maxWidth: "34em", lineHeight: 1.6, textWrap: "pretty" }}>
          {copy.subtitle || "Inscrivez-vous pour découvrir nos conseils pharmaceutiques, nouveautés et offres exclusives."}
        </p>

        <form onSubmit={handleSubmit} style={{ width: "min(30em,100%)", marginTop: "clamp(4px,0.8vw,10px)" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.28)",
              padding: 7,
              borderRadius: 999,
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
              {copy.placeholder || "Votre adresse email"}
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.placeholder || "Votre adresse email"}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: textColor,
                fontSize: 16,
                padding: "0 18px",
              }}
            />
            <button
              type="submit"
              style={{
                flex: "none",
                minWidth: 132,
                minHeight: 44,
                background: ctaColor,
                color: "#fff",
                border: "none",
                padding: "0 22px",
                borderRadius: 999,
                fontFamily: "var(--font-poppins)",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {copy.buttonLabel || "S'inscrire"}
                <ArrowRight aria-hidden="true" size={14} strokeWidth={2} />
              </span>
            </button>
          </div>

          {/* Always in the tree, so the outcome is announced rather than
              inserted — and so the band does not grow by a line the moment
              it answers. */}
          <p
            aria-live="polite"
            role="status"
            style={{
              minHeight: "1.4em",
              margin: "10px 0 0",
              fontSize: 12.5,
              lineHeight: 1.4,
              opacity: message ? 0.92 : 0,
              transition: "opacity .2s ease",
            }}
          >
            {message}
          </p>
        </form>
      </div>
    </section>
  );
}
