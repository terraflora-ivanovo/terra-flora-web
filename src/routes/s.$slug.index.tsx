import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import mainBouquet from "@/assets/main-bouquet.webp";
import { CheckoutModal } from "@/components/site/CheckoutModal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ProductCard } from "@/components/site/ProductCard";
import { addToCart } from "@/lib/cart";
import type { StorefrontProduct } from "@/lib/database.types";
import { isCustomProduct, withCustomFirst } from "@/lib/tenant-api";
import { useTenant } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/s/$slug/")({
  head: ({ params }) => ({
    meta: [
      { title: `Terra Flora. Авторские букеты в Иваново` },
      {
        name: "description",
        content:
          "Цветочная мастерская в Иваново. Свежие авторские букеты с душой. Быстрый заказ в один клик.",
      },
    ],
    links: [{ rel: "canonical", href: `/s/${params.slug}` }],
  }),
  component: StoreHome,
});

type Step = { n: string; title: string; text: string };

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift";

function StoreHome() {
  const { slug, tenant, products } = useTenant();
  const [customProduct, setCustomProduct] = useState<StorefrontProduct | null>(null);

  const catalog = useMemo(() => {
    const popular = products.filter(
      (p) => p.is_published === true && p.is_popular === true && !isCustomProduct(p),
    );
    const customFromDb = products.find(
      (p) => p.is_published === true && isCustomProduct(p),
    );
    const base = customFromDb ? [customFromDb, ...popular] : popular;
    return withCustomFirst(base, tenant);
  }, [products, tenant]);

  const dbEmpty = products.length === 0;
  const steps = (Array.isArray(tenant.steps) ? tenant.steps : []) as Step[];

  const onCustom = (p: StorefrontProduct) => {
    addToCart(tenant.id, {
      productId: p.id,
      name: p.name,
      priceRub: 0,
      imagePath: p.image_path,
      isCustom: true,
    });
    setCustomProduct(p);
  };

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col bg-background text-foreground">
      <Header />

      <section className="mx-auto grid max-w-7xl items-start gap-12 px-6 pb-20 pt-8 md:pt-40 lg:grid-cols-12 lg:px-10 lg:pt-50">
        <div className="animate-fade-up relative lg:col-span-6">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-accent lg:absolute lg:-top-10 lg:mb-0">
            Цветочная мастерская
          </p>
          <h1 className="font-display text-5xl font-light leading-[1.02] tracking-tight text-primary sm:text-6xl lg:text-7xl">
            Авторские букеты <em className="text-accent">в Иваново</em>
          </h1>
          <p className="mt-8 max-w-md text-lg font-light text-muted-foreground">{tenant.tagline}</p>
          <a href="#catalog" className={`${btn} mt-10 px-8 py-4`}>
            Заказать букет <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="animate-fade-up relative lg:col-span-6" style={{ animationDelay: "150ms" }}>
          <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2.5rem] bg-sand/70" />
          <img
            src={mainBouquet}
            alt="Авторский букет из пионов и роз"
            width={1200}
            height={1408}
            className="aspect-[4/5] h-full w-full rounded-[2rem] object-cover shadow-lift"
          />
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <h2 className="font-display text-4xl font-light text-primary sm:text-5xl">
            Популярные букеты
          </h2>
          <Link
            to="/s/$slug/catalog"
            params={{ slug }}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Весь каталог
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {catalog.map((p, i) => {
            const wide = isCustomProduct(p);
            return (
              <ProductCard
                key={p.id}
                product={p}
                delayMs={i * 120}
                onCustomOrder={onCustom}
                wide={wide}
                className={cn(wide && "md:col-span-2")}
              />
            );
          })}
        </div>
        {dbEmpty ? (
          <p className="mt-10 text-center font-light text-muted-foreground">
            Товары пока не добавлены
          </p>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <h2 className="mb-14 border-b border-border pb-6 font-display text-4xl font-light text-primary sm:text-5xl">
          Как мы работаем
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="glass lift animate-fade-up rounded-3xl p-8"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="font-display text-5xl font-light text-accent">{s.n}</span>
              <h3 className="mt-8 font-display text-2xl font-light">{s.title}</h3>
              <p className="mt-3 font-light text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <CheckoutModal
        open={customProduct !== null}
        onOpenChange={(o) => !o && setCustomProduct(null)}
        mode="custom"
      />

      <Footer />
    </div>
  );
}
