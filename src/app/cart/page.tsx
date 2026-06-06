import SiteHeader from "@/components/SiteHeader";
import CartContents from "@/components/cart/CartContents";

export const metadata = { title: "Cart — Store" };

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
        <CartContents />
      </main>
    </>
  );
}
