import "server-only";
import { cookies } from "next/headers";
import type { RawCart } from "./dto";

/**
 * Cart persistence. Cookie-backed for now (no external infra, survives restarts,
 * fine for small carts < ~4KB). Production swap: store a cart id in the cookie and
 * keep the RawCart in Redis — only this module changes.
 */

const COOKIE = "store_cart";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const EMPTY: RawCart = { v: 1, items: [] };

export async function readRawCart(): Promise<RawCart> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 1 && Array.isArray(parsed.items)) return parsed as RawCart;
  } catch {
    /* corrupt cookie -> treat as empty */
  }
  return { ...EMPTY };
}

export async function writeRawCart(cart: RawCart): Promise<void> {
  (await cookies()).set(COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
