import { NextResponse } from "next/server";
import { placeOrder } from "@/lib/orders/service";
import type { CheckoutInput } from "@/lib/orders/dto";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<CheckoutInput> | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim();
  const address1 = body?.address1?.trim();
  if (!name || !email || !address1) {
    return NextResponse.json(
      { error: "Name, email, and address are required." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  try {
    const order = await placeOrder({
      name,
      email,
      address1,
      city: body?.city?.trim(),
      state: body?.state?.trim(),
      postalCode: body?.postalCode?.trim(),
      country: body?.country?.trim() || "United States",
    });
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 400 },
    );
  }
}
