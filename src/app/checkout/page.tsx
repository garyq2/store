import SiteHeader from "@/components/SiteHeader";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout — Store" };

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <CheckoutForm />
      </main>
    </>
  );
}
