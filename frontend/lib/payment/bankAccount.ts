/**
 * Coordonnées bancaires de la pharmacie, affichées au checkout quand le
 * client choisit le virement bancaire.
 *
 * Ces informations sont publiques par nature — elles figurent sur les factures
 * et sont communiquées à quiconque doit payer. Ce n'est pas un secret, mais
 * c'est une donnée dont une erreur d'un seul chiffre envoie l'argent d'un
 * client ailleurs. D'où la clé de contrôle vérifiée par les tests plutôt que
 * relue à l'œil.
 *
 * À terme ces champs ont leur place dans le CMS (comme le reste de
 * `data/*.ts`), pour qu'un changement de banque ne demande pas un déploiement.
 * Ils sont ici en attendant, en un seul endroit, pour que la migration vers un
 * global Payload n'ait qu'un fichier à remplacer.
 *
 * Source : RIB Attijariwafa Bank du compte PARA D'HIVER.
 */

export type BankAccount = {
  holder: string;
  bank: string;
  branch: string;
  /** Code banque (3 chiffres). */
  bankCode: string;
  /** Code ville / guichet (3 chiffres). */
  cityCode: string;
  /** Numéro de compte (16 chiffres). */
  accountNumber: string;
  /** Clé RIB (2 chiffres). */
  ribKey: string;
  bic: string;
};

export const BANK_ACCOUNT: BankAccount = {
  accountNumber: "0000795000001495",
  bank: "Attijariwafa Bank",
  bankCode: "007",
  bic: "BCMAMAMC",
  branch: "Casa Aïn Sebaâ — 5 Allée des Sophoras",
  cityCode: "780",
  holder: "PARA D'HIVER",
  ribKey: "42",
};

/** Le RIB en 24 chiffres, sans séparateur — la forme à copier. */
export const RIB = `${BANK_ACCOUNT.bankCode}${BANK_ACCOUNT.cityCode}${BANK_ACCOUNT.accountNumber}${BANK_ACCOUNT.ribKey}`;

/** L'IBAN en 28 caractères, sans espaces — la forme à copier. */
export const IBAN = `MA64${RIB}`;

/** `007 780 0000795000001495 42` — la présentation d'un RIB marocain. */
export function formatRib(account: BankAccount = BANK_ACCOUNT): string {
  return `${account.bankCode} ${account.cityCode} ${account.accountNumber} ${account.ribKey}`;
}

/** `MA64 0077 8000 …` — groupes de quatre, comme sur un relevé. */
export function formatIban(iban: string = IBAN): string {
  return (iban.match(/.{1,4}/g) ?? []).join(" ");
}

/**
 * Contrôle mod-97 d'un IBAN (ISO 13616).
 *
 * Les quatre premiers caractères passent à la fin, chaque lettre devient sa
 * position dans l'alphabet + 9, et le nombre obtenu doit valoir 1 modulo 97.
 * Exposé pour que les tests refusent un IBAN mal recopié : une faute de frappe
 * ici n'a aucun symptôme visible, elle envoie simplement les virements des
 * clients vers un compte qui n'est pas le nôtre.
 */
export function isValidIban(iban: string): boolean {
  const cleaned = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleaned)) return false;

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));

  // Reste calculé par tranches : le nombre dépasse Number.MAX_SAFE_INTEGER.
  let remainder = 0;
  for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  return remainder === 1;
}

/**
 * Contrôle de la clé RIB marocaine : `97 - (BBBVVVCCCCCCCCCCCCCCCC00 mod 97)`.
 * Même raison d'être que ci-dessus — un RIB faux est indétectable à l'œil.
 */
export function isValidRibKey(account: BankAccount = BANK_ACCOUNT): boolean {
  const base = `${account.bankCode}${account.cityCode}${account.accountNumber}00`;
  if (!/^\d+$/.test(base)) return false;

  let remainder = 0;
  for (const d of base) remainder = (remainder * 10 + Number(d)) % 97;
  return 97 - remainder === Number(account.ribKey);
}
