import "server-only";
import { readRawCart, writeRawCart } from "./store";
import { getProductSummaries } from "@/lib/catalog/service";
import { formatMoney } from "@/lib/format";
import type { Money, ProductSummary } from "@/lib/catalog/dto";
import type { Cart, CartLine, RawCart } from "./dto";

const FREE_SHIP_THRESHOLD = 75;

function money(amount: number, currency: string): Money {
  return { amount, currency, formatted: formatMoney(amount, currency) };
}

export async function getCart(priceList?: string): Promise<Cart> {
  return hydrate(await readRawCart(), priceList);
}

export async function addToCart(productId: string, qty = 1, priceList?: string): Promise<Cart> {
  const raw = await readRawCart();
  const existing = raw.items.find((i) => i.id === productId);
  if (existing) existing.qty += qty;
  else raw.items.push({ id: productId, qty });
  return persist(raw, priceList);
}

export async function setQty(productId: string, qty: number, priceList?: string): Promise<Cart> {
  const raw = await readRawCart();
  if (qty <= 0) {
    raw.items = raw.items.filter((i) => i.id !== productId);
  } else {
    const existing = raw.items.find((i) => i.id === productId);
    if (existing) existing.qty = qty;
    else raw.items.push({ id: productId, qty });
  }
  return persist(raw, priceList);
}

export async function removeFromCart(productId: string, priceList?: string): Promise<Cart> {
  const raw = await readRawCart();
  raw.items = raw.items.filter((i) => i.id !== productId);
  await writeRawCart(raw);
  return hydrate(raw, priceList);
}

export async function clearCart(priceList?: string): Promise<Cart> {
  const raw: RawCart = { v: 1, items: [] };
  await writeRawCart(raw);
  return hydrate(raw, priceList);
}

/** Clamp quantities to live stock, drop unknown/out-of-stock items, persist, hydrate. */
async function persist(raw: RawCart, priceList?: string): Promise<Cart> {
  const ids = raw.items.map((i) => i.id);
  const products = ids.length ? await getProductSummaries(ids, priceList) : [];
  const avail = new Map(products.map((p) => [p.id, p.availableQty]));
  raw.items = raw.items
    .map((i) => ({ id: i.id, qty: Math.min(i.qty, avail.get(i.id) ?? 0) }))
    .filter((i) => i.qty > 0);
  await writeRawCart(raw);
  return hydrate(raw, priceList, products);
}

async function hydrate(
  raw: RawCart,
  priceList?: string,
  preload?: ProductSummary[],
): Promise<Cart> {
  const ids = raw.items.map((i) => i.id);
  const products = preload ?? (ids.length ? await getProductSummaries(ids, priceList) : []);
  const byId = new Map(products.map((p) => [p.id, p]));
  const currency = products[0]?.price.currency ?? "USD";

  const items: CartLine[] = [];
  for (const it of raw.items) {
    const p = byId.get(it.id);
    if (!p) continue; // unpublished -> drop
    const qty = Math.min(it.qty, Math.max(0, p.availableQty));
    if (qty <= 0) continue; // out of stock -> drop
    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.image,
      unitPrice: p.price,
      qty,
      lineTotal: money(p.price.amount * qty, p.price.currency),
      availableQty: p.availableQty,
      inStock: p.inStock,
    });
  }

  const subtotal = items.reduce((s, l) => s + l.lineTotal.amount, 0);
  const itemCount = items.reduce((s, l) => s + l.qty, 0);
  return {
    items,
    itemCount,
    subtotal: money(subtotal, currency),
    currency,
    freeShipThreshold: FREE_SHIP_THRESHOLD,
    freeShipRemaining: Math.max(0, FREE_SHIP_THRESHOLD - subtotal),
  };
}
