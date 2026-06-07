import "server-only";
import type { RawItem, RawItemPrice, RawBin } from "./types";

/** Shipping address captured at checkout. */
export interface ShippingAddress {
  name: string;
  line1: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CustomerInput {
  email: string;
  name: string;
}

export interface SalesOrderItemInput {
  itemCode: string;
  qty: number;
  rate: number;
}

export interface SalesOrderInput {
  customer: string;
  currency: string;
  priceList: string;
  items: SalesOrderItemInput[];
  shipping?: ShippingAddress;
}

/**
 * The data source: the seam between our storefront and ERPNext. Mock and live both
 * satisfy this interface, so the rest of the app never changes when flipping mock⇄live.
 * `server-only`: holds ERPNext API credentials; never bundled into client code.
 */
export interface CatalogDataSource {
  // --- reads ---
  listItems(): Promise<RawItem[]>;
  getItemByCode(itemCode: string): Promise<RawItem | null>;
  getItemPrices(itemCodes: string[], priceList: string): Promise<RawItemPrice[]>;
  getStockLevels(itemCodes: string[]): Promise<RawBin[]>;
  // --- writes (checkout) ---
  findOrCreateCustomer(input: CustomerInput): Promise<string>; // returns Customer name
  createSalesOrder(input: SalesOrderInput): Promise<string>; // returns Sales Order name
}

export const config = {
  useMock: process.env.STOREFRONT_USE_MOCK !== "false",
  erpnextUrl: process.env.ERPNEXT_URL ?? "",
  apiKey: process.env.ERPNEXT_API_KEY ?? "",
  apiSecret: process.env.ERPNEXT_API_SECRET ?? "",
  defaultPriceList: process.env.ERPNEXT_DEFAULT_PRICE_LIST ?? "Retail",
  wholesalePriceList: process.env.ERPNEXT_WHOLESALE_PRICE_LIST ?? "Wholesale",
};

let cached: CatalogDataSource | null = null;

export async function getDataSource(): Promise<CatalogDataSource> {
  if (cached) return cached;
  if (config.useMock) {
    const { MockDataSource } = await import("./mock");
    cached = new MockDataSource();
  } else {
    if (!config.erpnextUrl || !config.apiKey || !config.apiSecret) {
      throw new Error(
        "ERPNext live mode requires ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET",
      );
    }
    const { LiveErpNextDataSource } = await import("./live");
    cached = new LiveErpNextDataSource(config);
  }
  return cached;
}
