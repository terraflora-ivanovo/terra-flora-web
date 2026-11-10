import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

import type { Database } from "@/lib/database.types";

type ExportOrderRow = {
  "Дата заказа": string;
  "Имя клиента": string;
  Телефон: string;
  "Состав заказа": string;
  "Сумма (руб.)": number;
};

type OrderItemWithProduct = {
  product_name: string;
  qty: number;
  unit_price_rub: number;
  products: { name: string } | null;
};

type OrderWithItems = {
  customer_name: string;
  customer_phone: string;
  created_at: string;
  order_items: OrderItemWithProduct[] | null;
};

function padDatePart(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formats an ISO timestamp as `DD.MM.YYYY HH:mm`. */
export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  return (
    `${padDatePart(d.getDate())}.${padDatePart(d.getMonth() + 1)}.${d.getFullYear()} ` +
    `${padDatePart(d.getHours())}:${padDatePart(d.getMinutes())}`
  );
}

function compositionLine(items: OrderItemWithProduct[]): string {
  return items
    .map((item) => {
      const name = item.products?.name?.trim() || item.product_name;
      return `${name} × ${item.qty}`;
    })
    .join(", ");
}

function orderTotal(items: OrderItemWithProduct[]): number {
  return items.reduce((sum, item) => sum + item.unit_price_rub * item.qty, 0);
}

/** Maps DB order rows into flat Excel sheet rows. */
export function ordersToExcelRows(orders: OrderWithItems[]): ExportOrderRow[] {
  return orders.map((order) => {
    const items = order.order_items ?? [];
    return {
      "Дата заказа": formatOrderDate(order.created_at),
      "Имя клиента": order.customer_name,
      Телефон: order.customer_phone,
      "Состав заказа": compositionLine(items),
      "Сумма (руб.)": orderTotal(items),
    };
  });
}

/**
 * Fetches all orders for a tenant and downloads an `.xlsx` file in the browser.
 * @throws When the Supabase query fails.
 */
export async function downloadOrdersExcel(
  sb: SupabaseClient<Database>,
  tenantId: string,
): Promise<void> {
  const { data, error } = await sb
    .from("orders")
    .select(
      `
      customer_name,
      customer_phone,
      created_at,
      order_items (
        product_name,
        qty,
        unit_price_rub,
        products ( name )
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = ordersToExcelRows((data ?? []) as OrderWithItems[]);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 56 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Заказы");

  const now = new Date();
  const fileDate = `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`;
  XLSX.writeFile(workbook, `terra-flora-orders-${fileDate}.xlsx`);
}
