import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import AddToCartButton from "@/components/AddToCartButton";
import { getCatalog, getProductBySlug } from "@/lib/catalog/service";
import { gradientFor } from "@/lib/format";

export async function generateStaticParams() {
  const { items } = await getCatalog({ pageSize: 1000 });
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found — Store" };
  return { title: `${product.name} — Store`, description: product.shortDescription };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <nav className="text-sm text-text-muted">
          <Link href="/shop" className="hover:text-text">Shop</Link>
          {" / "}
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-text"
          >
            {product.category}
          </Link>
          {" / "}
          <span className="text-text">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          {/* gallery */}
          <div>
            <div className={`aspect-square w-full rounded-xl bg-gradient-to-br ${gradientFor(product.id)}`} />
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg bg-gradient-to-br ${gradientFor(`${product.id}-${i}`)}`}
                />
              ))}
            </div>
          </div>

          {/* info */}
          <div>
            <p className="text-sm text-text-muted">{product.category}</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{product.name}</h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">{product.price.formatted}</span>
              {product.wholesalePrice && (
                <span className="text-sm text-text-muted">
                  Wholesale {product.wholesalePrice.formatted}
                </span>
              )}
            </div>

            <div className="mt-4">
              {product.inStock ? (
                <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
                  ✓ In stock{product.badge ? ` · ${product.badge}` : ""}
                </span>
              ) : (
                <span className="rounded-full bg-error-bg px-2.5 py-1 text-xs font-medium text-error">
                  Sold out
                </span>
              )}
            </div>

            <p className="mt-5 text-text-muted">{product.shortDescription}</p>

            <AddToCartButton
              productId={product.id}
              name={product.name}
              disabled={!product.inStock}
              className="mt-6 w-full rounded-full bg-primary-fill px-6 py-3 font-semibold text-on-primary shadow-sm transition-colors duration-base ease-standard hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
            />

            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-semibold">Details</h2>
              <p className="mt-2 text-sm text-text-muted">{product.longDescription}</p>
              {product.specs.length > 0 && (
                <dl className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {product.specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                      <dt className="text-text-muted">{s.label}</dt>
                      <dd className="text-text">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
