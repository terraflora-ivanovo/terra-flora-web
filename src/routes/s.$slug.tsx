import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

import { loadTenantBySlug } from "@/lib/tenant-api";
import { TenantProvider } from "@/lib/tenant-context";

export const Route = createFileRoute("/s/$slug")({
  loader: async ({ params }) => {
    const bundle = await loadTenantBySlug(params.slug);
    if (!bundle) throw notFound();
    return bundle;
  },
  component: StorefrontLayout,
});

function StorefrontLayout() {
  const { slug } = Route.useParams();
  const { tenant, products, categories } = Route.useLoaderData();

  return (
    <TenantProvider
      value={{
        slug,
        tenant,
        products,
        categories,
        basePath: `/s/${slug}`,
      }}
    >
      <Outlet />
    </TenantProvider>
  );
}
