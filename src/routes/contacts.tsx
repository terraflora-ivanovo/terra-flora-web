import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Контакты — terra flora" },
      { name: "description", content: "Контакты цветочной мастерской terra flora в Иванове." },
    ],
    links: [{ rel: "canonical", href: "/contacts" }],
  }),
  component: ContactsPage,
});

const linkCls =
  "font-light transition-colors duration-300 hover:text-[#b75d67]";

function ContactsPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-20">
        <h1 className="mb-16 text-center font-display text-4xl font-light text-[#1f4a38]">
          Контакты
        </h1>

        <div className="grid gap-12 text-center md:grid-cols-3">
          <div>
            <h2 className="mb-3 font-medium text-[#1c2b24]">Мастерская</h2>
            <p className="font-light text-[#1c2b24]/opacity-80">
              г. Иваново, ул. Котовского, д. 23
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-medium text-[#1c2b24]">Время работы</h2>
            <p className="font-light text-[#1c2b24]/opacity-80">
              Ежедневно
              <br />
              с 09:00 до 21:00
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-medium text-[#1c2b24]">Телефон и мессенджеры</h2>
            <a href="tel:+79806894120" className={`${linkCls} block text-[#1c2b24]`}>
              +7 980 689 41 20
            </a>
            <div className="mt-3 flex flex-col items-center gap-1.5 text-sm text-[#1c2b24]/opacity-80">
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
              >
                Telegram
              </a>
              <a
                href="https://vk.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
              >
                ВКонтакте
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
