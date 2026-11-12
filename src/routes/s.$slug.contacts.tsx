import { createFileRoute } from "@tanstack/react-router";

import { Footer, SocialLinks } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/s/$slug/contacts")({
  head: () => ({
    meta: [{ title: "Контакты" }],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const { tenant } = useTenant();
  const phoneHref = `tel:${tenant.phone.replace(/\s+/g, "")}`;

  return (
    <div className="flex min-h-screen flex-1 flex-col text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-14 lg:px-10">
        <h1 className="mb-16 text-center font-display text-4xl font-light text-primary">Контакты</h1>
        <div className="space-y-8 text-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Телефон</p>
            <a href={phoneHref} className="mt-2 block font-display text-2xl font-light text-primary">
              {tenant.phone}
            </a>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Адрес</p>
            <p className="mt-2 font-display text-2xl font-light text-primary">{tenant.address}</p>
            <p className="mt-1 font-display text-2xl font-light text-muted-foreground">г. Иваново</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Соцсети</p>
            <SocialLinks
              className="mt-4 flex items-center justify-center gap-3"
              linkClassName="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
