import { Flower2 } from "lucide-react";

import { Price } from "@/components/site/Price";
import { addToCart } from "@/lib/cart";
import type { StorefrontProduct } from "@/lib/database.types";
import { formatPriceRub, publicImageUrl } from "@/lib/product-image";
import { useTenant } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift";

type ProductCardProps = {
  product: StorefrontProduct;
  delayMs?: number;
  onCustomOrder?: (product: StorefrontProduct) => void;
  /** Wide featured card (e.g. individual bouquet spanning 2 grid columns). */
  wide?: boolean;
  className?: string;
};

export function ProductCard({
  product,
  delayMs = 0,
  onCustomOrder,
  wide = false,
  className,
}: ProductCardProps) {
  const { tenant } = useTenant();
  const img = publicImageUrl(product.image_path);
  const priceLabel = formatPriceRub(product.price_rub);

  const handleClick = () => {
    if (product.is_custom) {
      onCustomOrder?.(product);
      return;
    }
    addToCart(tenant.id, {
      productId: product.id,
      name: product.name,
      priceRub: product.price_rub,
      imagePath: product.image_path,
      isCustom: false,
    });
  };

  return (
    <article
      className={cn(
        "glass lift animate-fade-up flex h-full min-w-0 flex-col overflow-hidden rounded-3xl p-3",
        className,
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-sand/40",
          wide ? "min-h-[16rem] flex-1" : "aspect-[4/5]",
        )}
      >
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            width={wide ? 1200 : 800}
            height={wide ? 750 : 1008}
            className={cn(
              "h-full w-full object-cover transition-transform duration-700 hover:scale-105",
              wide ? "absolute inset-0" : "aspect-[4/5]",
            )}
          />
        ) : (
          <div
            className={cn(
              "grid place-items-center",
              wide ? "absolute inset-0 h-full w-full" : "aspect-[4/5]",
            )}
          >
            <Flower2 className="h-12 w-12 text-primary/25" strokeWidth={1.25} />
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col p-3 pt-5">
        <div className="flex min-w-0 items-baseline gap-3">
          <h3 className="min-w-0 flex-1 truncate font-display text-2xl font-light">
            {product.name}
          </h3>
          <div className="max-w-[45%] shrink-0 overflow-hidden">
            <Price
              value={priceLabel}
              className="block truncate font-bold text-accent"
            />
          </div>
        </div>
        <button type="button" onClick={handleClick} className={`${btn} mt-5 w-full py-3 text-sm`}>
          {product.is_custom ? "Оставить заявку" : "В корзину"}
        </button>
      </div>
    </article>
  );
}
