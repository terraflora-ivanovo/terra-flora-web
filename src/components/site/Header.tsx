import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useTenant } from "@/lib/tenant-context";

type LogoProps = {
  name?: string;
  className?: string;
  accentClassName?: string;
};

export function Logo({
  name = "terra flora",
  className = "font-logo whitespace-nowrap text-2xl tracking-wide text-primary",
  accentClassName = "text-accent",
}: LogoProps) {
  const parts = name.split(/\s+/);
  const first = parts[0] ?? name;
  const rest = parts.slice(1).join(" ");
  return (
    <span className={className}>
      {first}
      {rest ? (
        <>
          {" "}
          <em className={accentClassName}>{rest}</em>
        </>
      ) : null}
    </span>
  );
}

const navLinkCls = "text-sm text-muted-foreground transition-colors hover:text-primary";

const mobileLinks = [
  { to: "/s/$slug", label: "Главная" },
  { to: "/s/$slug/catalog", label: "Каталог" },
  { to: "/s/$slug/about", label: "О нас" },
  { to: "/s/$slug/contacts", label: "Контакты" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { slug, tenant } = useTenant();
  const cart = useCart(tenant.id);
  const count = useMemo(
    () => cart.lines.reduce((sum, line) => sum + line.qty, 0),
    [cart.lines],
  );
  const routeParams = useMemo(() => ({ slug }), [slug]);
  const phoneHref = `tel:${tenant.phone.replace(/\s+/g, "")}`;

  return (
    <header className="flex w-full items-center justify-between border-b border-border px-6 py-6 md:px-12">
      <Link
        to="/s/$slug"
        params={routeParams}
        aria-label={`${tenant.name} на главную`}
        className="inline-block"
      >
        <Logo name={tenant.name} />
      </Link>

      <nav className="hidden items-center gap-8 lg:flex">
        <Link to="/s/$slug" params={routeParams} className={navLinkCls}>
          Главная
        </Link>
        <Link to="/s/$slug/catalog" params={routeParams} className={navLinkCls}>
          Каталог
        </Link>
        <Link to="/s/$slug/about" params={routeParams} className={navLinkCls}>
          О нас
        </Link>
        <Link to="/s/$slug/contacts" params={routeParams} className={navLinkCls}>
          Контакты
        </Link>
      </nav>

      <div className="hidden items-center gap-4 lg:flex">
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {tenant.address}
        </span>
        <Link
          to="/s/$slug/cart"
          params={routeParams}
          className="relative grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:text-berry"
          aria-label="Корзина"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-berry px-1 text-[10px] font-medium text-white">
              {count}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <Link
          to="/s/$slug/cart"
          params={routeParams}
          className="relative grid h-11 w-11 place-items-center rounded-full text-primary transition-colors hover:text-berry"
          aria-label="Корзина"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          {count > 0 ? (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-berry px-1 text-[10px] font-medium text-white">
              {count}
            </span>
          ) : null}
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Открыть меню"
              className="grid h-11 w-11 place-items-center rounded-full text-primary transition-colors duration-300 hover:text-berry"
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
                  params={routeParams}
                  onClick={() => setOpen(false)}
                  className="font-display text-2xl font-light text-primary transition-colors duration-300 hover:text-berry"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <a
              href={phoneHref}
              onClick={() => setOpen(false)}
              className="mt-auto pt-8 text-lg font-light text-primary/80 transition-colors duration-300 hover:text-berry"
            >
              {tenant.phone}
            </a>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
