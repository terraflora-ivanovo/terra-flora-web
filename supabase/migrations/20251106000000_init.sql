-- Flora SaaS: multi-tenant flower boutique schema

create extension if not exists "pgcrypto";

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null,
  phone text not null,
  address text not null,
  tagline text not null default '',
  about text not null default '',
  hero_image_path text,
  steps jsonb not null default '[]'::jsonb,
  brand jsonb not null default '{}'::jsonb,
  owner_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint tenants_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  unique (tenant_id, slug),
  unique (tenant_id, id)
);

create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  slug text not null,
  unique (tenant_id, slug),
  unique (tenant_id, id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  category_id uuid,
  name text not null,
  slug text not null,
  description text not null default '',
  price_rub int not null default 0 check (price_rub >= 0),
  image_path text,
  is_custom boolean not null default false,
  in_stock boolean not null default true,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (tenant_id, id),
  constraint products_category_tenant_fk
    foreign key (tenant_id, category_id)
    references public.categories (tenant_id, id)
    on delete set null
);

create table public.product_tag_map (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  product_id uuid not null,
  tag_id uuid not null,
  primary key (product_id, tag_id),
  constraint product_tag_map_product_fk
    foreign key (tenant_id, product_id)
    references public.products (tenant_id, id)
    on delete cascade,
  constraint product_tag_map_tag_fk
    foreign key (tenant_id, tag_id)
    references public.product_tags (tenant_id, id)
    on delete cascade
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  comment text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'done', 'cancelled')),
  is_custom_request boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  order_id uuid not null,
  product_id uuid,
  product_name text not null,
  unit_price_rub int not null default 0 check (unit_price_rub >= 0),
  qty int not null default 1 check (qty > 0),
  constraint order_items_order_fk
    foreign key (tenant_id, order_id)
    references public.orders (tenant_id, id)
    on delete cascade,
  constraint order_items_product_fk
    foreign key (tenant_id, product_id)
    references public.products (tenant_id, id)
    on delete set null
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index products_tenant_published_idx on public.products (tenant_id, is_published, sort_order);
create index orders_tenant_created_idx on public.orders (tenant_id, created_at desc);

create or replace function public.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants t
    where t.id = p_tenant_id and t.owner_user_id = auth.uid()
  );
$$;

create or replace function public.set_products_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

alter table public.tenants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_tags enable row level security;
alter table public.product_tag_map enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.push_subscriptions enable row level security;

create policy tenants_public_read on public.tenants
  for select to anon, authenticated using (true);

create policy tenants_owner_update on public.tenants
  for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy categories_public_read on public.categories
  for select to anon, authenticated using (true);

create policy categories_owner_all on public.categories
  for all to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy products_public_read on public.products
  for select to anon, authenticated
  using (is_published = true or public.is_tenant_owner(tenant_id));

create policy products_owner_write on public.products
  for all to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy tags_public_read on public.product_tags
  for select to anon, authenticated using (true);

create policy tags_owner_write on public.product_tags
  for all to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy tag_map_public_read on public.product_tag_map
  for select to anon, authenticated using (true);

create policy tag_map_owner_write on public.product_tag_map
  for all to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy orders_anon_insert on public.orders
  for insert to anon, authenticated
  with check (exists (select 1 from public.tenants t where t.id = tenant_id));

create policy orders_owner_select on public.orders
  for select to authenticated
  using (public.is_tenant_owner(tenant_id));

create policy orders_owner_update on public.orders
  for update to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy order_items_anon_insert on public.order_items
  for insert to anon, authenticated
  with check (
    exists (select 1 from public.orders o where o.id = order_id and o.tenant_id = tenant_id)
  );

create policy order_items_owner_select on public.order_items
  for select to authenticated
  using (public.is_tenant_owner(tenant_id));

create policy push_owner_all on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid() and public.is_tenant_owner(tenant_id))
  with check (user_id = auth.uid() and public.is_tenant_owner(tenant_id));

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.tenants to anon, authenticated;
grant update on public.tenants to authenticated;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select on public.product_tags to anon, authenticated;
grant insert, update, delete on public.product_tags to authenticated;

grant select on public.product_tag_map to anon, authenticated;
grant insert, update, delete on public.product_tag_map to authenticated;

grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;

grant insert on public.order_items to anon, authenticated;
grant select on public.order_items to authenticated;

grant select, insert, update, delete on public.push_subscriptions to authenticated;

grant execute on function public.is_tenant_owner(uuid) to anon, authenticated;
