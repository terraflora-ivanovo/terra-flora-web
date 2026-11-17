import type { CartLine } from "@/lib/cart";
import { trySupabase } from "@/lib/supabase";
import { isLocalProductId } from "@/lib/tenant-api";

export type CreateOrderInput = {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  comment?: string;
  lines: CartLine[];
};

export type CreateOrderResult = {
  orderId: string;
  mode: "supabase" | "demo";
};

function buildTelegramText(orderId: string, input: CreateOrderInput): string {
  const items = input.lines
    .map((l) => {
      const qty = l.qty > 1 ? ` × ${l.qty}` : "";
      const price = l.isCustom
        ? "по запросу"
        : `${(l.priceRub * l.qty).toLocaleString("ru-RU")} ₽`;
      return `• ${l.name}${qty} — ${price}`;
    })
    .join("\n");

  return [
    "🌿 <b>Новый заказ!</b>",
    "",
    `<b>ID:</b> ${orderId}`,
    `<b>Имя:</b> ${input.customerName}`,
    `<b>Телефон:</b> ${input.customerPhone}`,
    input.comment ? `<b>Комментарий:</b> ${input.comment}` : null,
    "",
    "<b>Состав:</b>",
    items || "—",
  ]
    .filter((line) => line != null)
    .join("\n");
}

/**
 * Best-effort Telegram notify. Failures never propagate — order is already saved.
 */
async function sendOrderToTelegram(orderId: string, input: CreateOrderInput): Promise<void> {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID as string | undefined;
  if (!token || !chatId) return;

  console.log("Попытка отправки в Telegram...");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: "HTML",
        text: buildTelegramText(orderId, input),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Telegram HTTP ${res.status}`);
    }

    const data = (await res.json()) as { ok?: boolean };
    if (!data.ok) {
      throw new Error("Telegram API returned ok=false");
    }
  } catch (error) {
    console.error("Ошибка Telegram:", error);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Creates an order (and order_items) in Supabase, or accepts it locally in demo mode
 * when env credentials are missing. Telegram notify is best-effort and never fails the order.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const isCustomRequest =
    input.lines.some((l) => l.isCustom) && input.lines.every((l) => l.isCustom);
  const sb = trySupabase();
  const orderId = crypto.randomUUID();

  if (!sb) {
    const demoOrderId = `demo-${Date.now()}`;
    await sendOrderToTelegram(demoOrderId, input);
    return { orderId: demoOrderId, mode: "demo" };
  }

  const { error } = await sb.from("orders").insert({
    id: orderId,
    tenant_id: input.tenantId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    comment: input.comment ?? null,
    is_custom_request: isCustomRequest || input.lines.some((l) => l.isCustom),
    status: "new",
  });

  if (error) throw error;

  const items = input.lines.map((l) => ({
    tenant_id: input.tenantId,
    order_id: orderId,
    product_id: isLocalProductId(l.productId) ? null : l.productId,
    product_name: l.name,
    unit_price_rub: l.isCustom ? 0 : l.priceRub,
    qty: l.qty,
  }));

  const { error: itemsError } = await sb.from("order_items").insert(items);
  if (itemsError) throw itemsError;

  // DB write succeeded — always return success to the client even if Telegram fails.
  await sendOrderToTelegram(orderId, input);

  return { orderId, mode: "supabase" };
}
