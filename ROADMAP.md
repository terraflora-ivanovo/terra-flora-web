# Роадмап: PWA-шаблон цветочного бутика (SaaS)

Цель: один статический фронт + один проект Supabase. Новый бизнес подключается через `business.json` и картинки, без переписывания кода.

Демо-тенант: `terra-flora` (текущий визуал Terra Flora сохраняется как дизайн-код).

---

## Решения (зафиксировано)

| Тема | Решение |
|------|---------|
| Роутер | Остаётся **TanStack Router** (уже в проекте). Миграция на React Router даст только шум и риск сломать витрину. |
| Хостинг фронта | Статика (Vite / TanStack Start SSR по возможности минимален для API-less клиента). |
| Backend | Только Supabase (Postgres, Auth, Storage, Edge Functions для Web Push). Node-сервер не вводим. |
| Мультитенантность | `tenant_id` во всех бизнес-таблицах, URL `/s/{slug}/` и `/s/{slug}/owner/`. |
| Источник правды | Конвейер: `business.json` + images → seed/import в БД. Runtime читает только БД. |
| Дизайн | Текущие токены, компоненты и композиции витрины не пересобираем. Допустимо: Manrope как `font-sans` (кириллица + цифры). |
| Тексты | Живой язык, без длинных тире (—). Город только «в Иваново» / «по Иваново». В шаге 03 «Как мы работаем» без «по Иваново». |
| Заказ | Без регистрации клиента. Корзина готовых букетов + карточка «Индивидуальный букет». Доставка и оплата по телефону. |
| Владелец | Только Supabase Auth (email/password). Публичной регистрации нет. |
| Уведомления | Web Push (VAPID) + запись подписки в Supabase; Edge Function шлёт push при новом заказе. |

---

## Целевая файловая архитектура (компактно)

```
business/terra-flora/
  business.json
  images/
supabase/
  migrations/
  seed.sql
  functions/notify-order/
src/
  lib/
    supabase.ts
    tenant.ts
    cart.ts
    schemas.ts          # Zod
    push.ts
  data/types.ts
  components/site/      # витрина (дизайн-код)
  components/owner/     # админка
  components/cart/
  routes/
    index.tsx           # редирект → /s/terra-flora
    s.$slug.tsx         # layout витрины (tenant loader)
    s.$slug.index.tsx
    s.$slug.catalog.tsx
    s.$slug.about.tsx
    s.$slug.contacts.tsx
    s.$slug.privacy.tsx
    s.$slug.offer.tsx
    s.$slug.cart.tsx
    s.$slug.owner.tsx           # layout + auth guard
    s.$slug.owner.index.tsx     # заказы
    s.$slug.owner.products.tsx
    s.$slug.owner.login.tsx
  sw.ts                 # injectManifest SW
scripts/
  import-business.mjs   # конвейер JSON → Supabase
```

Старые корневые маршруты (`/catalog`, `/about`…) либо редиректят на `/s/terra-flora/...`, либо удаляются после переноса, чтобы не плодить дубли.

---

## Схема данных (Supabase)

### `tenants`
- `id` uuid PK  
- `slug` text unique  
- `name`, `city`, `phone`, `address`, `tagline`, `about`  
- `brand` jsonb (цвета/имя логотипа при необходимости)  
- `owner_user_id` uuid → `auth.users`  
- `created_at`

### `categories`
- `id`, `tenant_id` → tenants  
- `name`, `slug`, `sort_order`  
- UNIQUE `(tenant_id, slug)`

### `products`
- `id`, `tenant_id`  
- `category_id` nullable  
- `name`, `slug`, `description`, `price_rub` int  
- `image_path` text (Storage)  
- `is_custom` boolean default false  -- «Индивидуальный букет»  
- `in_stock` boolean default true  
- `is_published` boolean default true  
- `sort_order`  
- UNIQUE `(tenant_id, slug)`  
- FK составной где нужно: `(tenant_id, category_id)` → categories

### `product_tags`
- `id`, `tenant_id`, `name`, `slug`  
- UNIQUE `(tenant_id, slug)`

### `product_tag_map`
- `tenant_id`, `product_id`, `tag_id`  
- PK `(product_id, tag_id)`  
- составные FK на products/tags с тем же `tenant_id`

### `orders`
- `id`, `tenant_id`  
- `customer_name`, `customer_phone`  
- `comment` text  
- `status` text check (`new` | `in_progress` | `done` | `cancelled`)  
- `is_custom_request` boolean  
- `created_at`

