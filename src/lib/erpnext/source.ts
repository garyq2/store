import "server-only";
import type { RawItem, RawItemPrice, RawBin } from "./types";

/**
 * The catalog data source: the seam between our storefront and ERPNext.
 * A mock implementation (in-memory) and a live REST implementation both satisfy this
 * interface, so the rest of the app never changes when we flip from mock to a real
 * ERPNext instance.
 *
 * This module is `server-only`: it (and its implementations) hold ERPNext API
 * credentials and must never be bundled into client code.
 */
export interface CatalogDataSource {
  /** All storefront-eligible items (sales items, not disabled). */
  listItems(): Promise<RawItem[]>;
  getItemByCode(itemCode: string): Promise<RawItem | null>;
  getItemPrices(itemCodes: string[], priceList: string): Promise<RawItemPrice[]>;
  getStockLevels(itemCodes: string[]): Promise<RawBin[]>;
}

export const config = {
  /** Default to mock; set STOREFRONT_USE_MOCK=false once ERPNext is reachable. */
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
