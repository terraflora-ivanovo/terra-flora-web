import type { Category, StorefrontProduct, Tenant } from "@/lib/database.types";
import { demoImages } from "@/lib/demo-assets";
import type { BusinessJson } from "@/lib/schemas";
import { trySupabase } from "@/lib/supabase";
import demoBusiness from "../../business/terra-flora/business.json";

export type TenantBundle = {
  tenant: Tenant;
  products: StorefrontProduct[];
  /** Только категории, у которых есть ≥1 опубликованный товар. */
  categories: Category[];
};

function demoTenantBundle(slug: string): TenantBundle | null {
  const data = demoBusiness as BusinessJson;
  if (data.slug !== slug) return null;

  const tenantId = "00000000-0000-4000-8000-000000000001";
  const tenant: Tenant = {
    id: tenantId,
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

  const categoriesAll: Category[] = data.categories.map((c, i) => ({
    id: `demo-cat-${c.slug}`,
    tenant_id: tenantId,
    name: c.name,
    slug: c.slug,
    sort_order: c.sortOrder ?? i,
  }));
  const catBySlug = Object.fromEntries(categoriesAll.map((c) => [c.slug, c]));

  const tagBySlug = Object.fromEntries(data.tags.map((t, i) => [t.slug, { id: `tag-${i}`, ...t }]));

  const products: StorefrontProduct[] = data.products.map((p, i) => ({
    id: `demo-product-${i}`,
    tenant_id: tenantId,
    category_id: p.categorySlug ? (catBySlug[p.categorySlug]?.id ?? null) : null,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price_rub: p.priceRub,
    image_path: demoImages[p.image] ?? p.image,
    is_custom: p.isCustom,
    in_stock: p.inStock,
    is_published: p.isPublished,
    is_popular: p.isPopular ?? false,
    sort_order: p.sortOrder,
    created_at: tenant.created_at,
    updated_at: tenant.created_at,
    tags: p.tagSlugs
      .map((s) => tagBySlug[s])
      .filter(Boolean)
      .map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  }));

  const publishedCategoryIds = new Set(
    products.filter((p) => p.is_published).map((p) => p.category_id).filter(Boolean),
  );
  const categories = categoriesAll
    .filter((c) => publishedCategoryIds.has(c.id))
    .sort((a, b) => a.sort_order - b.sort_order);

  return { tenant, products, categories };
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
 * Loads tenant, published products, and non-empty categories by slug.
 * Falls back to bundled `business.json` demo data when Supabase is unavailable.
 */
export async function loadTenantBySlug(slug: string): Promise<TenantBundle | null> {
  const sb = trySupabase();
  if (!sb) return demoTenantBundle(slug);

  const { data: tenant, error } = await sb.from("tenants").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!tenant) return demoTenantBundle(slug);

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
 * Published products that are either custom or in stock,
 * sorted with the individual bouquet first.
 */
export function visibleProducts(products: StorefrontProduct[]): StorefrontProduct[] {
  return sortCustomFirst(
    products.filter((p) => p.is_published && (p.is_custom || p.in_stock)),
  );
}
