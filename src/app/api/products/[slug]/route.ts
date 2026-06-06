import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/catalog/service";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const priceList = searchParams.get("priceList") ?? undefined;

  const product = await getProductBySlug(slug, priceList);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
