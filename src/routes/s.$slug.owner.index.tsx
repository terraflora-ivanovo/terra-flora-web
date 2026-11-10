import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/database.types";
import { downloadOrdersExcel } from "@/lib/export-orders";
import { subscribeOwnerToPush } from "@/lib/push";
import { trySupabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { requireOwner } from "./s.$slug.owner";

export const Route = createFileRoute("/s/$slug/owner/")({
  beforeLoad: async ({ params }) => {
    const { loadTenantBySlug } = await import("@/lib/tenant-api");
    const bundle = await loadTenantBySlug(params.slug);
    await requireOwner(params.slug, bundle?.tenant.owner_user_id ?? null);
  },
  component: OwnerOrders,
});

const statuses: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Новый" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Готов" },
  { value: "cancelled", label: "Отменён" },
];

function OwnerOrders() {
  const { tenant } = useTenant();
  const sb = trySupabase();
  const qc = useQueryClient();
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    void subscribeOwnerToPush(tenant.id);
  }, [tenant.id]);

  const ordersQuery = useQuery({
    queryKey: ["owner-orders", tenant.id],
    queryFn: async () => {
      if (!sb) return [];
      const { data, error } = await sb
        .from("orders")
        .select("*, order_items(*)")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      if (!sb) throw new Error("Supabase не настроен");
      const { error } = await sb
        .from("orders")
        .update({ status })
        .eq("id", id)
        .eq("tenant_id", tenant.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-orders", tenant.id] }),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!sb) throw new Error("Supabase не настроен");
      await downloadOrdersExcel(sb, tenant.id);
    },
    onMutate: () => setExportError(null),
    onError: (err) => {
      setExportError(err instanceof Error ? err.message : "Не удалось скачать Excel");
    },
  });

  if (!sb) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-light text-primary">Заказы</h1>
        <p className="text-muted-foreground">
          Сейчас демо-режим без Supabase. Подключите проект по SETUP.md, чтобы видеть живые заявки.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-light text-primary">Заказы</h1>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-full px-6"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          <Download className="size-4" />
          {exportMutation.isPending ? "Скачиваем..." : "Скачать в Excel"}
        </Button>
      </div>
      {exportError ? <p className="text-sm text-berry">{exportError}</p> : null}
      {ordersQuery.isLoading ? <p className="text-muted-foreground">Загружаем...</p> : null}
      {ordersQuery.data?.length === 0 ? (
        <p className="text-muted-foreground">Пока нет заказов.</p>
      ) : null}
      <ul className="space-y-4">
        {(ordersQuery.data ?? []).map((order) => (
          <li key={order.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("ru-RU")}
                  {order.is_custom_request ? " · индивидуальный" : ""}
                </p>
              </div>
              <select
                className="rounded-full border border-border bg-transparent px-3 py-1.5 text-sm"
                value={order.status}
                onChange={(e) =>
                  statusMutation.mutate({ id: order.id, status: e.target.value as OrderStatus })
                }
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id}>
                  {item.product_name} × {item.qty}
                  {item.unit_price_rub > 0
                    ? ` · ${(item.unit_price_rub * item.qty).toLocaleString("ru-RU")} ₽`
                    : " · по запросу"}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
