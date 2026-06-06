"use client";

import { useCart } from "./CartProvider";

export default function CartButton() {
  const { cart, openCart } = useCart();
  const count = cart?.itemCount ?? 0;
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
      className="rounded-full bg-primary-fill px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition-colors duration-base ease-standard hover:bg-primary-hover"
    >
      Cart · {count}
    </button>
  );
}
