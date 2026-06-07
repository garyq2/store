import "server-only";
import type { CatalogDataSource, CustomerInput, SalesOrderInput } from "./source";
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

  // ---- writes (checkout) ----

  private async create(doctype: string, doc: Record<string, unknown>): Promise<string> {
    const res = await fetch(
      `${this.cfg.erpnextUrl}/api/resource/${encodeURIComponent(doctype)}`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${this.cfg.apiKey}:${this.cfg.apiSecret}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(doc),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      throw new Error(
        `ERPNext ${res.status} creating ${doctype}: ${(await res.text()).slice(0, 500)}`,
      );
    }
    const body = (await res.json()) as { data: { name: string } };
    return body.data.name;
  }

  private async firstName(doctype: string, filters: unknown[] = []): Promise<string | null> {
    const rows = await this.resource<{ name: string }>(doctype, {
      filters: JSON.stringify(filters),
      limit_page_length: "1",
    });
    return rows[0]?.name ?? null;
  }

  async findOrCreateCustomer(input: CustomerInput): Promise<string> {
    // dedupe guests by email (used as the Customer name)
    const existing = await this.firstName("Customer", [["customer_name", "=", input.email]]);
    if (existing) return existing;
    const doc: Record<string, unknown> = {
      customer_name: input.email,
      customer_type: "Individual",
    };
    const group = await this.firstName("Customer Group", [["is_group", "=", 0]]);
    const territory = await this.firstName("Territory", [["is_group", "=", 0]]);
    if (group) doc.customer_group = group;
    if (territory) doc.territory = territory;
    return this.create("Customer", doc);
  }

  private async tryCreateAddress(
    customer: string,
    s: NonNullable<SalesOrderInput["shipping"]>,
  ): Promise<string | null> {
    try {
      return await this.create("Address", {
        address_title: s.name || customer,
        address_type: "Shipping",
        address_line1: s.line1,
        city: s.city,
        state: s.state,
        pincode: s.postalCode,
        country: s.country || "United States",
        links: [{ link_doctype: "Customer", link_name: customer }],
      });
    } catch {
      return null; // best-effort; never block the order on the address
    }
  }

  async createSalesOrder(input: SalesOrderInput): Promise<string> {
    const company = await this.firstName("Company");
    if (!company) throw new Error("No Company in ERPNext (complete the Setup Wizard).");
    const today = new Date().toISOString().slice(0, 10);
    const delivery = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

    const doc: Record<string, unknown> = {
      customer: input.customer,
      company,
      currency: input.currency,
      selling_price_list: input.priceList,
      order_type: "Sales",
      transaction_date: today,
      delivery_date: delivery,
      docstatus: 0, // DRAFT — unpaid; Step 2 (payment) submits it
      items: input.items.map((i) => ({
        item_code: i.itemCode,
        qty: i.qty,
        rate: i.rate,
        delivery_date: delivery,
      })),
    };

    if (input.shipping) {
      const addr = await this.tryCreateAddress(input.customer, input.shipping);
      if (addr) {
        doc.customer_address = addr;
        doc.shipping_address_name = addr;
      }
    }

    return this.create("Sales Order", doc);
  }
}
