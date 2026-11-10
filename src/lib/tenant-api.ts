import type { Category, StorefrontProduct, Tenant } from "@/lib/database.types";
import type { BusinessJson } from "@/lib/schemas";
import { trySupabase } from "@/lib/supabase";
import demoBusiness from "../../business/terra-flora/business.json";

export type TenantBundle = {
  tenant: Tenant;
  products: StorefrontProduct[];
  /** Только категории, у которых есть ≥1 опубликованный товар. */
  categories: Category[];
};

const LOCAL_CUSTOM_ID = "local-custom";

/** Fixed seed id used by terra-flora import/seed scripts. */
const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Shop metadata only (no products) when the tenants row is missing in Supabase.
 * Products always come from the DB — never from business.json.
 */
function tenantMetaFromBusiness(slug: string): Tenant | null {
  const data = demoBusiness as BusinessJson;
  if (data.slug !== slug) return null;

  return {
    id: DEMO_TENANT_ID,
    slug: data.slug,
    name: data.name,
    city: data.city,
    phone: data.phone,
    address: data.address,
    tagline: data.tagline,
    about: data.about,
    hero_image_path: data.heroImage,
    steps: data.steps,
    brand: {},
    owner_user_id: null,
    created_at: new Date().toISOString(),
  };
}

/** Категории тенанта, в которых есть хотя бы один опубликованный товар. */
export async function loadPublishedCategories(tenantId: string): Promise<Category[]> {
  const sb = trySupabase();
  if (!sb) return [];

  const { data: published, error: pubErr } = await sb
    .from("products")
    .select("category_id")
    .eq("tenant_id", tenantId)
    .eq("is_published", true)
    .not("category_id", "is", null);

  if (pubErr) throw pubErr;

  const categoryIds = [
    ...new Set(
      (published ?? [])
        .map((row) => row.category_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (categoryIds.length === 0) return [];

  const { data, error } = await sb
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", categoryIds)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Loads tenant + published products from Supabase.
 * Never injects mock catalog products — only real DB rows.
 * If the tenants row is missing, uses business.json for shop metadata only.
 */
export async function loadTenantBySlug(slug: string): Promise<TenantBundle | null> {
  const sb = trySupabase();
  if (!sb) {
    const tenant = tenantMetaFromBusiness(slug);
    if (!tenant) return null;
    return { tenant, products: [], categories: [] };
  }

  const { data: tenantRow, error } = await sb
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;

  const tenant = tenantRow ?? tenantMetaFromBusiness(slug);
  if (!tenant) return null;

  const [{ data: products, error: pErr }, categories] = await Promise.all([
    sb
      .from("products")
      .select("*, product_tag_map(tag_id, product_tags(id, name, slug))")
      .eq("tenant_id", tenant.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    loadPublishedCategories(tenant.id),
  ]);

  if (pErr) throw pErr;

  const mapped: StorefrontProduct[] = (products ?? []).map((row) => {
    const raw = row as typeof row & {
      product_tag_map?: { product_tags: { id: string; name: string; slug: string } | null }[];
    };
    const tags =
      raw.product_tag_map
        ?.map((m) => m.product_tags)
        .filter((t): t is { id: string; name: string; slug: string } => Boolean(t)) ?? [];
    const { product_tag_map: _, ...product } = raw;
    return { ...product, tags };
  });

  return { tenant, products: mapped, categories };
}

/** True when the product is the individual/custom bouquet. */
export function isCustomProduct(p: StorefrontProduct): boolean {
  return p.is_custom || p.name === "Индивидуальный букет";
}

/** Synthetic card used when the DB has no `is_custom` product yet. */
export function makeLocalCustomProduct(tenant: Tenant): StorefrontProduct {
  const now = new Date().toISOString();
  return {
    id: LOCAL_CUSTOM_ID,
    tenant_id: tenant.id,
    category_id: null,
    name: "Индивидуальный букет",
    slug: "individualnyy-buket",
    description: "Оставьте контакты. Бюджет и состав обсудим по телефону.",
    price_rub: 0,
    image_path: tenant.hero_image_path,
    is_custom: true,
    in_stock: true,
    is_published: true,
    is_popular: true,
    sort_order: -1,
    created_at: now,
    updated_at: now,
    tags: [],
  };
}

/**
 * Sorts products with the individual bouquet first (index 0),
 * then by `sort_order` ascending.
 */
export function sortCustomFirst(products: StorefrontProduct[]): StorefrontProduct[] {
  return products.slice().sort((a, b) => {
    const aCustom = isCustomProduct(a);
    const bCustom = isCustomProduct(b);
    if (aCustom !== bCustom) return aCustom ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

/**
 * Always returns a list with the custom card first.
 * Injects a local custom product when none exists in the DB.
 */
export function withCustomFirst(
  products: StorefrontProduct[],
  tenant: Tenant,
): StorefrontProduct[] {
  const existing = products.find(isCustomProduct);
  if (existing) return sortCustomFirst(products);
  return [makeLocalCustomProduct(tenant), ...products];
}

/**
 * Published products that are either custom or in stock,
 * sorted with the individual bouquet first.
 */
export function visibleProducts(products: StorefrontProduct[]): StorefrontProduct[] {
  return sortCustomFirst(
    products.filter((p) => p.is_published && (p.is_custom || p.in_stock)),
  );
}

/** True when product_id is not a real DB uuid (local/demo placeholder). */
export function isLocalProductId(id: string): boolean {
  return id === LOCAL_CUSTOM_ID || id.startsWith("demo-") || id.startsWith("local-");
}
