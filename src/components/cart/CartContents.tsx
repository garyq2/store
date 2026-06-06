"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { gradientFor, formatMoney } from "@/lib/format";

export default function CartContents() {
  const { cart, setQty, remove } = useCart();

  if (!cart) {
    return <p className="mt-6 text-text-muted">Loading…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
        <p>Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block rounded-full bg-primary-fill px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {cart.items.map((l) => (
          <li key={l.productId} className="flex gap-4 p-4">
            <Link href={`/products/${l.slug}`} className="shrink-0">
              <div className={`h-20 w-20 rounded-lg bg-gradient-to-br ${gradientFor(l.productId)}`} />
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-2">
                <Link href={`/products/${l.slug}`} className="font-medium hover:underline">
                  {l.name}
                </Link>
                <span className="font-semibold">{l.lineTotal.formatted}</span>
              </div>
              <p className="text-sm text-text-muted">{l.unitPrice.formatted} each</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(l.productId, l.qty - 1)}
                    aria-label="Decrease quantity"
                    className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-surface-2"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{l.qty}</span>
                  <button
                    onClick={() => setQty(l.productId, l.qty + 1)}
                    disabled={l.qty >= l.availableQty}
                    aria-label="Increase quantity"
                    className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-surface-2 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(l.productId)}
                  className="text-sm text-text-muted hover:text-error"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Order summary</h2>
        {cart.freeShipRemaining > 0 ? (
          <p className="mt-2 text-xs text-text-muted">
            Add {formatMoney(cart.freeShipRemaining, cart.currency)} more for free shipping
          </p>
        ) : (
          <p className="mt-2 text-xs text-success">✓ Free shipping unlocked</p>
        )}
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-text-muted">Subtotal</span>
          <span className="font-semibold">{cart.subtotal.formatted}</span>
        </div>
        <p className="mt-1 text-xs text-text-subtle">Shipping &amp; tax calculated at checkout.</p>
        <button
          className="mt-5 w-full cursor-not-allowed rounded-full bg-primary-fill px-5 py-3 font-semibold text-on-primary opacity-90"
          title="Checkout is built in the next phase"
        >
          Checkout →
        </button>
        <Link
          href="/shop"
          className="mt-2 block text-center text-sm text-text-muted hover:text-text"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
