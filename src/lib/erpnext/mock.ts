import "server-only";
import type { CatalogDataSource } from "./source";
import type { RawItem, RawItemPrice, RawBin } from "./types";

/**
 * In-memory mock shaped like ERPNext `Item` / `Item Price` / `Bin` responses, so swapping
 * to the live client (live.ts) requires zero changes upstream. Lifestyle / apparel / home
 * goods to match the chosen catalog vibe.
 */

const ITEMS: RawItem[] = [
  mk("LIN-BLNK", "Linen Throw Blanket",  "Home",    "Stonewashed European linen throw, 130x170cm."),
  mk("MUG-SET4", "Stoneware Mug Set",     "Kitchen", "Set of 4 hand-glazed stoneware mugs, 350ml."),
  mk("TEE-LNG",  "Cotton Lounge Tee",     "Apparel", "Relaxed organic-cotton tee, garment dyed."),
  mk("BSK-WVN",  "Woven Storage Basket",  "Home",    "Handwoven seagrass basket with handles."),
  mk("CNDL-SOY", "Soy Candle - Cedar",    "Home",    "Hand-poured soy candle, cedar & amber, 50hr burn."),
  mk("APRN-CHF", "Chef's Linen Apron",    "Kitchen", "Cross-back linen apron with pockets."),
  mk("SOCK-WL",  "Merino Wool Socks",     "Apparel", "Cushioned merino crew socks, 2-pack."),
  mk("PLNT-POT", "Ceramic Plant Pot",     "Home",    "Matte ceramic pot with drainage tray, 16cm."),
];

const RETAIL: Record<string, number> = {
  "LIN-BLNK": 68, "MUG-SET4": 42, "TEE-LNG": 34, "BSK-WVN": 56,
  "CNDL-SOY": 28, "APRN-CHF": 48, "SOCK-WL": 22, "PLNT-POT": 26,
};

const PRICES: RawItemPrice[] = Object.entries(RETAIL).flatMap(([code, retail]) => [
  { item_code: code, price_list: "Retail", currency: "USD", price_list_rate: retail },
  { item_code: code, price_list: "Wholesale", currency: "USD", price_list_rate: Math.round(retail * 0.75 * 100) / 100 },
]);

const STOCK: Record<string, number> = {
  "LIN-BLNK": 22, "MUG-SET4": 3, "TEE-LNG": 48, "BSK-WVN": 15,
  "CNDL-SOY": 60, "APRN-CHF": 0, "SOCK-WL": 80, "PLNT-POT": 9,
};

const BINS: RawBin[] = Object.entries(STOCK).map(([code, qty]) => ({
  item_code: code, warehouse: "Main - S", actual_qty: qty, projected_qty: qty,
}));

function mk(code: string, name: string, group: string, desc: string): RawItem {
  return {
    name: code,
    item_code: code,
    item_name: name,
    item_group: group,
    brand: "Store",
    image: null, // storefront falls back to a generated gradient
    description: `${desc} Thoughtfully made and built to last.`,
    stock_uom: "Nos",
    is_stock_item: 1,
    is_sales_item: 1,
    disabled: 0,
  };
}

export class MockDataSource implements CatalogDataSource {
  async listItems(): Promise<RawItem[]> {
    return ITEMS.filter((i) => i.is_sales_item === 1 && i.disabled === 0);
  }

  async getItemByCode(itemCode: string): Promise<RawItem | null> {
    return ITEMS.find((i) => i.item_code === itemCode && i.disabled === 0) ?? null;
  }

  async getItemPrices(itemCodes: string[], priceList: string): Promise<RawItemPrice[]> {
    const set = new Set(itemCodes);
    return PRICES.filter((p) => set.has(p.item_code) && p.price_list === priceList);
  }

  async getStockLevels(itemCodes: string[]): Promise<RawBin[]> {
    const set = new Set(itemCodes);
    return BINS.filter((b) => set.has(b.item_code));
  }
}
