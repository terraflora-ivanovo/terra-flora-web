import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { CheckoutModal } from "@/components/site/CheckoutModal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ProductCard } from "@/components/site/ProductCard";
import { addToCart } from "@/lib/cart";
import type { StorefrontProduct } from "@/lib/database.types";
import { sortCustomFirst, visibleProducts } from "@/lib/tenant-api";
import { useTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/s/$slug/catalog")({
  head: ({ params }) => ({
    meta: [
      { title: "Каталог букетов" },
      {
        name: "description",
        content: "Каталог авторских букетов в Иваново: готовые композиции и индивидуальный букет.",
      },
    ],
    links: [{ rel: "canonical", href: `/s/${params.slug}/catalog` }],
  }),
  component: CatalogPage,
});

const pill =
  "rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition-colors duration-300 hover:bg-primary/10";
const pillActive =
  "rounded-full border border-primary bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-300";

function CatalogPage() {
  const { slug, tenant, products, categories } = useTenant();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [customOpen, setCustomOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = visibleProducts(products);
    const base =
      categoryId === "all" ? list : list.filter((p) => p.is_custom || p.category_id === categoryId);
    return sortCustomFirst(base);
  }, [products, categoryId]);

  const onCustom = (p: StorefrontProduct) => {
    addToCart(tenant.id, {
      productId: p.id,
      name: p.name,
      priceRub: 0,
      imagePath: p.image_path,
      isCustom: true,
    });
    setCustomOpen(true);
  };

  return (
    <div className="min-h-[100dvh] text-foreground">
      <Header />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-14 lg:px-10">
        <nav className="text-sm text-muted-foreground">
          <Link to="/s/$slug" params={{ slug }} className="transition-colors hover:text-primary">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-primary">Каталог</span>
        </nav>
        <h1 className="mt-6 font-display text-5xl font-light tracking-tight text-primary sm:text-6xl">
          Каталог букетов
        </h1>

        <div className="mt-10 flex flex-wrap gap-2">
          <button
            type="button"
            className={categoryId === "all" ? pillActive : pill}
            onClick={() => setCategoryId("all")}
          >
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={categoryId === c.id ? pillActive : pill}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} delayMs={i * 80} onCustomOrder={onCustom} />
          ))}
        </div>
      </main>
      <CheckoutModal open={customOpen} onOpenChange={setCustomOpen} mode="custom" />
      <Footer />
    </div>
  );
}
