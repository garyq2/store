"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Cart } from "@/lib/cart/dto";
import MiniCart from "./MiniCart";

interface CartContextValue {
  cart: Cart | null;
  busy: boolean;
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (productId: string, qty?: number) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then(setCart)
      .catch(() => {});
  }, []);

  const post = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) setCart((await res.json()) as Cart);
    } finally {
      setBusy(false);
    }
  }, []);

  const add = useCallback(
    async (productId: string, qty = 1) => {
      await post({ action: "add", productId, qty });
      setOpen(true);
    },
    [post],
  );
  const setQty = useCallback(
    async (productId: string, qty: number) => {
      await post({ action: "set", productId, qty });
    },
    [post],
  );
  const remove = useCallback(
    async (productId: string) => {
      await post({ action: "remove", productId });
    },
    [post],
  );
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) setCart((await res.json()) as Cart);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        busy,
        open,
        openCart: () => setOpen(true),
        closeCart: () => setOpen(false),
        add,
        setQty,
        remove,
        refresh,
      }}
    >
      {children}
      <MiniCart />
    </CartContext.Provider>
  );
}
