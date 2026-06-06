/**
 * Shared formatting helpers — safe for both server and client (no secrets, no
 * server-only imports).
 */

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

/** Deterministic on-brand gradient for products without an image. */
const GRADIENTS = [
  "from-emerald-200 to-emerald-400",
  "from-amber-200 to-amber-400",
  "from-teal-200 to-emerald-300",
  "from-orange-200 to-amber-300",
  "from-lime-200 to-emerald-300",
  "from-green-200 to-teal-300",
  "from-yellow-200 to-amber-300",
  "from-amber-100 to-orange-300",
];

export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}
