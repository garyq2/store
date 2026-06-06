import "server-only";
import type { CatalogDataSource } from "./source";
import type { RawItem, RawItemPrice, RawBin } from "./types";

interface LiveConfig {
  erpnextUrl: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Live ERPNext REST data source. Reads `Item` directly (headless — no webshop/Website Item).
 * Auth: token header `Authorization: token <key>:<secret>` (server-only, never client-side).
 */
export class LiveErpNextDataSource implements CatalogDataSource {
  constructor(private cfg: LiveConfig) {}

  private async resource<T>(doctype: string, query: Record<string, string>): Promise<T[]> {
    const usp = new URLSearchParams(query);
    const url = `${this.cfg.erpnextUrl}/api/resource/${encodeURIComponent(doctype)}?${usp}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${this.cfg.apiKey}:${this.cfg.apiSecret}`,
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // light caching; invalidate via ERPNext webhooks later
    });
    if (!res.ok) {
      throw new Error(`ERPNext ${res.status} ${res.statusText} for ${doctype}`);
    }
    const body = (await res.json()) as { data: T[] };
    return body.data;
  }

  private static ITEM_FIELDS = JSON.stringify([
    "name", "item_code", "item_name", "item_group", "brand", "image",
    "description", "stock_uom", "is_stock_item", "is_sales_item", "disabled",
  ]);

  async listItems(): Promise<RawItem[]> {
    return this.resource<RawItem>("Item", {
      fields: LiveErpNextDataSource.ITEM_FIELDS,
      filters: JSON.stringify([["is_sales_item", "=", 1], ["disabled", "=", 0]]),
      limit_page_length: "0",
    });
  }

  async getItemByCode(itemCode: string): Promise<RawItem | null> {
    const items = await this.resource<RawItem>("Item", {
      fields: LiveErpNextDataSource.ITEM_FIELDS,
      filters: JSON.stringify([["item_code", "=", itemCode], ["disabled", "=", 0]]),
      limit_page_length: "1",
    });
    return items[0] ?? null;
  }

  async getItemPrices(itemCodes: string[], priceList: string): Promise<RawItemPrice[]> {
    if (itemCodes.length === 0) return [];
    return this.resource<RawItemPrice>("Item Price", {
      fields: JSON.stringify(["item_code", "price_list", "currency", "price_list_rate"]),
      filters: JSON.stringify([
        ["item_code", "in", itemCodes],
        ["price_list", "=", priceList],
      ]),
      limit_page_length: "0",
    });
  }

  async getStockLevels(itemCodes: string[]): Promise<RawBin[]> {
    if (itemCodes.length === 0) return [];
    return this.resource<RawBin>("Bin", {
      fields: JSON.stringify(["item_code", "warehouse", "actual_qty", "projected_qty"]),
      filters: JSON.stringify([["item_code", "in", itemCodes]]),
      limit_page_length: "0",
    });
  }
}
