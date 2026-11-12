import { createFileRoute } from "@tanstack/react-router";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/s/$slug/privacy")({
  head: () => ({
    meta: [{ title: "Политика конфиденциальности" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-20 pt-14 lg:px-10">
        <h1 className="break-words hyphens-auto text-center font-display text-3xl font-light tracking-tight text-primary md:text-5xl">
          Политика конфиденциальности
        </h1>
        <div className="mx-auto mt-14 w-full max-w-3xl space-y-4 font-light leading-relaxed text-muted-foreground">
          <p>
            Мы бережно относимся к вашим данным. Имя и телефон нужны только чтобы связаться по заказу
            и уточнить детали доставки.
          </p>
          <p>
            Данные не передаём третьим лицам для рекламы. Храним столько, сколько нужно для работы с
            заказом и по требованиям закона.
          </p>
          <p>
            По вопросам о персональных данных напишите или позвоните по контактам на сайте. Мы ответим
            в рабочие часы.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
