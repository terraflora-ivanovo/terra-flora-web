import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Price } from "@/components/site/Price";

export type OrderBouquet = { name: string; price: string };

type OrderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bouquet: OrderBouquet | null;
};

const TELEGRAM_URL =
  "https://api.telegram.org/bot8914581396:AAGdgGHjUGBI_P7ZEJayu9-R7bOKZZhjrSA/sendMessage";
const TELEGRAM_CHAT_ID = "381101902";

const inputCls =
  "w-full rounded-lg border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary";

const btnCls =
  "mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-berry hover:shadow-lift disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none";

export function OrderModal({ open, onOpenChange, bouquet }: OrderModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const resetModal = () => {
    setAgreed(false);
    setIsSubmitting(false);
    setIsSuccess(false);
    setFormKey((k) => k + 1);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetModal();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed || isSubmitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    const text = [
      "🌿 <b>Новый заказ!</b>",
      "",
      `<b>Букет:</b> ${bouquet?.name ?? "—"}`,
      `<b>Цена:</b> ${bouquet?.price ?? "—"}`,
      `<b>Имя:</b> ${name}`,
      `<b>Телефон:</b> ${phone}`,
    ].join("\n");

    setIsSubmitting(true);
    try {
      const res = await fetch(TELEGRAM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          parse_mode: "HTML",
          text,
        }),
      });

      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        throw new Error("Telegram request failed");
      }

      setIsSuccess(true);
    } catch {
      alert("Не удалось отправить заказ. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-none bg-background p-6 shadow-2xl sm:p-8 [&>button]:text-muted-foreground [&>button]:transition-colors [&>button]:hover:text-foreground">
        {isSuccess ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15">
              <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} aria-hidden />
            </div>
            <DialogHeader className="mt-6 items-center space-y-3">
              <DialogTitle className="font-display text-3xl font-light tracking-tight text-primary">
                Спасибо за заказ!
              </DialogTitle>
              <DialogDescription className="font-sans text-base text-muted-foreground">
                Мы скоро перезвоним вам для уточнения деталей.
              </DialogDescription>
            </DialogHeader>
            <button type="button" onClick={() => handleOpenChange(false)} className={btnCls}>
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl font-light tracking-tight text-primary">
                Оформление заказа
              </DialogTitle>
              <DialogDescription className="sr-only">
                Быстрый заказ букета в один клик
              </DialogDescription>
            </DialogHeader>

            {bouquet && (
              <div className="mt-2 flex items-baseline justify-between gap-4 rounded-lg bg-muted/60 p-3 px-4">
                <span className="text-sm font-light text-foreground">
                  Авторский букет «{bouquet.name}»
                </span>
                <Price
                  value={bouquet.price}
                  className="whitespace-nowrap text-sm font-bold text-accent"
                />
              </div>
            )}

            <form key={formKey} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="order-name" className="text-sm font-medium text-foreground">
                  Ваше имя
                </label>
                <input id="order-name" name="name" type="text" placeholder="Иван" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="order-phone" className="text-sm font-medium text-foreground">
                  Номер телефона
                </label>
                <input
                  id="order-phone"
                  name="phone"
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  className={inputCls}
                />
              </div>

              <label
                htmlFor="order-consent"
                className="mt-1 flex cursor-pointer items-start gap-3 text-sm text-foreground/70"
              >
                <Checkbox
                  id="order-consent"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-primary/40 shadow-none data-[state=checked]:border-primary data-[state=checked]:bg-primary [&_svg]:h-3 [&_svg]:w-3"
                />
                Я даю согласие на обработку персональных данных
              </label>

              <button
                type="submit"
                disabled={!agreed || isSubmitting}
                className={btnCls}
              >
                {isSubmitting ? "Отправка..." : "Отправить заказ"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
