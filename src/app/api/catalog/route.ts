import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/service";
import type { SortKey } from "@/lib/catalog/dto";

// BFF endpoint: clean catalog DTOs for client-side use (search-as-you-type, etc.).
// ERPNext credentials stay server-side in the data source.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const num = (k: string) =>
    searchParams.get(k) ? Number(searchParams.get(k)) : undefined;

  const result = await getCatalog({
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sort: (searchParams.get("sort") as SortKey) ?? undefined,
    page: num("page"),
    pageSize: num("pageSize"),
    priceList: searchParams.get("priceList") ?? undefined,
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
