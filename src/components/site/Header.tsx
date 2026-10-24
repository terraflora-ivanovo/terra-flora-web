import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Logo = () => (
  <span className="font-logo whitespace-nowrap text-2xl tracking-wide text-primary">
    terra <em className="text-accent">flora</em>
  </span>
);

const navLinkCls = "text-muted-foreground transition-colors hover:text-primary";

const mobileLinks = [
  { to: "/", label: "Главная" },
  { to: "/catalog", label: "Каталог" },
  { to: "/about", label: "О нас" },
  { to: "/contacts", label: "Контакты" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-6 border-b border-border px-6 py-6 lg:px-10">
      <Link to="/" aria-label="terra flora — на главную" className="inline-block">
        <Logo />
      </Link>

      <nav className="hidden gap-8 text-sm lg:flex">
        <Link to="/" className={navLinkCls}>
          Главная
        </Link>
        <Link to="/catalog" className={navLinkCls}>
          Каталог
        </Link>
        <Link to="/about" className={navLinkCls}>
          О нас
        </Link>
        <Link to="/contacts" className={navLinkCls}>
          Контакты
        </Link>
      </nav>

      <span className="hidden whitespace-nowrap text-sm text-muted-foreground lg:block">
        ул. Котовского, д. 23
      </span>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Открыть меню"
            className="grid h-11 w-11 place-items-center rounded-full text-primary transition-colors duration-300 hover:text-berry lg:hidden"
          >
            <Menu className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-none bg-[#FFF6F6] p-8 sm:max-w-sm [&>button]:right-6 [&>button]:top-6 [&>button]:text-primary [&>button]:opacity-100 [&>button]:hover:text-berry [&>button_svg]:h-6 [&>button_svg]:w-6"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Меню</SheetTitle>
            <SheetDescription>Навигация по сайту</SheetDescription>
          </SheetHeader>

          <nav className="mt-16 flex flex-1 flex-col gap-8">
            {mobileLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="font-display text-2xl font-light text-primary transition-colors duration-300 hover:text-berry"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a
            href="tel:+79806894120"
            onClick={() => setOpen(false)}
            className="mt-auto pt-8 text-lg font-light text-primary/80 transition-colors duration-300 hover:text-berry"
          >
            +7 980 689 41 20
          </a>
        </SheetContent>
      </Sheet>
    </header>
  );
}