### `order_items`
- `id`, `tenant_id`, `order_id`, `product_id` nullable  
- `product_name` (снимок), `unit_price_rub`, `qty`  
- составной FK order → orders

### `push_subscriptions`
- `id`, `tenant_id`, `user_id` (владелец)  
- `endpoint`, `p256dh`, `auth`  
- UNIQUE `(user_id, endpoint)`

### RLS (принцип)
- Публичное чтение: опубликованные товары тенанта, публичные поля tenants.  
- Создание заказов: anon insert в `orders` / `order_items` только для существующего tenant.  
- Owner: select/update/insert/delete своих строк, где `tenant_id` связан с `auth.uid() = tenants.owner_user_id`.  
- Storage: публичный read витринных картинок; write только owner.  
- Строгие `REVOKE` / `GRANT` на anon/authenticated.

---

## Фазы разработки

### Фаза 0. Документы и контракты
- [x] Этот `ROADMAP.md`
- [x] `.env.example`
- [x] `SETUP.md`
- [x] Zod-схема `business.json`
- [x] Демо `business/terra-flora/business.json`

### Фаза 1. Инфраструктура
- [x] Зависимости: `@supabase/supabase-js`, `vite-plugin-pwa`, workbox
- [x] Клиенты Supabase (browser + типизация Database)
- [x] `TenantProvider` / loader по `slug`
- [x] Корзина в `localStorage` с ключом `flora-cart:{tenantId}`
- [x] При logout owner: `queryClient.clear()`

### Фаза 2. SQL
- [x] Миграции таблиц + индексы + RLS + GRANT
- [x] `seed.sql` для terra-flora (шаг 03 без «по Иваново»)
- [x] Storage bucket описывается в SETUP / import-скрипте

### Фаза 3. Маршруты и витрина
- [x] Layout `/s/$slug` с загрузкой тенанта
- [x] Главная, каталог, о нас, контакты, оферта, политика
- [x] Карточки из данных; скрытие out-of-stock / unpublished
- [x] Карточка `is_custom` «Индивидуальный букет»
- [x] Корзина + оформление (имя, телефон, согласие)
- [x] Заказ в Supabase (демо-режим без env пишет в console)
- [x] Редирект `/` → `/s/terra-flora`
- [x] Тексты: без длинных тире, «в Иваново»

### Фаза 4. Админка `/s/$slug/owner`
- [x] Login (без sign-up UI)
- [x] Guard: сессия + `owner_user_id`
- [x] Список заказов, смена статуса
- [x] Тумблеры in_stock / is_published
- [ ] Полный CRUD с загрузкой фото в UI (следующий инкремент; импорт через конвейер уже есть)

### Фаза 5. PWA
- [x] `vite-plugin-pwa` strategy `injectManifest`, `src/sw.ts`
- [x] Manifest
- [x] Offline shell (network-first / cache-first)

### Фаза 6. Web Push
- [x] VAPID в `.env.example`
- [x] Подписка owner после входа (`subscribeOwnerToPush`)
- [x] Edge Function `notify-order` (нужен деплой + webhook)

### Фаза 7. Конвейер и сдача
- [x] `scripts/import-business.mjs`
- [x] `SETUP.md`
- [x] `npm run build` проходит

---

## Порядок внедрения в коде (короткие шаги)

1. Контракты + env + supabase client  
2. Миграции + seed  
3. Роут `/s/$slug` + редирект с `/`  
4. Каталог и главная на данных БД (fallback на demo JSON если env пустой)  
5. Корзина и создание заказа  
6. Owner login + products + orders  
7. PWA  
8. Push  
9. Import-скрипт + SETUP  

Каждый шаг должен оставлять приложение собираемым (`npm run build`).

---

## Критерии готовности

- Витрина открывается по `/s/terra-flora` и выглядит как сейчас (дизайн-код).  
- Корзина и заказ пишутся в Supabase.  
- «Индивидуальный букет» оформляется без цены в корзине как custom request.  
- Owner управляет товарами и видит заказы.  
- PWA ставится на телефон.  
- Push о новом заказе доходит владельцу (при настроенных ключах).  
- Новый бутик: новый `business.json` + `npm run import:business` без правок React-кода.

---

## Вне скоупа (намеренно)

- Эквайринг, слоты доставки, публичная регистрация владельцев  
- Маркетплейс многих витрин на одном экране  
- Смена визуального языка / «редизайн админки в shadcn dashboard»
