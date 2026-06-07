"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

const FIELDS = [
  { key: "name", label: "Full name", required: true, type: "text", auto: "name" },
  { key: "email", label: "Email", required: true, type: "email", auto: "email" },
  { key: "address1", label: "Address", required: true, type: "text", auto: "address-line1" },
  { key: "city", label: "City", required: false, type: "text", auto: "address-level2" },
  { key: "state", label: "State", required: false, type: "text", auto: "address-level1" },
  { key: "postalCode", label: "ZIP", required: false, type: "text", auto: "postal-code" },
] as const;

type FormState = Record<string, string>;

export default function CheckoutForm() {
  const { cart, refresh } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cart) return <p className="mt-6 text-text-muted">Loading…</p>;

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed. Please try again.");
        return;
      }
      await refresh(); // cart was cleared server-side; sync the badge/drawer
      router.push(`/checkout/confirmation/${encodeURIComponent(data.salesOrder)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* details */}
      <div className="space-y-4">
        <h2 className="font-semibold">Contact &amp; shipping</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className={f.key === "address1" ? "sm:col-span-2" : ""}>
              <span className="mb-1 block text-sm text-text-muted">
                {f.label}
                {f.required && <span className="text-error"> *</span>}
              </span>
              <input
                type={f.type}
                autoComplete={f.auto}
                required={f.required}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 placeholder:text-text-subtle focus:border-primary"
              />
            </label>
          ))}
        </div>
        {error && (
          <p className="rounded-lg bg-error-bg px-4 py-3 text-sm text-error">{error}</p>
        )}
      </div>

      {/* summary */}
      <aside className="h-fit rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {cart.items.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span className="text-text-muted">
                {l.name} × {l.qty}
              </span>
              <span>{l.lineTotal.formatted}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3">
          <span className="text-text-muted">Subtotal</span>
          <span className="font-semibold">{cart.subtotal.formatted}</span>
        </div>
        <p className="mt-1 text-xs text-text-subtle">
          Shipping &amp; tax calculated later. Payment added before launch.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-primary-fill px-5 py-3 font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Placing order…" : "Place order"}
        </button>
        <p className="mt-2 text-center text-xs text-text-subtle">
          Creates a draft order in ERPNext (no payment yet).
        </p>
      </aside>
    </form>
  );
}
