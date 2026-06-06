"use client";

import { useState } from "react";
import { useCart } from "./cart/CartProvider";

export default function AddToCartButton({
  productId,
  disabled,
  className,
}: {
  productId: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await add(productId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} className={className}>
      {disabled ? "Sold out" : added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
