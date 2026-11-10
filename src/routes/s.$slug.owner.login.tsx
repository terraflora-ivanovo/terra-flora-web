import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { trySupabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/s/$slug/owner/login")({
  component: OwnerLogin,
});

const inputCls =
  "w-full rounded-lg border border-input bg-transparent px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
const btnCls =
  "w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-berry disabled:opacity-50";

function OwnerLogin() {
  const { slug } = useTenant();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sb = trySupabase();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sb) {
      setError("Supabase не настроен. Для демо откройте /owner без логина после настройки .env");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError("Неверный email или пароль");
      return;
    }
    await router.navigate({ to: "/s/$slug/owner", params: { slug } });
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-light text-primary">Вход для владельца</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Публичной регистрации нет. Аккаунт выдаёт администратор SaaS.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium" htmlFor="owner-email">
            Email
          </label>
          <input
            id="owner-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputCls} mt-1.5`}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="owner-password">
            Пароль
          </label>
          <input
            id="owner-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputCls} mt-1.5`}
            required
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button type="submit" className={btnCls} disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
