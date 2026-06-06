import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import CartButton from "@/components/cart/CartButton";

/* Placeholder product data — will come from ERPNext (Website Item) via the BFF later. */
const PRODUCTS = [
  { name: "Linen Throw Blanket", category: "Home", price: "$68", tone: "from-emerald-200 to-emerald-400", stock: "In stock" },
  { name: "Stoneware Mug Set", category: "Kitchen", price: "$42", tone: "from-amber-200 to-amber-400", stock: "Only 3 left" },
  { name: "Cotton Lounge Tee", category: "Apparel", price: "$34", tone: "from-teal-200 to-emerald-300", stock: "In stock" },
  { name: "Woven Storage Basket", category: "Home", price: "$56", tone: "from-orange-200 to-amber-300", stock: "In stock" },
];

function Badge({ label, variant }: { label: string; variant: "ok" | "low" }) {
  const cls =
    variant === "ok"
      ? "bg-primary-subtle text-primary"
      : "bg-warning-bg text-warning";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${cls} px-2.5 py-1 text-xs font-medium`}>
      {label}
    </span>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div>
      <div className={`h-12 w-full rounded-lg ${className}`} />
      <span className="mt-1 block text-text-muted">{label}</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-fill text-on-primary font-bold">
            S
          </span>
          <span className="text-lg font-semibold">Store</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-text-muted sm:flex">
          <a className="hover:text-text" href="#">Shop</a>
          <a className="hover:text-text" href="#">Collections</a>
          <a className="hover:text-text" href="#">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CartButton />
        </div>
      </header>

      {/* Hero */}
      <section className="mt-10 grid items-center gap-8 rounded-2xl bg-surface p-8 shadow-md sm:grid-cols-2 sm:p-12">
        <div>
          <Badge label="New season" variant="ok" />
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Fresh goods for home &amp; living
          </h1>
          <p className="mt-4 max-w-md text-lg text-text-muted">
            A vibrant, easy-on-the-eyes storefront — powered by ERPNext. This page is a
            live preview of the design system.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="rounded-full bg-primary-fill px-6 py-3 font-semibold text-on-primary shadow-sm transition-colors duration-base ease-standard hover:bg-primary-hover">
              Shop now
            </Link>
            <Link href="/shop" className="rounded-full border border-border bg-surface px-6 py-3 font-semibold text-text transition-colors duration-base ease-standard hover:bg-surface-2">
              Browse collections
            </Link>
          </div>
        </div>
        <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-emerald-300 via-teal-300 to-amber-200" />
      </section>

      {/* Trust strip */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-surface-2 px-5 py-3 text-sm text-text-muted">
        <span>✓ Free shipping over $75</span>
        <span>✓ 30-day easy returns</span>
        <span>✓ Secure checkout</span>
      </div>

      {/* Product grid */}
      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Best sellers</h2>
          <a className="text-sm font-medium text-primary hover:underline" href="#">
            View all →
          </a>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <article
              key={p.name}
              className="group overflow-hidden rounded-xl bg-surface shadow-md transition-transform duration-base ease-standard hover:-translate-y-0.5"
            >
              <div className={`aspect-square w-full bg-gradient-to-br ${p.tone}`} />
              <div className="p-4">
                <p className="text-sm text-text-muted">{p.category}</p>
                <h3 className="mt-0.5 font-semibold">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold">{p.price}</span>
                  <Badge
                    label={p.stock}
                    variant={p.stock === "In stock" ? "ok" : "low"}
                  />
                </div>
                <button className="mt-3 w-full rounded-full bg-primary-fill px-4 py-2 text-sm font-semibold text-on-primary transition-colors duration-base ease-standard hover:bg-primary-hover">
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Design-system reference */}
      <section className="mt-14 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">Design tokens — live</h2>
        <p className="mt-1 text-sm text-text-muted">
          Emerald &amp; Clay · soft &amp; friendly · Inter. Toggle the theme (top-right) to
          see dark mode swap.
        </p>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-text-muted">Buttons</p>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-full bg-primary-fill px-5 py-2.5 font-semibold text-on-primary hover:bg-primary-hover">Primary</button>
              <button className="rounded-full bg-secondary px-5 py-2.5 font-semibold text-on-secondary hover:bg-secondary-hover">Secondary</button>
              <button className="rounded-full border border-border bg-surface px-5 py-2.5 font-semibold hover:bg-surface-2">Ghost</button>
            </div>

            <p className="mb-2 mt-5 text-sm font-medium text-text-muted">Input</p>
            <input
              placeholder="you@email.com"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 placeholder:text-text-subtle focus:border-primary"
            />

            <p className="mb-2 mt-5 text-sm font-medium text-text-muted">Status</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">Success</span>
              <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-medium text-warning">Warning</span>
              <span className="rounded-full bg-error-bg px-2.5 py-1 text-xs font-medium text-error">Error</span>
              <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info">Info</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text-muted">Palette</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Swatch className="bg-primary" label="primary" />
              <Swatch className="bg-primary-fill" label="primary-fill" />
              <Swatch className="bg-secondary" label="secondary" />
              <Swatch className="bg-bg border border-border" label="bg" />
              <Swatch className="bg-surface-2 border border-border" label="surface-2" />
              <Swatch className="bg-text" label="text" />
            </div>

            <p className="mb-2 mt-5 text-sm font-medium text-text-muted">Radius &amp; elevation</p>
            <div className="flex items-end gap-3">
              <div className="h-16 w-16 rounded-sm bg-surface-2 shadow-sm" />
              <div className="h-16 w-16 rounded-lg bg-surface-2 shadow-md" />
              <div className="h-16 w-16 rounded-xl bg-surface-2 shadow-lg" />
              <div className="h-16 w-16 rounded-full bg-primary-subtle" />
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-14 border-t border-border py-8 text-center text-sm text-text-muted">
        Store · scaffolded preview · next step → catalog wired to ERPNext
      </footer>
    </div>
  );
}
