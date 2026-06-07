import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Order confirmed — Store" };

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ order: string }>;
}) {
  const { order } = await params;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-subtle text-primary text-2xl">
          ✓
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Thank you!</h1>
        <p className="mt-2 text-text-muted">
          Your order <span className="font-semibold text-text">{order}</span> has been
          received and created in ERPNext.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-left text-sm text-text-muted">
          <p className="font-semibold text-text">What happens next</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your order is recorded as a draft Sales Order.</li>
            <li>Payment will be collected at checkout once that goes live.</li>
            <li>You&apos;ll get a confirmation email when fulfillment begins.</li>
          </ul>
        </div>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-full bg-primary-fill px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover"
        >
          Continue shopping
        </Link>
      </main>
    </>
  );
}
