import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Flower2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Price } from "@/components/site/Price";
import { OrderModal, type OrderBouquet } from "@/components/site/OrderModal";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Каталог букетов — terra flora" },
      { name: "description", content: "Каталог авторских букетов terra flora в Иванове: авторские, монобукеты, свадебные и композиции в корзине." },
      { property: "og:title", content: "Каталог букетов — terra flora" },
      { property: "og:description", content: "Авторские, монобукеты, свадебные букеты и композиции в корзине. Доставка по Иванову." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/catalog" }],
  }),
  component: CatalogPage,
});

type Category = "Авторские" | "Монобукеты" | "Свадебные" | "В корзине";

const filters: Array<"Все" | Category> = ["Все", "Авторские", "Монобукеты", "Свадебные", "В корзине"];

const bouquets: Array<{ name: string; price: string; category: Category }> = [
  { name: "Утренний сад", price: "4 900 ₽", category: "Авторские" },
  { name: "Пионовый шёпот", price: "6 200 ₽", category: "Монобукеты" },
  { name: "Лесной свет", price: "5 400 ₽", category: "Авторские" },
  { name: "Апрельский дождь", price: "3 900 ₽", category: "Монобукеты" },
  { name: "Белая ночь", price: "8 900 ₽", category: "Свадебные" },
  { name: "Золотой октябрь", price: "7 200 ₽", category: "В корзине" },
];

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift";

const pill =
  "rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition-colors duration-300 hover:bg-primary/10";

const pillActive = "rounded-full border border-primary bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-300";

function CatalogPage() {
  const [active, setActive] = useState<(typeof filters)[number]>("Все");
  const [order, setOrder] = useState<OrderBouquet | null>(null);
  const visible = active === "Все" ? bouquets : bouquets.filter((b) => b.category === active);

  return (
    <div className="min-h-screen text-foreground">
      <Header />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-14 lg:px-10">
        <nav aria-label="Хлебные крошки" className="text-xs text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-primary">Главная</Link>
          <span className="mx-2">/</span>
          <span className="text-primary">Каталог</span>
        </nav>

        <h1 className="mt-6 font-display text-5xl font-light tracking-tight text-primary sm:text-6xl">Каталог букетов</h1>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-3">
            {filters.map((f) => (
              <button key={f} onClick={() => setActive(f)} className={f === active ? pillActive : pill}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <select
              aria-label="Сортировка"
              className="w-56 cursor-pointer appearance-none rounded-full border border-primary bg-transparent py-2.5 pl-5 pr-10 text-sm font-medium text-primary outline-none transition-colors duration-300 hover:bg-primary/10"
              defaultValue="default"
            >
              <option value="default">Сортировка: по умолчанию</option>
              <option value="cheap">Сначала дешевле</option>
              <option value="expensive">Сначала дороже</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {visible.map((b, i) => (
            <article key={b.name} className="glass lift animate-fade-up rounded-3xl p-3" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="grid place-items-center overflow-hidden rounded-2xl bg-sand">
                <div className="grid aspect-[4/5] w-full place-items-center">
                  <Flower2 className="h-12 w-12 text-primary/25" strokeWidth={1.25} />
                </div>
              </div>
              <div className="flex items-baseline justify-between px-3 pt-5">
                <h3 className="font-display text-2xl font-light">{b.name}</h3>
                <Price value={b.price} className="font-bold text-accent" />
              </div>
              <button
                onClick={() => setOrder({ name: b.name, price: b.price })}
                className={`${btn} m-3 mt-5 w-[calc(100%-1.5rem)] py-3 text-sm`}
              >
                Заказать
              </button>
            </article>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <button className="rounded-full border border-primary bg-transparent px-10 py-3.5 text-sm font-medium text-primary transition-colors duration-300 hover:bg-primary/10">
            Показать еще
          </button>
        </div>
      </main>

      <OrderModal open={order !== null} onOpenChange={(o) => !o && setOrder(null)} bouquet={order} />

      <Footer />
    </div>
  );
}
