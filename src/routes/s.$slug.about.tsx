import { createFileRoute } from "@tanstack/react-router";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/s/$slug/about")({
  head: () => ({
    meta: [{ title: "О нас" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { tenant } = useTenant();
  return (
    <div className="flex min-h-[100dvh] flex-col text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-14 lg:px-10">
        <h1 className="mb-10 font-display text-4xl font-light text-primary sm:text-5xl">О нас</h1>
        <p className="text-lg font-light leading-relaxed text-muted-foreground">{tenant.about}</p>
        <p className="mt-6 font-light text-muted-foreground">
          Работаем в Иваново. Приходите в гости или оставьте заказ на сайте, мы перезвоним.
        </p>
      </main>
      <Footer />
    </div>
  );
}
