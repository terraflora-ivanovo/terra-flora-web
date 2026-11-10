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

/**
 * Creates an order (and order_items) in Supabase, or accepts it locally in demo mode
 * when env credentials are missing.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const isCustomRequest =
    input.lines.some((l) => l.isCustom) && input.lines.every((l) => l.isCustom);
  const sb = trySupabase();

  if (!sb) {
    return { orderId: `demo-${Date.now()}`, mode: "demo" };
  }

  const { data: order, error } = await sb
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      comment: input.comment ?? null,
      is_custom_request: isCustomRequest || input.lines.some((l) => l.isCustom),
      status: "new",
    })
    .select("id")
    .single();

  if (error || !order) throw error ?? new Error("Не удалось создать заказ");

  const items = input.lines.map((l) => ({
    tenant_id: input.tenantId,
    order_id: order.id,
    product_id: isLocalProductId(l.productId) ? null : l.productId,
    product_name: l.name,
    unit_price_rub: l.isCustom ? 0 : l.priceRub,
    qty: l.qty,
  }));

  const { error: itemsError } = await sb.from("order_items").insert(items);
  if (itemsError) throw itemsError;

  return { orderId: order.id, mode: "supabase" };
}
