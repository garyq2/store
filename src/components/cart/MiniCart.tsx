"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { gradientFor, formatMoney } from "@/lib/format";

export default function MiniCart() {
  const { cart, open, closeCart, setQty, remove } = useCart();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeCart]);

  const progress = cart
    ? Math.min(100, (cart.subtotal.amount / cart.freeShipThreshold) * 100)
    : 0;

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-drawer ${open ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-[var(--color-overlay)] transition-opacity duration-base ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-surface shadow-lg transition-transform duration-base ease-emphasized ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Your cart{cart ? ` (${cart.itemCount})` : ""}</h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2"
          >
            ✕
          </button>
        </header>

        {!cart || cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-text-muted">
            <p>Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="rounded-full bg-primary-fill px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {cart.items.map((l) => (
                <li key={l.productId} className="flex gap-3 py-4">
                  <div className={`h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br ${gradientFor(l.productId)}`} />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link
                        href={`/products/${l.slug}`}
                        onClick={closeCart}
                        className="text-sm font-medium hover:underline"
                      >
                        {l.name}
                      </Link>
                      <button
                        onClick={() => remove(l.productId)}
                        aria-label={`Remove ${l.name}`}
                        className="text-text-subtle hover:text-error"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty(l.productId, l.qty - 1)}
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-surface-2"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">{l.qty}</span>
                        <button
                          onClick={() => setQty(l.productId, l.qty + 1)}
                          disabled={l.qty >= l.availableQty}
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-surface-2 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{l.lineTotal.formatted}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-border p-5">
              {cart.freeShipRemaining > 0 ? (
                <p className="mb-2 text-xs text-text-muted">
                  Add {formatMoney(cart.freeShipRemaining, cart.currency)} more for free shipping
                </p>
              ) : (
                <p className="mb-2 text-xs text-success">✓ You’ve unlocked free shipping</p>
              )}
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-primary-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-semibold">{cart.subtotal.formatted}</span>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block rounded-full bg-primary-fill px-5 py-3 text-center font-semibold text-on-primary hover:bg-primary-hover"
              >
                Checkout
              </Link>
              <button
                onClick={closeCart}
                className="mt-2 w-full text-center text-sm text-text-muted hover:text-text"
              >
                Keep shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
