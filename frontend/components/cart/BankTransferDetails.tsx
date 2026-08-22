"use client";

import { useState } from "react";
import { BANK_ACCOUNT, IBAN, RIB, formatIban, formatRib } from "@/lib/payment/bankAccount";

/**
 * Les coordonnées bancaires à recopier pour un virement.
 *
 * Un client qui paie par virement retape ces chiffres dans son application
 * bancaire : une seule erreur et l'argent part ailleurs, sans message
 * d'erreur. D'où le bouton « Copier » à côté de chaque numéro — la version
 * copiée est sans espaces, la version lue est groupée, parce que ce qui se
 * relit bien ne se colle pas bien.
 *
 * `reference` n'existe qu'après la validation de la commande : le numéro est
 * attribué par le serveur à ce moment-là. Avant, le bloc explique simplement
 * que la référence suivra, plutôt que d'inventer un numéro.
 */

function CopyButton({ label, value }: { label: string; value: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      // Contexte non sécurisé, ou permission refusée : le numéro reste
      // sélectionnable à la main, on le dit plutôt que de faire semblant.
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      style={{
        alignItems: "center",
        background: "#FFFFFF",
        border: "1px solid rgba(94,64,116,.22)",
        borderRadius: 999,
        color: "var(--pdh-plum)",
        cursor: "pointer",
        display: "inline-flex",
        fontSize: 12,
        fontWeight: 600,
        gap: 6,
        padding: "8px 14px",
        whiteSpace: "nowrap",
      }}
    >
      {state === "done" ? "Copié ✓" : state === "failed" ? "Copie indisponible" : label}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "space-between", padding: "7px 0" }}>
      <span style={{ fontSize: 12.5, opacity: 0.65 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{children}</span>
    </div>
  );
}

export function BankTransferDetails({ reference }: { reference?: string }) {
  return (
    <div
      style={{
        background: "var(--pdh-cream, #F7EEE5)",
        border: "1px solid rgba(94,64,116,.12)",
        borderRadius: 14,
        marginTop: 12,
        padding: 16,
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".1em",
          margin: "0 0 10px",
          textTransform: "uppercase",
        }}
      >
        Coordonnées bancaires
      </p>

      <Row label="Titulaire">{BANK_ACCOUNT.holder}</Row>
      <Row label="Banque">{BANK_ACCOUNT.bank}</Row>
      <Row label="Agence">{BANK_ACCOUNT.branch}</Row>
      <Row label="RIB">
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatRib()}</span>
      </Row>
      <Row label="IBAN">
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatIban()}</span>
      </Row>
      <Row label="BIC / SWIFT">{BANK_ACCOUNT.bic}</Row>
      {reference ? (
        <Row label="Référence du virement">
          <strong>{reference}</strong>
        </Row>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <CopyButton label="Copier le RIB" value={RIB} />
        <CopyButton label="Copier l'IBAN" value={IBAN} />
      </div>

      <p style={{ fontSize: 12, lineHeight: 1.5, margin: "12px 0 0", opacity: 0.7 }}>
        {reference ? (
          <>
            Indiquez <strong>{reference}</strong> comme référence du virement : c&apos;est ce qui permet de
            rapprocher votre paiement de votre commande. Votre commande est préparée à réception du virement.
          </>
        ) : (
          <>
            Le numéro de commande vous sera communiqué dès la validation : il servira de référence à indiquer
            lors du virement. Votre commande est préparée à réception du paiement.
          </>
        )}
      </p>
    </div>
  );
}
