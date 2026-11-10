-- Popular filter flag for storefront «Популярные букеты»
alter table public.products
  add column if not exists is_popular boolean not null default false;
