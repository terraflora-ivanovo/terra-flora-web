import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Price } from "@/components/site/Price";
import { OrderModal, type OrderBouquet } from "@/components/site/OrderModal";
import hero from "@/assets/hero.jpg";
import b1 from "@/assets/b1.jpg";
import b2 from "@/assets/b2.jpg";
import b3 from "@/assets/b3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terra Flora — Авторские букеты в Иванове" },
      {
        name: "description",
        content:
          "Цветочная мастерская в Иванове. Свежие авторские букеты с душой. Быстрый заказ в один клик.",
      },
      { property: "og:title", content: "Terra Flora — Авторские букеты в Иванове" },
      {
        property: "og:description",
        content:
          "Цветочная мастерская в Иванове. Свежие авторские букеты с душой. Быстрый заказ в один клик.",
      },
      { property: "og:image", content: "/og-image.jpg" },
    ],
  }),
  component: Index,
});

const products = [
  { name: "Утренний сад", price: "4 900 ₽", img: b1 },
  { name: "Пионовый шёпот", price: "6 200 ₽", img: b2 },
  { name: "Лесной свет", price: "5 400 ₽", img: b3 },
];
const steps = [
  { n: "01", t: "Выбираете букет", d: "Из каталога или по вашему пожеланию — подскажем с выбором." },
  { n: "02", t: "Собираем вручную", d: "Флорист собирает букет из свежих сезонных цветов." },
  { n: "03", t: "Выдаем в срок", d: "Отдаем бережно и точно ко времени по Иваново." },
];

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift";

function Index() {
  const [order, setOrder] = useState<OrderBouquet | null>(null);

  return (
    <div className="min-h-screen text-foreground">
      <Header />

      <section className="mx-auto grid max-w-7xl items-start gap-12 px-6 pb-20 pt-8 md:pt-40 lg:grid-cols-12 lg:px-10 lg:pt-50">
        <div className="animate-fade-up relative lg:col-span-6">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-accent lg:absolute lg:-top-10 lg:mb-0">Цветочная мастерская</p>
          <h1 className="font-display text-5xl font-light leading-[1.02] tracking-tight text-primary sm:text-6xl lg:text-7xl">
            Авторские букеты <em className="text-accent">в Иваново</em>
          </h1>
          <p className="mt-8 max-w-md text-lg font-light text-muted-foreground">Цветы — это поэзия, которую природа написала для нас</p>
          <a href="#catalog" className={`${btn} mt-10 px-8 py-4`}>Заказать букет <ArrowUpRight className="h-4 w-4" /></a>
        </div>
        <div className="animate-fade-up relative lg:col-span-6" style={{ animationDelay: "150ms" }}>
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-sand/70 rotate-2" />
          <img src={hero} alt="Авторский букет из пионов и роз" width={1200} height={1408}
            className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-lift" />
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <h2 className="mb-14 border-b border-border pb-6 font-display text-4xl font-light text-primary sm:text-5xl">Популярные букеты</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {products.map((p, i) => (
            <article key={p.name} className="glass lift animate-fade-up rounded-3xl p-3" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="overflow-hidden rounded-2xl">
                <img src={p.img} alt={p.name} loading="lazy" width={800} height={1008}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
              <div className="flex items-baseline justify-between px-3 pt-5">
                <h3 className="font-display text-2xl font-light">{p.name}</h3>
                <Price value={p.price} className="font-bold text-accent" />
              </div>
              <button
                onClick={() => setOrder({ name: p.name, price: p.price })}
                className={`${btn} m-3 mt-5 w-[calc(100%-1.5rem)] py-3 text-sm`}
              >
                Заказать
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <h2 className="mb-14 border-b border-border pb-6 font-display text-4xl font-light text-primary sm:text-5xl">Как мы работаем</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="glass lift animate-fade-up rounded-3xl p-8" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="font-display text-5xl font-light text-accent">{s.n}</span>
              <h3 className="mt-8 font-display text-2xl font-light">{s.t}</h3>
              <p className="mt-3 font-light text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <OrderModal open={order !== null} onOpenChange={(o) => !o && setOrder(null)} bouquet={order} />

      <Footer />
    </div>
  );
}
