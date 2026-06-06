import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog/service";
import type { SortKey } from "@/lib/catalog/dto";

export const metadata = { title: "Shop — Store" };

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "name", label: "Name" },
];

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const category = str(sp.category);
  const q = str(sp.q);
  const sort = (str(sp.sort) as SortKey) ?? "featured";
  const page = Number(str(sp.page) ?? "1") || 1;

  const result = await getCatalog({ category, q, sort, page });

  const base: Record<string, string | undefined> = {
    category,
    q,
    sort: sort === "featured" ? undefined : sort,
  };
  const hrefWith = (patch: Record<string, string | undefined>) => {
    const merged = { ...base, ...patch };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
    const s = usp.toString();
    return s ? `/shop?${s}` : "/shop";
  };
  const linkCls = (active: boolean) =>
    active ? "font-semibold text-primary" : "text-text hover:text-primary";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
            <p className="text-sm text-text-muted">
              {result.total} item{result.total === 1 ? "" : "s"}
              {category ? ` in ${category}` : ""}
              {q ? ` matching “${q}”` : ""}
            </p>
          </div>
          <form action="/shop" className="flex gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search products"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm placeholder:text-text-subtle focus:border-primary"
            />
            <button className="rounded-full bg-primary-fill px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover">
              Search
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
          <aside className="space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text-muted">Category</h2>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link className={linkCls(!category)} href={hrefWith({ category: undefined, page: undefined })}>
                    All
                  </Link>
                </li>
                {result.categories.map((c) => (
                  <li key={c.value}>
                    <Link
                      className={linkCls(category === c.value)}
                      href={hrefWith({ category: c.value, page: undefined })}
                    >
                      {c.value} <span className="text-text-subtle">({c.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text-muted">Sort</h2>
              <ul className="space-y-1 text-sm">
                {SORTS.map((s) => (
                  <li key={s.key}>
                    <Link
                      className={linkCls(sort === s.key)}
                      href={hrefWith({ sort: s.key === "featured" ? undefined : s.key, page: undefined })}
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section>
            {result.items.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
                No products match.{" "}
                <Link className="text-primary hover:underline" href="/shop">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                {result.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {result.pageCount > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
                {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={hrefWith({ page: n === 1 ? undefined : String(n) })}
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      n === result.page
                        ? "bg-primary-fill text-on-primary"
                        : "border border-border hover:bg-surface-2"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
