import { useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createFileRoute,
  Link,
  redirect,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";

import { trySupabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/s/$slug/owner")({
  component: OwnerLayout,
});

function OwnerLayout() {
  const { slug, tenant } = useTenant();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname.endsWith("/owner/login");
  const sb = trySupabase();

  const logout = async () => {
    if (sb) await sb.auth.signOut();
    queryClient.clear();
    await router.navigate({ to: "/s/$slug/owner/login", params: { slug } });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {!isLogin ? (
        <header className="border-b border-border px-6 py-5 lg:px-10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Кабинет владельца</p>
              <p className="font-logo text-xl text-primary">{tenant.name}</p>
            </div>
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              <Link to="/s/$slug/owner" params={{ slug }} className="text-muted-foreground hover:text-primary">
                Заказы
              </Link>
              <Link
                to="/s/$slug/owner/products"
                params={{ slug }}
                className="text-muted-foreground hover:text-primary"
              >
                Товары
              </Link>
              <Link to="/s/$slug" params={{ slug }} className="text-muted-foreground hover:text-primary">
                На витрину
              </Link>
              <button type="button" onClick={logout} className="text-berry hover:opacity-80">
                Выйти
              </button>
            </nav>
          </div>
        </header>
      ) : null}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}

/** Проверка: сессия + owner_user_id тенанта. Без Supabase пускаем в демо-режим. */
export async function requireOwner(slug: string, tenantOwnerId: string | null) {
  const sb = trySupabase();
  if (!sb) return { mode: "demo" as const, userId: null };

  const { data } = await sb.auth.getSession();
  const userId = data.session?.user.id ?? null;
  if (!userId) {
    throw redirect({ to: "/s/$slug/owner/login", params: { slug } });
  }
  if (tenantOwnerId && tenantOwnerId !== userId) {
    throw redirect({ to: "/s/$slug/owner/login", params: { slug } });
  }
  return { mode: "auth" as const, userId };
}
