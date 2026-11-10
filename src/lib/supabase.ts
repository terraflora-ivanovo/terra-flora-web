import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes("YOUR_PROJECT"),
);

let client: SupabaseClient<Database> | null = null;

/** Returns a typed Supabase client; throws if env vars are missing. */
export function getSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase не настроен. Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env",
    );
  }
  if (!client) {
    client = createClient<Database>(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "flora-owner-auth",
      },
    });
  }
  return client;
}

/** Safe access: `null` when env is not set (local demo mode). */
export function trySupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  return getSupabase();
}
