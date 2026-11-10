import { createContext, useContext, type ReactNode } from "react";
import type { Category, StorefrontProduct, Tenant } from "@/lib/database.types";

export type TenantContextValue = {
  slug: string;
  tenant: Tenant;
  products: StorefrontProduct[];
  /** Категории с ≥1 опубликованным товаром. */
  categories: Category[];
  basePath: string;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContextValue;
  children: ReactNode;
}) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant: нет TenantProvider");
  return ctx;
}

/** Builds a storefront path under `/s/{slug}` (optional relative `path`). */
export function storePath(slug: string, path = ""): string {
  const clean = path.replace(/^\//, "");
  return clean ? `/s/${slug}/${clean}` : `/s/${slug}`;
}
