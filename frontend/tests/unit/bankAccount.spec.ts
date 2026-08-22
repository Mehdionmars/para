import { describe, expect, it } from "vitest";

import {
  BANK_ACCOUNT,
  IBAN,
  RIB,
  formatIban,
  formatRib,
  isValidIban,
  isValidRibKey,
} from "@/lib/payment/bankAccount";

/**
 * Le RIB affiché au checkout.
 *
 * Un chiffre faux dans ces numéros n'a aucun symptôme : la page s'affiche
 * normalement, le client recopie, et son virement part sur un compte qui n'est
 * pas le nôtre — on ne l'apprend qu'en ne voyant jamais arriver l'argent. Les
 * clés de contrôle sont donc vérifiées par le test plutôt que relues à l'œil.
 */

describe("les clés de contrôle du compte", () => {
  it("l'IBAN passe le contrôle mod 97", () => {
    expect(isValidIban(IBAN)).toBe(true);
  });

  it("la clé RIB correspond au reste du numéro", () => {
    expect(isValidRibKey()).toBe(true);
  });

  it("refuse un IBAN dont un chiffre a changé", () => {
    // La garantie qui compte : la vérification doit détecter une faute de
    // frappe, pas seulement approuver le bon numéro.
    const broken = IBAN.slice(0, 10) + (IBAN[10] === "0" ? "1" : "0") + IBAN.slice(11);
    expect(broken).not.toBe(IBAN);
    expect(isValidIban(broken)).toBe(false);
  });

  it("refuse une clé RIB fausse", () => {
    expect(isValidRibKey({ ...BANK_ACCOUNT, ribKey: "43" })).toBe(false);
  });

  it("refuse ce qui n'est pas un IBAN", () => {
    for (const bad of ["", "MA64", "0077800000795", "MA6400778000007950000014954X"]) {
      expect(isValidIban(bad)).toBe(false);
    }
  });

  it("accepte l'IBAN écrit avec des espaces, comme sur un relevé", () => {
    expect(isValidIban(formatIban())).toBe(true);
    expect(isValidIban(IBAN.toLowerCase())).toBe(true);
  });
});

describe("la composition des numéros", () => {
  it("l'IBAN marocain fait 28 caractères et commence par MA", () => {
    expect(IBAN).toHaveLength(28);
    expect(IBAN.startsWith("MA")).toBe(true);
  });

  it("le RIB fait 24 chiffres et se retrouve entier dans l'IBAN", () => {
    expect(RIB).toHaveLength(24);
    expect(/^\d{24}$/.test(RIB)).toBe(true);
    expect(IBAN).toContain(RIB);
  });

  it("le RIB est bien la concaténation des quatre parties du relevé", () => {
    expect(RIB).toBe(
      `${BANK_ACCOUNT.bankCode}${BANK_ACCOUNT.cityCode}${BANK_ACCOUNT.accountNumber}${BANK_ACCOUNT.ribKey}`,
    );
  });
});

describe("l'affichage", () => {
  it("groupe le RIB comme sur le relevé", () => {
    expect(formatRib()).toBe("007 780 0000795000001495 42");
  });

  it("groupe l'IBAN par quatre", () => {
    expect(formatIban()).toBe("MA64 0077 8000 0079 5000 0014 9542");
  });

  it("ce qui est copié ne contient aucun espace", () => {
    // Les boutons copient RIB/IBAN bruts : un numéro collé avec des espaces
    // est refusé par la plupart des applications bancaires.
    expect(RIB).not.toMatch(/\s/);
    expect(IBAN).not.toMatch(/\s/);
  });

  it("la version lisible et la version copiée décrivent le même compte", () => {
    expect(formatIban().replace(/\s/g, "")).toBe(IBAN);
    expect(formatRib().replace(/\s/g, "")).toBe(RIB);
  });
});
