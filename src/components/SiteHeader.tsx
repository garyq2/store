import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import CartButton from "./cart/CartButton";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-fill font-bold text-on-primary">
            S
          </span>
          <span className="text-lg font-semibold">Store</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-text-muted sm:flex">
          <Link className="hover:text-text" href="/shop">Shop</Link>
          <a className="hover:text-text" href="#">Collections</a>
          <a className="hover:text-text" href="#">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
