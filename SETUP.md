# SETUP: Flora Boutique SaaS

Шаблон витрины + кабинета владельца. Один JS/CSS-билд, один проект Supabase. Новый бизнес: новый `business/{slug}/` и импорт.

Подробный план: [ROADMAP.md](./ROADMAP.md).

## 1. Окружение

```bash
cp .env.example .env
npm install
```

Заполните в `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (только для скриптов, не светить на клиенте)
- `VITE_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (для Web Push)
- `VITE_DEFAULT_TENANT_SLUG=terra-flora`

Без Supabase витрина работает на демо-данных из `business/terra-flora/business.json`.

## 2. Supabase

1. Создайте проект.
2. SQL Editor: выполните `supabase/migrations/20251106000000_init.sql`.
3. Затем `supabase/seed.sql` (демо terra-flora).
4. Storage: bucket `product-images`, public read.
5. Auth: отключите публичный Sign up (или не публикуйте ссылку). Создайте пользователя-владельца вручную в Authentication.
6. Привяжите владельца:

```sql
update public.tenants
set owner_user_id = '<uuid из auth.users>'
where slug = 'terra-flora';
```

## 3. Картинки и конвейер

Положите файлы в `business/terra-flora/images/` (`hero.jpg`, `b1.jpg`...).

```bash
# подхватит .env если экспортируете переменные
export $(grep -v '^#' .env | xargs)
npm run import:business -- terra-flora
```

Скрипт обновит tenant, categories, tags, products и зальёт изображения в Storage.

## 4. Локальный запуск

```bash
npm run dev
```

Откройте `/` (редирект на `/s/terra-flora`) или сразу `/s/terra-flora`.

Кабинет: `/s/terra-flora/owner/login`.

## 5. PWA

Сборка регистрирует service worker (`injectManifest`, `src/sw.ts`).

```bash
npm run build
npm run preview
```

Проверяйте установку на HTTPS или localhost.

## 6. Web Push

1. Сгенерируйте VAPID-ключи (например `npx web-push generate-vapid-keys`).
2. Положите публичный ключ в `VITE_VAPID_PUBLIC_KEY`.
3. Задеплойте Edge Function `supabase/functions/notify-order` (см. папку) с секретами `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Триггер: Database Webhook на `insert` в `orders` → function URL.
5. После входа владелец может разрешить уведомления в браузере (подписка пишется в `push_subscriptions`).

## 7. Новый бутик

1. Скопируйте `business/terra-flora` → `business/my-shop`.
2. Правите `business.json` и картинки. Город в текстах не склоняйте шаблонно: для Иваново только «в Иваново».
3. Не используйте длинное тире (—) в текстах.
4. `npm run import:business -- my-shop`
5. Создайте owner-пользователя и привяжите `owner_user_id`.
6. Витрина: `/s/my-shop`, кабинет: `/s/my-shop/owner`.

Код React менять не нужно.

## 8. Что уже умеет продукт

- Витрина `/s/{slug}` с каталогом, корзиной, индивидуальным букетом
- Заказ без регистрации (имя + телефон), доставка/оплата по телефону
- Админка заказов и тумблеры «В наличии» / «Опубликован»
- RLS + tenant_id, демо-fallback без env
- PWA shell + заготовка push
