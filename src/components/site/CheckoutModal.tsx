import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Check } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearCart, useCart } from "@/lib/cart";
import { localPhoneDigits, maskRuPhone } from "@/lib/format";
import { createOrder } from "@/lib/orders-api";
import { useTenant } from "@/lib/tenant-context";

type CheckoutModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "cart" | "custom";
};

const inputCls =
  "w-full rounded-lg border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary";

const btnCls =
  "mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-berry hover:shadow-lift disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none";

export function CheckoutModal({ open, onOpenChange, mode = "cart" }: CheckoutModalProps) {
  const { tenant } = useTenant();
  const cart = useCart(tenant.id);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameError, setNameError] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [phoneDisplay, setPhoneDisplay] = useState("+7");

  const lines = useMemo(
    () => (mode === "custom" ? cart.lines.filter((l) => l.isCustom) : cart.lines),
    [cart.lines, mode],
  );

  const reset = () => {
    setAgreed(false);
    setIsSubmitting(false);
    setIsSuccess(false);
    setNameValue("");
    setNameError(false);
    setPhoneDigits("");
    setPhoneDisplay("+7");
    setPhoneError(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    let digits = input.replace(/\D/g, "");
    if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (
      input.length < phoneDisplay.length &&
      digits.length === phoneDigits.length &&
      phoneDigits.length > 0
    ) {
      digits = phoneDigits.slice(0, -1);
    }
    setPhoneDigits(digits);
    setPhoneDisplay(maskRuPhone(digits));
    if (phoneError) setPhoneError(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreed || isSubmitting) return;

    const name = nameValue.trim();
    if (!name) {
      setNameError(true);
      return;
    }
    if (localPhoneDigits(phoneDisplay).length !== 10) {
      setPhoneError(true);
      return;
    }
    if (lines.length === 0) return;

    setIsSubmitting(true);
    try {
      await createOrder({
        tenantId: tenant.id,
        customerName: name,
        customerPhone: phoneDisplay,
        lines,
      });
      clearCart(tenant.id);
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
                {mode === "custom" ? "Индивидуальный букет" : "Оформление заказа"}
              </DialogTitle>
              <DialogDescription className="font-sans text-sm text-muted-foreground">
                {mode === "custom"
                  ? "Оставьте контакты. Бюджет и состав обсудим по телефону."
                  : "Доставку и оплату согласуем при звонке."}
              </DialogDescription>
            </DialogHeader>

            {lines.length > 0 ? (
              <ul className="mt-2 space-y-2 rounded-lg bg-muted/60 p-3 text-sm">
                {lines.map((l) => (
                  <li key={l.productId} className="flex justify-between gap-3">
                    <span>
                      {l.name}
                      {l.qty > 1 ? ` × ${l.qty}` : ""}
                    </span>
                    <span className="text-accent">
                      {l.isCustom
                        ? "по запросу"
                        : `${(l.priceRub * l.qty).toLocaleString("ru-RU")} ₽`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="checkout-name" className="text-sm font-medium text-foreground">
                  Ваше имя
                </label>
                <input
                  id="checkout-name"
                  value={nameValue}
                  onChange={(e) => {
                    setNameValue(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  placeholder="Иван"
                  className={`${inputCls}${nameError ? " border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {nameError ? (
                  <p className="mt-1 text-sm text-red-500">Пожалуйста, введите ваше имя</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="checkout-phone" className="text-sm font-medium text-foreground">
                  Номер телефона
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 000-00-00"
                  className={`${inputCls}${phoneError ? " border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {phoneError ? (
                  <p className="mt-1 text-sm text-red-500">
                    Пожалуйста, введите корректный номер телефона
                  </p>
                ) : null}
              </div>

              <label
                htmlFor="checkout-consent"
                className="mt-1 flex cursor-pointer items-start gap-3 text-sm text-foreground/70"
              >
                <Checkbox
                  id="checkout-consent"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-primary/40 shadow-none data-[state=checked]:border-primary data-[state=checked]:bg-primary [&_svg]:h-3 [&_svg]:w-3"
                />
                Я даю согласие на обработку персональных данных
              </label>

              <button
                type="submit"
                disabled={!agreed || isSubmitting || lines.length === 0}
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
