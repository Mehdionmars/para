// Pure types + client-safe constants for /dashboard/import — no server-only
// imports, mirrors backend/src/lib/dashboardImport/fields.ts exactly.

export const IMPORT_FIELDS = [
  "title",
  "slug",
  "sku",
  "barcode",
  "brand",
  "category",
  "description",
  "price",
  "compareAtPrice",
  "stock",
  "lowStockThreshold",
  "expiryDate",
  "batchNumber",
  "supplier",
  "imageUrl",
  "status",
  "featured",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

export type ColumnMapping = Partial<Record<ImportField, string>>;

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  barcode: "Code-barres",
  batchNumber: "Numéro de lot",
  brand: "Marque",
  category: "Catégorie",
  compareAtPrice: "Ancien prix (barré)",
  description: "Description",
  expiryDate: "Date d'expiration",
  featured: "Mis en avant",
  imageUrl: "URL de l'image",
  lowStockThreshold: "Seuil de stock faible",
  price: "Prix (PPH)",
  slug: "Slug",
  sku: "SKU",
  status: "Statut",
  stock: "Stock",
  supplier: "Fournisseur",
  title: "Titre du produit",
};

export const CSV_TEMPLATE_HEADERS: ImportField[] = [
  "title",
  "slug",
  "sku",
  "barcode",
  "brand",
  "category",
  "description",
  "price",
  "compareAtPrice",
  "stock",
  "lowStockThreshold",
  "expiryDate",
  "batchNumber",
  "supplier",
  "imageUrl",
  "status",
  "featured",
];

export const CSV_TEMPLATE_SAMPLE_ROW: Record<ImportField, string> = {
  barcode: "6111234567890",
  batchNumber: "LOT-2026-01",
  brand: "Nuxe",
  category: "Visage",
  compareAtPrice: "220",
  description: "Sérum hydratant à l'acide hyaluronique.",
  expiryDate: "2027-06-30",
  featured: "true",
  imageUrl: "https://example.com/images/serum.jpg",
  lowStockThreshold: "5",
  price: "189",
  slug: "",
  sku: "NUXE-SER-001",
  status: "active",
  stock: "40",
  supplier: "Distripharm",
  title: "Sérum Hydratant Visage",
};

export type RawRow = { raw: Record<string, unknown>; rowIndex: number; sheet: string };

export type PreviewRow = {
  title: string;
  slug: string;
  sku: string;
  barcode: string;
  brandName: string;
  category?: string;
  categoryText: string;
  description: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  expiryDate?: string;
  batchNumber: string;
  supplierName: string;
  imageUrl: string;
  isPublished?: boolean;
  featured?: boolean;
  errors: string[];
  warnings: string[];
  isUpdate: boolean;
  rowIndex: number;
  sheet: string;
};

export type ValidateResponse = {
  columns: string[];
  rawRows: RawRow[];
  rows: PreviewRow[];
  sheetNames: string[];
  suggestedMapping: ColumnMapping;
  summary: { invalid: number; toCreate: number; toUpdate: number; total: number; valid: number };
};

export type RowOutcome = {
  row: number;
  sheet: string;
  sku: string;
  status: "created" | "updated" | "skipped" | "failed";
  message?: string;
  warnings?: string[];
};

export type RunResponse = {
  results: RowOutcome[];
  summary: { created: number; failed: number; skipped: number; updated: number };
};
