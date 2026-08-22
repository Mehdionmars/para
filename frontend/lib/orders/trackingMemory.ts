/**
 * Ce que /suivi-commande retient d'une visite à l'autre.
 *
 * Un client qui suit sa commande revient plusieurs fois en quelques jours et
 * retape à chaque fois un numéro qu'il doit aller rechercher dans sa boîte
 * mail. Ce module se souvient de la dernière consultation qui a abouti, pour
 * pré-remplir le formulaire.
 *
 * CE N'EST QUE DU CONFORT D'INTERFACE. Le contenu est modifiable par quiconque
 * ouvre les outils de développement, donc il ne prouve rien et n'ouvre aucun
 * droit : le serveur revérifie numéro + email à chaque consultation et renvoie
 * le même 404 pour un numéro faux et pour un email faux
 * (backend/src/app/api/orders/track/route.ts). Rien ici ne doit jamais être
 * traité comme une authentification.
 *
 * Deux champs, et deux seulement. Pas d'adresse, pas de téléphone, pas de
 * montant, pas de contenu de panier, pas de coordonnées bancaires : ce
 * stockage survit à la session, est lisible par toute extension installée sur
 * le navigateur, et reste souvent sur une machine partagée.
 *
 * Le `storage` est injectable pour que la logique soit testable hors
 * navigateur — la suite de tests tourne en environnement node, sans `window`.
 */

export const TRACKING_STORAGE_KEY = "para-d-hiver:order-tracking";

export type TrackingMemory = {
  orderNumber: string;
  email: string;
};

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/**
 * Bornes de longueur. Un numéro de commande fait une quinzaine de caractères
 * (`PDH-260819-4F2A`) et un email est plafonné à 254 par la RFC 5321 ; ce qui
 * dépasse n'a pas été saisi dans le formulaire, c'est un stockage trafiqué à la
 * main, et cela n'a pas à être réinjecté dans la page.
 */
const MAX_ORDER_NUMBER_LENGTH = 64;
const MAX_EMAIL_LENGTH = 254;

/**
 * `undefined` (l'appel courant) cherche le stockage du navigateur ; `null`
 * signifie explicitement « pas de stockage » et sert au rendu serveur comme aux
 * tests. Le simple accès à `localStorage` peut lever quand le navigateur
 * bloque le stockage de site, d'où le try.
 */
function resolveStorage(explicit?: StorageLike | null): StorageLike | null {
  if (explicit !== undefined) return explicit;
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Normalise comme le serveur le fait avant de comparer, ou rend null. */
function normaliseOrderNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ORDER_NUMBER_LENGTH) return null;
  return trimmed.toUpperCase();
}

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH) return null;
  return trimmed.toLowerCase();
}

/**
 * La dernière consultation retenue, ou null.
 *
 * Tout ce qui n'est pas exactement un enregistrement à deux chaînes utilisables
 * rend null : JSON invalide, tableau, valeur nulle, champ manquant, champ d'un
 * autre type, chaîne vide, chaîne démesurée. Rien n'est levé — un stockage
 * abîmé doit laisser la page fonctionner, pas la casser.
 */
export function readTracking(storage?: StorageLike | null): TrackingMemory | null {
  const store = resolveStorage(storage);
  if (!store) return null;

  let raw: string | null;
  try {
    raw = store.getItem(TRACKING_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  // Un tableau est un objet en JavaScript, d'où l'exclusion explicite. Elle
  // est redondante en pratique — un tableau JSON n'a pas de propriété
  // `orderNumber`, donc la validation des champs plus bas le rejetterait de
  // toute façon — et le test de mutation le confirme. Gardée parce qu'elle dit
  // l'intention, et qu'elle tiendrait encore si cette validation changeait.
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const record = parsed as Record<string, unknown>;
  const orderNumber = normaliseOrderNumber(record.orderNumber);
  const email = normaliseEmail(record.email);
  if (!orderNumber || !email) return null;

  // Reconstruit plutôt que retourné tel quel : un champ ajouté à la main dans
  // le stockage ne doit pas se propager dans le reste de l'application.
  return { email, orderNumber };
}

/**
 * Retient une consultation. Rend `false` si rien n'a été écrit.
 *
 * À n'appeler qu'après une consultation acceptée par le serveur : un échec ne
 * doit pas remplacer une mémoire qui marchait, sinon une faute de frappe
 * effacerait ce que le client avait de bon.
 */
export function saveTracking(value: { orderNumber: string; email: string }, storage?: StorageLike | null): boolean {
  const store = resolveStorage(storage);
  if (!store) return false;

  const orderNumber = normaliseOrderNumber(value?.orderNumber);
  const email = normaliseEmail(value?.email);
  if (!orderNumber || !email) return false;

  try {
    // Objet littéral, jamais un spread de l'argument : ce qui est écrit est
    // exactement ces deux champs, quoi que l'appelant ait passé en plus.
    store.setItem(TRACKING_STORAGE_KEY, JSON.stringify({ email, orderNumber }));
    return true;
  } catch {
    // Quota dépassé, ou stockage refusé : la page continue sans mémoire.
    return false;
  }
}

/** Oublie la consultation retenue. Ne lève jamais. */
export function clearTracking(storage?: StorageLike | null): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(TRACKING_STORAGE_KEY);
  } catch {
    // Rien à faire : l'objectif était de ne plus rien avoir en mémoire.
  }
}
