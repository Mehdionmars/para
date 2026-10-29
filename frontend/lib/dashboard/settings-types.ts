import { ROLES, type Role } from "./roles";

/**
 * The shop-wide settings the dashboard edits directly, so nobody has to open
 * Payload's own admin: the shop's address and hours (`stores`), delivery
 * prices (`shipping-rules`), the in-cabin services and their tariff
 * (`services`) and the staff accounts (`users`).
 *
 * Client-safe on purpose: the forms import the shapes and the rules from
 * here, and the server actions run the very same rules before writing —
 * a server action is a public endpoint, and the form's own checks are a
 * courtesy, not a guarantee. Payload's collection access still decides who
 * may write at all.
 *
 * Each `to…Form` turns a raw Payload document into a fully populated form
 * value (no `null` reaching a controlled input); each `validate…` returns the
 * first problem as a sentence an operator can act on, or null.
 */

const text = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

// ---------------------------------------------------------------- Boutique

export type StoreHours = { days: string; hours: string };

export type StoreForm = {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  mapUrl: string;
  order: number;
  hours: StoreHours[];
};

export const EMPTY_STORE: StoreForm = { address: "", email: "", hours: [], mapUrl: "", name: "", order: 0, phone: "" };

export function toStoreForm(raw: Record<string, unknown>): StoreForm {
  const hours = Array.isArray(raw.hours) ? (raw.hours as Record<string, unknown>[]) : [];
  return {
    address: text(raw.address),
    email: text(raw.email),
    hours: hours.map((h) => ({ days: text(h.days), hours: text(h.hours) })),
    id: typeof raw.id === "number" ? raw.id : undefined,
    mapUrl: text(raw.mapUrl),
    name: text(raw.name),
    order: num(raw.order) ?? 0,
    phone: text(raw.phone),
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStore(s: StoreForm): string | null {
  if (!s.name.trim()) return "Donnez un nom à la boutique.";
  if (!s.address.trim()) return "L'adresse est obligatoire : c'est ce que la page Contact publie.";
  if (s.email.trim() && !EMAIL.test(s.email.trim())) return "L'adresse email n'est pas valide.";
  if (s.mapUrl.trim() && !/^https?:\/\//i.test(s.mapUrl.trim())) return "Le lien Google Maps doit commencer par https://.";
  if (s.hours.some((h) => !h.days.trim() || !h.hours.trim())) return "Chaque ligne d'horaires a besoin des jours et des heures.";
  return null;
}

/** Trimmed, with empty hour rows dropped — what is actually written. */
export function cleanStore(s: StoreForm) {
  return {
    address: s.address.trim(),
    email: s.email.trim(),
    hours: s.hours.map((h) => ({ days: h.days.trim(), hours: h.hours.trim() })).filter((h) => h.days && h.hours),
    mapUrl: s.mapUrl.trim(),
    name: s.name.trim(),
    order: Number.isFinite(s.order) ? s.order : 0,
    phone: s.phone.trim(),
  };
}

// ---------------------------------------------------------------- Livraison

export type ShippingRuleForm = {
  id?: number;
  city: string;
  region: string;
  price: number;
  /** Subtotal from which delivery is free; null = never free. */
  freeFrom: number | null;
  isDefault: boolean;
  enabled: boolean;
};

export const EMPTY_SHIPPING_RULE: ShippingRuleForm = { city: "", enabled: true, freeFrom: null, isDefault: false, price: 0, region: "" };

export function toShippingRuleForm(raw: Record<string, unknown>): ShippingRuleForm {
  return {
    city: text(raw.city),
    enabled: raw.enabled !== false,
    freeFrom: num(raw.freeFrom),
    id: typeof raw.id === "number" ? raw.id : undefined,
    isDefault: raw.isDefault === true,
    price: num(raw.price) ?? 0,
    region: text(raw.region),
  };
}

export function validateShippingRule(r: ShippingRuleForm): string | null {
  if (!r.city.trim()) return "Indiquez la ville (ou « Autres villes » pour le tarif par défaut).";
  if (!Number.isFinite(r.price) || r.price < 0) return "Les frais de livraison doivent être un montant positif.";
  if (r.freeFrom !== null && (!Number.isFinite(r.freeFrom) || r.freeFrom < 0)) return "Le seuil de livraison offerte doit être un montant positif.";
  if (r.isDefault && !r.enabled) return "Le tarif par défaut doit rester actif : il s'applique à toutes les villes sans règle.";
  return null;
}

export function cleanShippingRule(r: ShippingRuleForm) {
  return {
    city: r.city.trim(),
    enabled: r.enabled,
    freeFrom: r.freeFrom,
    isDefault: r.isDefault,
    price: r.price,
    region: r.region.trim(),
  };
}

// ---------------------------------------------------------------- Services

/** Mirrors backend/src/collections/Services.ts SERVICE_ICON_OPTIONS. */
export const SERVICE_ICONS = ["Baby", "Feather", "Palette", "ScanFace", "Scissors", "Droplet"] as const;
export type ServiceIcon = (typeof SERVICE_ICONS)[number];

export const SERVICE_ICON_LABELS: Record<ServiceIcon, string> = {
  Baby: "Bébé",
  Droplet: "Goutte",
  Feather: "Plume",
  Palette: "Palette",
  ScanFace: "Visage",
  Scissors: "Ciseaux",
};

export type PriceLine = { label: string; price: number | null; fromPrice: boolean };
export type ServiceStep = { title: string; sub: string };

export type ServiceForm = {
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  duration: string;
  expert: string;
  sortOrder: number | null;
  icon: ServiceIcon;
  bg: string;
  imageId: number | null;
  imageUrl: string;
  priceList: PriceLine[];
  benefits: string[];
  steps: ServiceStep[];
};

export const EMPTY_SERVICE: ServiceForm = {
  benefits: [],
  bg: "#EFE6F3",
  description: "",
  duration: "",
  expert: "",
  icon: "Feather",
  imageId: null,
  imageUrl: "",
  price: 0,
  priceList: [],
  sortOrder: null,
  steps: [],
  subtitle: "",
  title: "",
};

export function toServiceForm(raw: Record<string, unknown>, imageUrl = ""): ServiceForm {
  const list = (key: string) => (Array.isArray(raw[key]) ? (raw[key] as Record<string, unknown>[]) : []);
  const image = raw.image;
  const icon = text(raw.icon);
  return {
    benefits: list("benefits").map((b) => text(b.text)),
    bg: text(raw.bg) || EMPTY_SERVICE.bg,
    description: text(raw.description),
    duration: text(raw.duration),
    expert: text(raw.expert),
    icon: (SERVICE_ICONS as readonly string[]).includes(icon) ? (icon as ServiceIcon) : EMPTY_SERVICE.icon,
    id: typeof raw.id === "number" ? raw.id : undefined,
    imageId: typeof image === "number" ? image : typeof image === "object" && image && typeof (image as { id?: unknown }).id === "number" ? (image as { id: number }).id : null,
    imageUrl,
    price: num(raw.price) ?? 0,
    priceList: list("priceList").map((p) => ({ fromPrice: p.fromPrice === true, label: text(p.label), price: num(p.price) })),
    sortOrder: num(raw.sortOrder),
    steps: list("steps").map((s) => ({ sub: text(s.sub), title: text(s.title) })),
    subtitle: text(raw.subtitle),
    title: text(raw.title),
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

export function validateService(s: ServiceForm): string | null {
  if (!s.title.trim()) return "Donnez un titre au service.";
  if (!s.description.trim()) return "La description est obligatoire : elle est affichée sur la page du service.";
  if (!Number.isFinite(s.price) || s.price < 0) return "Le prix doit être un montant positif (0 affiche « Offert »).";
  if (!(SERVICE_ICONS as readonly string[]).includes(s.icon)) return "Choisissez une icône.";
  if (s.bg.trim() && !HEX.test(s.bg.trim())) return "La couleur de fond doit être un code hexadécimal, par ex. #EFE6F3.";
  if (s.priceList.some((p) => !p.label.trim())) return "Chaque ligne de tarif a besoin d'un libellé.";
  if (s.priceList.some((p) => p.price !== null && (!Number.isFinite(p.price) || p.price < 0))) return "Les prix du tarif doivent être positifs.";
  if (s.steps.some((st) => !st.title.trim())) return "Chaque étape a besoin d'un titre.";
  return null;
}

export function cleanService(s: ServiceForm) {
  return {
    benefits: s.benefits.map((b) => b.trim()).filter(Boolean).map((t) => ({ text: t })),
    bg: s.bg.trim() || EMPTY_SERVICE.bg,
    description: s.description.trim(),
    duration: s.duration.trim(),
    expert: s.expert.trim(),
    icon: s.icon,
    image: s.imageId,
    price: s.price,
    priceList: s.priceList.map((p) => ({ fromPrice: p.fromPrice, label: p.label.trim(), price: p.price })),
    sortOrder: s.sortOrder,
    steps: s.steps.map((st) => ({ sub: st.sub.trim(), title: st.title.trim() })),
    subtitle: s.subtitle.trim(),
    title: s.title.trim(),
  };
}

/** "Dès 150 MAD", "Offert" or "Sur demande" — what the site's card shows. */
export function servicePriceSummary(s: Pick<ServiceForm, "price" | "priceList">): string {
  const prices = s.priceList.map((p) => p.price).filter((p): p is number => p !== null);
  if (prices.length > 0) return `Dès ${Math.min(...prices).toLocaleString("fr-FR")} MAD`;
  if (s.priceList.length > 0) return "Sur demande";
  return s.price === 0 ? "Offert" : `${s.price.toLocaleString("fr-FR")} MAD`;
}

// ---------------------------------------------------------------- Équipe

export type StaffAccount = { id: number; email: string; roles: Role[]; createdAt: string };

export function toStaffAccount(raw: Record<string, unknown>): StaffAccount {
  const roles = Array.isArray(raw.roles) ? raw.roles.filter((r): r is Role => (ROLES as readonly string[]).includes(r as string)) : [];
  return { createdAt: text(raw.createdAt), email: text(raw.email), id: Number(raw.id), roles };
}

/** What each staff role opens, in the operator's words. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Tout, y compris l'équipe et les paramètres.",
  customer: "Aucun accès au dashboard.",
  editor: "Catalogue, storefront, coffrets et coupons.",
  manager: "Ventes, catalogue, stock, storefront et analytics.",
  sales: "Commandes, factures, clients et rendez-vous.",
  stockManager: "Inventaire, réapprovisionnement et import.",
};

export type StaffAccountInput = { id?: number; email: string; roles: Role[]; password: string };

export function validateStaffAccount(input: StaffAccountInput, { isSelf }: { isSelf: boolean }): string | null {
  if (!input.id && !EMAIL.test(input.email.trim())) return "Indiquez une adresse email valide.";
  if (!input.id && input.password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (input.id && input.password && input.password.length < 8) return "Le nouveau mot de passe doit contenir au moins 8 caractères.";
  if (input.roles.length === 0) return "Choisissez au moins un rôle.";
  // An administrator removing their own admin role would lock the shop out of
  // its own team settings; another administrator has to do it.
  if (isSelf && !input.roles.includes("admin")) return "Vous ne pouvez pas retirer votre propre rôle d'administrateur.";
  return null;
}
