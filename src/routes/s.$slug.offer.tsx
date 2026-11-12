import { createFileRoute } from "@tanstack/react-router";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/s/$slug/offer")({
  head: () => ({
    meta: [{ title: "Публичная оферта" }],
  }),
  component: OfferPage,
});

function OfferPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-20 pt-14 lg:px-10">
        <h1 className="break-words hyphens-auto text-center font-display text-3xl font-light tracking-tight text-primary md:text-5xl">
          Публичная оферта
        </h1>
        <div className="mx-auto mt-14 w-full max-w-3xl space-y-4 font-light leading-relaxed text-muted-foreground">
          <p>
            Оформляя заказ на сайте, вы оставляете заявку. Мы связываемся с вами, подтверждаем состав,
            стоимость, способ получения и сроки.
          </p>
          <p>
            Оплата и доставка согласуются отдельно по телефону. Пока детали не подтверждены, заказ не
            считается завершённым.
          </p>
          <p>
            Если что-то пошло не так с цветами или сроками, напишите нам. Постараемся решить вопрос
            спокойно и по делу.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
