#!/usr/bin/env node
/**
 * Конвейер: business/{slug}/business.json + images → Supabase
 * Usage: node scripts/import-business.mjs terra-flora
 * Needs: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("Укажите slug: node scripts/import-business.mjs terra-flora");
  process.exit(1);
}

const root = resolve(process.cwd(), "business", slug);
const jsonPath = join(root, "business.json");
if (!existsSync(jsonPath)) {
  console.error(`Нет файла ${jsonPath}`);
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Нужны VITE_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const business = JSON.parse(readFileSync(jsonPath, "utf8"));
const sb = createClient(url, key, { auth: { persistSession: false } });

async function upsertTenant() {
  const row = {
    slug: business.slug,
    name: business.name,
    city: business.city,
    phone: business.phone,
    address: business.address,
    tagline: business.tagline,
    about: business.about,
    hero_image_path: `${business.slug}/${business.heroImage}`,
    steps: business.steps,
    brand: {},
  };
  const { data, error } = await sb.from("tenants").upsert(row, { onConflict: "slug" }).select("*").single();
  if (error) throw error;
  return data;
}

async function syncCategories(tenantId) {
  const map = new Map();
  for (const c of business.categories ?? []) {
    const { data, error } = await sb
      .from("categories")
      .upsert(
        {
          tenant_id: tenantId,
          name: c.name,
          slug: c.slug,
          sort_order: c.sortOrder ?? 0,
        },
        { onConflict: "tenant_id,slug" },
      )
      .select("*")
      .single();
    if (error) throw error;
    map.set(c.slug, data.id);
  }
  return map;
}

async function syncTags(tenantId) {
  const map = new Map();
  for (const t of business.tags ?? []) {
    const { data, error } = await sb
      .from("product_tags")
      .upsert(
        { tenant_id: tenantId, name: t.name, slug: t.slug },
        { onConflict: "tenant_id,slug" },
      )
      .select("*")
      .single();
    if (error) throw error;
    map.set(t.slug, data.id);
  }
  return map;
}

async function uploadImages() {
  const imagesDir = join(root, "images");
  if (!existsSync(imagesDir)) {
    console.warn("Папка images не найдена, пропускаем загрузку файлов");
    return;
  }
  await sb.storage.createBucket("product-images", { public: true }).catch(() => null);
  for (const file of readdirSync(imagesDir)) {
    const buf = readFileSync(join(imagesDir, file));
    const path = `${slug}/${file}`;
    const { error } = await sb.storage.from("product-images").upload(path, buf, {
      upsert: true,
      contentType: file.endsWith(".png") ? "image/png" : "image/jpeg",
    });
    if (error) console.warn("upload", file, error.message);
    else console.log("uploaded", path);
  }
}

async function syncProducts(tenantId, catMap, tagMap) {
  for (const p of business.products ?? []) {
    const { data: product, error } = await sb
      .from("products")
      .upsert(
        {
          tenant_id: tenantId,
          category_id: p.categorySlug ? (catMap.get(p.categorySlug) ?? null) : null,
          name: p.name,
          slug: p.slug,
          description: p.description ?? "",
          price_rub: p.priceRub ?? 0,
          image_path: `${slug}/${p.image}`,
          is_custom: Boolean(p.isCustom),
          in_stock: p.inStock !== false,
          is_published: p.isPublished !== false,
          sort_order: p.sortOrder ?? 0,
        },
        { onConflict: "tenant_id,slug" },
      )
      .select("*")
      .single();
    if (error) throw error;

    await sb.from("product_tag_map").delete().eq("product_id", product.id);
    for (const tagSlug of p.tagSlugs ?? []) {
      const tagId = tagMap.get(tagSlug);
      if (!tagId) continue;
      const { error: mapErr } = await sb.from("product_tag_map").insert({
        tenant_id: tenantId,
        product_id: product.id,
        tag_id: tagId,
      });
      if (mapErr) throw mapErr;
    }
    console.log("product", p.slug);
  }
}

const tenant = await upsertTenant();
console.log("tenant", tenant.id);
const catMap = await syncCategories(tenant.id);
const tagMap = await syncTags(tenant.id);
await uploadImages();
await syncProducts(tenant.id, catMap, tagMap);
console.log("Готово:", slug);
