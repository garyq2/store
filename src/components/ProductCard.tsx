import Link from "next/link";
import type { ProductSummary } from "@/lib/catalog/dto";
import { gradientFor } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";

export default function ProductCard({ product }: { product: ProductSummary }) {
  const href = `/products/${product.slug}`;
  return (
    <article className="group overflow-hidden rounded-xl bg-surface shadow-md transition-transform duration-base ease-standard hover:-translate-y-0.5">
      <Link href={href} className="block">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className={`aspect-square w-full bg-gradient-to-br ${gradientFor(product.id)}`} />
        )}
      </Link>
      <div className="p-4">
        <p className="text-sm text-text-muted">{product.category}</p>
        <Link href={href} className="mt-0.5 block font-semibold hover:underline">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">{product.price.formatted}</span>
          {product.badge && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                product.inStock ? "bg-warning-bg text-warning" : "bg-error-bg text-error"
              }`}
            >
              {product.badge}
            </span>
          )}
        </div>
        <AddToCartButton
          productId={product.id}
          name={product.name}
          disabled={!product.inStock}
          className="mt-3 w-full rounded-full bg-primary-fill px-4 py-2 text-sm font-semibold text-on-primary transition-colors duration-base ease-standard hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </article>
  );
}
