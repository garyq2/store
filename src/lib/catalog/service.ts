import "server-only";
import { getDataSource, config } from "@/lib/erpnext/source";
import type { RawItem, RawItemPrice, RawBin } from "@/lib/erpnext/types";
import { formatMoney } from "@/lib/format";
import type {
  CatalogQuery,
  CatalogResult,
  Money,
  ProductDetail,
  ProductSummary,
  SortKey,
} from "./dto";

const DEFAULT_PAGE_SIZE = 6;

function money(rate: number, currency: string): Money {
  return { amount: rate, currency, formatted: formatMoney(rate, currency) };
}

/** ERPNext Item.image may be a relative path on the ERP host; make it absolute. */
function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return config.erpnextUrl ? `${config.erpnextUrl}${path}` : path;
}

function priceFor(itemCode: string, prices: RawItemPrice[], priceList: string): Money | null {
  const p =
    prices.find((x) => x.item_code === itemCode && x.price_list === priceList) ??
    prices.find((x) => x.item_code === itemCode);
  return p ? money(p.price_list_rate, p.currency) : null;
}

function stockBadge(qty: number): { inStock: boolean; badge: string | null } {
  if (qty <= 0) return { inStock: false, badge: "Sold out" };
  if (qty <= 5) return { inStock: true, badge: `Only ${qty} left` };
  return { inStock: true, badge: null };
}

function toSummary(
  item: RawItem,
  prices: RawItemPrice[],
  bins: RawBin[],
  priceList: string,
): ProductSummary {
  const qty = bins.find((b) => b.item_code === item.item_code)?.actual_qty ?? 0;
  const { inStock, badge } = stockBadge(qty);
  return {
    id: item.item_code,
    slug: item.item_code, // Item has no route field; item_code is the stable slug
    name: item.item_name,
    category: item.item_group,
    image: imageUrl(item.image),
    price: priceFor(item.item_code, prices, priceList) ?? money(0, "USD"),
    inStock,
    availableQty: qty,
    badge,
  };
}

function sortItems(items: RawItem[], prices: RawItemPrice[], sort: SortKey, priceList: string) {
  const rate = (code: string) =>
    priceFor(code, prices, priceList)?.amount ?? Number.POSITIVE_INFINITY;
  const copy = [...items];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => rate(a.item_code) - rate(b.item_code));
    case "price-desc":
      return copy.sort((a, b) => rate(b.item_code) - rate(a.item_code));
    case "name":
      return copy.sort((a, b) => a.item_name.localeCompare(b.item_name));
    default:
      return copy; // "featured" = source order
  }
}

export async function getCatalog(query: CatalogQuery = {}): Promise<CatalogResult> {
  const ds = await getDataSource();
  const priceList = query.priceList ?? config.defaultPriceList;
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE);

  let items = await ds.listItems();

  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter((i) => i.item_name.toLowerCase().includes(q));
  }

  const counts = new Map<string, number>();
  for (const i of items) counts.set(i.item_group, (counts.get(i.item_group) ?? 0) + 1);
  const categories = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));

  if (query.category) items = items.filter((i) => i.item_group === query.category);

  const allCodes = items.map((i) => i.item_code);
  const sortPrices = query.sort?.startsWith("price")
    ? await ds.getItemPrices(allCodes, priceList)
    : [];
  items = sortItems(items, sortPrices, query.sort ?? "featured", priceList);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = items.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const codes = pageItems.map((i) => i.item_code);
  const [prices, bins] = await Promise.all([
    ds.getItemPrices(codes, priceList),
    ds.getStockLevels(codes),
  ]);

  return {
    items: pageItems.map((i) => toSummary(i, prices, bins, priceList)),
    total,
    page,
    pageSize,
    pageCount,
    categories,
  };
}

export async function getProductBySlug(
  slug: string,
  priceList = config.defaultPriceList,
): Promise<ProductDetail | null> {
  const ds = await getDataSource();
  const item = await ds.getItemByCode(slug);
  if (!item) return null;

  const [retailPrices, wholesalePrices, bins] = await Promise.all([
    ds.getItemPrices([item.item_code], priceList),
    ds.getItemPrices([item.item_code], config.wholesalePriceList),
    ds.getStockLevels([item.item_code]),
  ]);

  const summary = toSummary(item, retailPrices, bins, priceList);
  const desc = item.description ?? "";
  return {
    ...summary,
    shortDescription: desc,
    longDescription: desc,
    gallery: [],
    specs: [],
    wholesalePrice: priceFor(item.item_code, wholesalePrices, config.wholesalePriceList),
  };
}

/** Fetch product summaries for a set of item codes, preserving input order. Used by the cart. */
export async function getProductSummaries(
  ids: string[],
  priceList = config.defaultPriceList,
): Promise<ProductSummary[]> {
  if (ids.length === 0) return [];
  const ds = await getDataSource();
  const all = await ds.listItems();
  const wanted = new Set(ids);
  const items = all.filter((i) => wanted.has(i.item_code));
  const codes = items.map((i) => i.item_code);
  const [prices, bins] = await Promise.all([
    ds.getItemPrices(codes, priceList),
    ds.getStockLevels(codes),
  ]);
  const byCode = new Map(items.map((i) => [i.item_code, i]));
  return ids
    .map((id) => byCode.get(id))
    .filter((i): i is RawItem => Boolean(i))
    .map((i) => toSummary(i, prices, bins, priceList));
}
