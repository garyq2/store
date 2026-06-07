import type { Money } from "@/lib/catalog/dto";

export interface CheckoutInput {
  name: string;
  email: string;
  address1: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PlacedOrder {
  salesOrder: string; // ERPNext Sales Order name
  itemCount: number;
  total: Money;
}
