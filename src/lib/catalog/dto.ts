/**
 * Storefront DTOs — clean, UI-facing shapes decoupled from ERPNext DocTypes.
 * Components and API responses speak ONLY these types.
 */

export interface Money {
  amount: number;
  currency: string;
  formatted: string; // e.g. "$68.00"
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string | null; // null -> UI shows a generated gradient
  price: Money;
  inStock: boolean;
  availableQty: number;
  badge: string | null; // e.g. "Only 3 left", "Sold out"
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDetail extends ProductSummary {
  shortDescription: string;
  longDescription: string;
  gallery: string[]; // image urls; empty -> UI generates gradients
  specs: ProductSpec[];
  wholesalePrice: Money | null; // shown for B2B / reference
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export interface CatalogQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  q?: string;
  sort?: SortKey;
  priceList?: string;
}

export interface Facet {
  value: string;
  count: number;
}

export interface CatalogResult {
  items: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  categories: Facet[];
}
