/**
 * Raw ERPNext DocType shapes (subset of fields we read).
 * The storefront is HEADLESS and reads ERPNext `Item` directly — "Website Item" lives in
 * the separate `webshop` app (removed from ERPNext core in v14) and is deliberately unused.
 * The catalog service maps these into clean DTOs (see lib/catalog/dto.ts).
 */

/** ERPNext "Item" — the product master. */
export interface RawItem {
  name: string; // docname == item_code
  item_code: string;
  item_name: string;
  item_group: string; // category
  brand: string | null;
  image: string | null; // file path/URL on the ERPNext host (may be relative)
  description: string | null;
  stock_uom: string;
  is_stock_item: 0 | 1;
  is_sales_item: 0 | 1;
  disabled: 0 | 1;
}

/** ERPNext "Item Price" under a "Price List" (e.g. Retail, Wholesale). */
export interface RawItemPrice {
  item_code: string;
  price_list: string;
  currency: string;
  price_list_rate: number;
}

/** ERPNext "Bin" — stock level per item + warehouse. */
export interface RawBin {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  projected_qty: number;
}
