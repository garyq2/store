import { NextResponse } from "next/server";
import {
  getCart,
  addToCart,
  setQty,
  removeFromCart,
  clearCart,
} from "@/lib/cart/service";

// Reads/writes the cart cookie -> always dynamic, never cached.
export async function GET() {
  return NextResponse.json(await getCart());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    action?: "add" | "set" | "remove" | "clear";
    productId?: string;
    qty?: number;
  } | null;

  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const needsId = () =>
    NextResponse.json({ error: "Missing productId" }, { status: 400 });

  switch (body.action) {
    case "add":
      if (!body.productId) return needsId();
      return NextResponse.json(await addToCart(body.productId, body.qty ?? 1));
    case "set":
      if (!body.productId || body.qty == null) return needsId();
      return NextResponse.json(await setQty(body.productId, body.qty));
    case "remove":
      if (!body.productId) return needsId();
      return NextResponse.json(await removeFromCart(body.productId));
    case "clear":
      return NextResponse.json(await clearCart());
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
