import type { SupabaseClient } from "@supabase/supabase-js";

import { demoImages } from "@/lib/demo-assets";
import type { Database } from "@/lib/database.types";

export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Formats a ruble amount for UI; non-positive values become «по запросу». */
export function formatPriceRub(value: number): string {
  if (value <= 0) return "по запросу";
  return `${value.toLocaleString("ru-RU")} ₽`;
}

/**
 * Resolves a product image path to a browser-usable URL
 * (absolute URL, demo asset, or public Supabase Storage object).
 */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (
    path.startsWith("http") ||
    path.startsWith("/") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  // Vite-imported demo asset already resolved to a URL string
  if (path.includes("/assets/")) return path;

  const file = path.split("/").pop() ?? path;
  if (demoImages[file]) return demoImages[file] ?? null;

  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base || base.includes("YOUR_PROJECT")) return demoImages[file] ?? null;
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}

/**
 * Uploads a product photo to the `product-images` bucket as WebP.
 * @returns Storage object path `{tenantSlug}/{uuid}.webp`.
 */
export async function uploadProductImage(
  sb: SupabaseClient<Database>,
  tenantSlug: string,
  file: File,
): Promise<string> {
  const path = `${tenantSlug}/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
    upsert: false,
    contentType: "image/webp",
    cacheControl: "3600",
  });
  if (error) throw error;
  return path;
}
