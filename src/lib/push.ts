import { trySupabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Subscribes the signed-in owner to Web Push for a tenant.
 * @returns `false` when push is unsupported, misconfigured, or upsert fails.
 */
export async function subscribeOwnerToPush(tenantId: string): Promise<boolean> {
  const sb = trySupabase();
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!sb || !vapid || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const { data: sessionData } = await sb.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    }));

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.["p256dh"] || !json.keys?.["auth"]) return false;

  const { error } = await sb.from("push_subscriptions").upsert(
    {
      tenant_id: tenantId,
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys["p256dh"],
      auth: json.keys["auth"],
    },
    { onConflict: "user_id,endpoint" },
  );

  return !error;
}
