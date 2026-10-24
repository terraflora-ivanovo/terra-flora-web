import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О нас — terra flora" },
      { name: "description", content: "О цветочной мастерской terra flora в Иванове." },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-10 font-display text-4xl font-light text-[#1f4a38] sm:text-5xl">
          О нас
        </h1>
        <p className="mb-6 font-sans text-lg font-light leading-relaxed text-[#1c2b24]/opacity-80">
          Terra Flora — это цветочная мастерская в Иванове. Мы верим, что цветы — это не просто
          подарок, а самый искренний способ передать чувства без слов.
        </p>
        <p className="mb-6 font-sans text-lg font-light leading-relaxed text-[#1c2b24]/opacity-80">
          Каждый наш букет собирается вручную с особым вниманием к деталям, колористике и свежести.
          Мы отказались от шаблонных решений в пользу авторского подхода и сезонных растений.
        </p>
        <p className="mb-6 font-sans text-lg font-light leading-relaxed text-[#1c2b24]/opacity-80">
          Наша цель — приносить эстетику в ваши будни и делать важные моменты по-настоящему
          красивыми.
        </p>
      </main>
      <Footer />
    </div>
  );
}
