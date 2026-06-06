import type { Money } from "@/lib/catalog/dto";

/** A hydrated cart line (price/name/stock re-derived server-side, never trusted from client). */
export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: Money;
  qty: number;
  lineTotal: Money;
  availableQty: number;
  inStock: boolean;
}

export interface Cart {
  items: CartLine[];
  itemCount: number;
  subtotal: Money;
  currency: string;
  freeShipThreshold: number;
  freeShipRemaining: number;
}

/** Minimal persisted shape (in the cookie / store) — just references + quantities. */
export interface RawCart {
  v: 1;
  items: { id: string; qty: number }[];
}
