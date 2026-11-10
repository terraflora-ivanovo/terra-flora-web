import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { CheckoutModal } from "@/components/site/CheckoutModal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { cartTotalRub, removeFromCart, setLineQty, useCart } from "@/lib/cart";
import { formatPriceRub, publicImageUrl } from "@/lib/product-image";
import { useTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/s/$slug/cart")({
  head: () => ({
    meta: [{ title: "Корзина" }],
  }),
  component: CartPage,
});

const btn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift";

function CartPage() {
  const { slug, tenant } = useTenant();
  const cart = useCart(tenant.id);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const total = cartTotalRub(tenant.id);

  return (
    <div className="flex min-h-[100dvh] flex-col text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-14 lg:px-10">
        <h1 className="font-display text-4xl font-light text-primary sm:text-5xl">Корзина</h1>

        {cart.lines.length === 0 ? (
          <div className="mt-12 space-y-6">
            <p className="font-light text-muted-foreground">Пока пусто. Загляните в каталог.</p>
            <Link to="/s/$slug/catalog" params={{ slug }} className={`${btn} px-8 py-3 text-sm`}>
              В каталог
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <ul className="space-y-4">
              {cart.lines.map((line) => {
                const img = publicImageUrl(line.imagePath);
                return (
                  <li key={line.productId} className="glass flex gap-4 rounded-2xl p-3">
                    {img ? (
                      <img src={img} alt="" className="h-24 w-20 rounded-xl object-cover" />
                    ) : (
                      <div className="h-24 w-20 rounded-xl bg-sand/50" />
                    )}
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl font-light">{line.name}</p>
                          <p className="text-sm text-accent">
                            {line.isCustom ? "по запросу" : formatPriceRub(line.priceRub)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-berry"
                          onClick={() => removeFromCart(tenant.id, line.productId)}
                        >
                          Убрать
                        </button>
                      </div>
                      {!line.isCustom ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-full border border-border"
                            onClick={() => setLineQty(tenant.id, line.productId, line.qty - 1)}
                          >
                            −
                          </button>
                          <span className="text-sm">{line.qty}</span>
                          <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-full border border-border"
                            onClick={() => setLineQty(tenant.id, line.productId, line.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <p className="text-lg">
                Итого:{" "}
                <span className="font-medium text-accent">
                  {cart.lines.every((l) => l.isCustom) ? "по запросу" : formatPriceRub(total)}
                </span>
              </p>
              <button
                type="button"
                className={`${btn} px-8 py-3 text-sm`}
                onClick={() => setCheckoutOpen(true)}
              >
                Оформить заказ
              </button>
            </div>
            <p className="text-sm font-light text-muted-foreground">
              Доставку и оплату обсудим по телефону после заявки.
            </p>
          </div>
        )}
      </main>
      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} mode="cart" />
      <Footer />
    </div>
  );
}
