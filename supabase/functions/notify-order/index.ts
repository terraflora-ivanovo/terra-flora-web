// Supabase Edge Function: Web Push при новом заказе
// Secrets: VAPID_PRIVATE_KEY, VAPID_SUBJECT, VITE_VAPID_PUBLIC_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const payload = await req.json();
    const record = payload.record ?? payload;
    const tenantId = record.tenant_id as string;
    if (!tenantId) throw new Error("tenant_id missing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId);
    if (error) throw error;

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") ?? "mailto:owner@example.com",
      Deno.env.get("VITE_VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const body = JSON.stringify({
      title: "Новый заказ",
      body: `${record.customer_name}: ${record.customer_phone}`,
    });

    await Promise.allSettled(
      (subs ?? []).map((s) =>
        webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
        ),
      ),
    );

    return new Response(JSON.stringify({ ok: true, sent: subs?.length ?? 0 }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
